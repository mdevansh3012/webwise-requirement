import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Save, 
  ArrowLeft, 
  Trash2, 
  GripVertical,
  Type,
  AlignLeft,
  Mail,
  Hash,
  Calendar,
  ListChecks,
  CircleDot,
  CheckSquare
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SectionBuilder, Section } from "@/components/SectionBuilder";
import { ConditionalLogic, QuestionCondition } from "@/components/ConditionalLogic";
import { QuestionCard } from "@/components/QuestionCard";

type QuestionType = "text" | "textarea" | "email" | "number" | "date" | "select" | "radio" | "checkbox";

interface Question {
  id?: string;
  type: QuestionType;
  label: string;
  placeholder: string;
  options: string[];
  is_required: boolean;
  order_index: number;
  section_id?: string;
  conditions: QuestionCondition[];
}

const questionTypes = [
  { value: "text", label: "Text Input", icon: Type },
  { value: "textarea", label: "Text Area", icon: AlignLeft },
  { value: "email", label: "Email", icon: Mail },
  { value: "number", label: "Number", icon: Hash },
  { value: "date", label: "Date", icon: Calendar },
  { value: "select", label: "Dropdown", icon: ListChecks },
  { value: "radio", label: "Radio Buttons", icon: CircleDot },
  { value: "checkbox", label: "Checkboxes", icon: CheckSquare },
];

const FormBuilder = () => {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditing = !!editId;
  
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [clientName, setClientName] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      
      if (isEditing) {
        await loadForm();
      }
    };

    checkAuth();
  }, [isEditing, editId]);

  const loadForm = async () => {
    if (!editId) return;
    
    setIsLoading(true);
    try {
      const { data: form, error: formError } = await supabase
        .from("forms")
        .select("*")
        .eq("id", editId)
        .single();

      if (formError) throw formError;

      // Load sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from("sections")
        .select("*")
        .eq("form_id", editId)
        .order("order_index");

      if (sectionsError) throw sectionsError;

      // Load questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq("form_id", editId)
        .order("order_index");

      if (questionsError) throw questionsError;

      // Load question conditions
      const { data: conditionsData, error: conditionsError } = await supabase
        .from("question_conditions")
        .select("*")
        .in("question_id", questionsData?.map(q => q.id) || []);

      if (conditionsError) throw conditionsError;

      setFormTitle(form.title);
      setFormDescription(form.description || "");
      setClientName(form.client_name);
      
      setSections(sectionsData.map(s => ({
        id: s.id,
        title: s.title,
        description: s.description || "",
        order_index: s.order_index,
        questions: []
      })));

      setQuestions(questionsData.map(q => ({
        id: q.id,
        type: q.type as QuestionType,
        label: q.label,
        placeholder: q.placeholder || "",
        options: Array.isArray(q.options) ? q.options.map(opt => String(opt)) : [],
        is_required: q.is_required,
        order_index: q.order_index,
        section_id: q.section_id || undefined,
        conditions: conditionsData.filter(c => c.question_id === q.id).map(c => ({
          id: c.id,
          condition_question_id: c.condition_question_id,
          condition_operator: c.condition_operator as any,
          condition_value: c.condition_value
        }))
      })));

      // Expand sections that have questions
      const sectionsWithQuestions = new Set(questionsData.filter(q => q.section_id).map(q => 
        sectionsData.findIndex(s => s.id === q.section_id)
      ).filter(index => index !== -1));
      
      if (sectionsWithQuestions.size > 0) {
        setExpandedSections(sectionsWithQuestions);
      } else {
        setExpandedSections(new Set([0]));
      }
    } catch (error) {
      console.error("Error loading form:", error);
      toast({
        title: "Error loading form",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addQuestion = (sectionIndex?: number) => {
    let sectionId: string | undefined = undefined;
    
    if (sectionIndex !== undefined && sections[sectionIndex]) {
      const section = sections[sectionIndex];
      sectionId = section.id || `temp_section_${sectionIndex}`;
    }
    
    const newQuestion: Question = {
      type: "text",
      label: "New Question",
      placeholder: "",
      options: [],
      is_required: false,
      order_index: questions.length,
      section_id: sectionId,
      conditions: []
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index);
    // Update order_index for remaining questions
    updated.forEach((q, i) => {
      q.order_index = i;
    });
    setQuestions(updated);
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === questions.length - 1)
    ) {
      return;
    }

    const updated = [...questions];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
    
    // Update order_index
    updated.forEach((q, i) => {
      q.order_index = i;
    });
    
    setQuestions(updated);
  };

  const handleOptionsChange = (questionIndex: number, optionsText: string) => {
    const options = optionsText
      .split("\n")
      .map(option => option.trim())
      .filter(option => option.length > 0);
    updateQuestion(questionIndex, "options", options);
  };

  const saveForm = async () => {
    if (!formTitle.trim() || !clientName.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please fill in the form title and client name.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      let formId = editId;

      if (isEditing) {
        // Update existing form
        const { error: formError } = await supabase
          .from("forms")
          .update({
            title: formTitle,
            description: formDescription,
            client_name: clientName,
          })
          .eq("id", editId);

        if (formError) throw formError;

        // Delete existing sections, questions, and conditions
        const { error: deleteConditionsError } = await supabase
          .from("question_conditions")
          .delete()
          .in("question_id", 
            await supabase.from("questions").select("id").eq("form_id", editId)
              .then(({ data }) => data?.map(q => q.id) || [])
          );

        if (deleteConditionsError) throw deleteConditionsError;

        const { error: deleteQuestionsError } = await supabase
          .from("questions")
          .delete()
          .eq("form_id", editId);

        if (deleteQuestionsError) throw deleteQuestionsError;

        const { error: deleteSectionsError } = await supabase
          .from("sections")
          .delete()
          .eq("form_id", editId);

        if (deleteSectionsError) throw deleteSectionsError;
      } else {
        // Create new form
        const { data: newForm, error: formError } = await supabase
          .from("forms")
          .insert({
            title: formTitle,
            description: formDescription,
            client_name: clientName,
          })
          .select()
          .single();

        if (formError) throw formError;
        formId = newForm.id;
      }

      // Insert sections first
      const sectionIdMap = new Map<string, string>();
      if (sections.length > 0) {
        const sectionsToInsert = sections.map(s => ({
          form_id: formId,
          title: s.title,
          description: s.description,
          order_index: s.order_index,
        }));

        const { data: insertedSections, error: sectionsError } = await supabase
          .from("sections")
          .insert(sectionsToInsert)
          .select();

        if (sectionsError) throw sectionsError;

        // Map old section IDs to new ones
        insertedSections?.forEach((section, index) => {
          const originalSection = sections[index];
          if (originalSection.id) {
            sectionIdMap.set(sections[index].id!, section.id);
          }
          sectionIdMap.set(`temp_section_${index}`, section.id);
        });
      }

      // Insert questions
      if (questions.length > 0) {
        const questionsToInsert = questions.map(q => ({
          form_id: formId,
          type: q.type,
          label: q.label,
          placeholder: q.placeholder,
          options: q.options,
          is_required: q.is_required,
          order_index: q.order_index,
          section_id: q.section_id ? sectionIdMap.get(q.section_id) || q.section_id : null,
        }));

        const { data: insertedQuestions, error: questionsError } = await supabase
          .from("questions")
          .insert(questionsToInsert)
          .select();

        if (questionsError) throw questionsError;

        // Insert question conditions
        const allConditions: any[] = [];
        questions.forEach((question, questionIndex) => {
          if (question.conditions && question.conditions.length > 0) {
            const questionId = insertedQuestions?.[questionIndex]?.id;
            if (questionId) {
              question.conditions.forEach(condition => {
                allConditions.push({
                  question_id: questionId,
                  condition_question_id: condition.condition_question_id,
                  condition_operator: condition.condition_operator,
                  condition_value: condition.condition_value,
                });
              });
            }
          }
        });

        if (allConditions.length > 0) {
          const { error: conditionsError } = await supabase
            .from("question_conditions")
            .insert(allConditions);

          if (conditionsError) throw conditionsError;
        }
      }

      toast({
        title: isEditing ? "Form updated!" : "Form created!",
        description: `Your questionnaire for ${clientName} has been ${isEditing ? "updated" : "created"} successfully.`,
      });

      navigate("/admin");
    } catch (error) {
      console.error("Error saving form:", error);
      toast({
        title: "Error saving form",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">Loading form builder...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate("/admin")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
              <h1 className="text-xl font-semibold">
                {isEditing ? "Edit Form" : "Form Builder"}
              </h1>
            </div>
            <Button onClick={saveForm} disabled={isSaving} className="shadow-elegant">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Form"}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Form Details */}
          <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle>Form Details</CardTitle>
              <CardDescription>
                Basic information about your questionnaire
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="form-title">Form Title *</Label>
                  <Input
                    id="form-title"
                    placeholder="Requirements Gathering Questionnaire"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-name">Client Name *</Label>
                  <Input
                    id="client-name"
                    placeholder="acme-corp"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    disabled={isEditing}
                  />
                  {clientName && (
                    <p className="text-sm text-muted-foreground">
                      Form will be available at: /{clientName}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="form-description">Description</Label>
                <Textarea
                  id="form-description"
                  placeholder="Brief description of the questionnaire purpose..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sections & Questions */}
          <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Form Structure</CardTitle>
              <CardDescription>
                Organize your form with sections and questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SectionBuilder
                sections={sections}
                onAddSection={() => {
                  const newSection: Section = {
                    title: "New Section",
                    description: "",
                    order_index: sections.length,
                    questions: []
                  };
                  setSections([...sections, newSection]);
                  setExpandedSections(new Set([...expandedSections, sections.length]));
                }}
                onUpdateSection={(index, field, value) => {
                  const updated = [...sections];
                  updated[index] = { ...updated[index], [field]: value };
                  setSections(updated);
                }}
                onRemoveSection={(index) => {
                  const updated = sections.filter((_, i) => i !== index);
                  updated.forEach((s, i) => {
                    s.order_index = i;
                  });
                  setSections(updated);
                }}
                onMoveSection={(index, direction) => {
                  if (
                    (direction === "up" && index === 0) ||
                    (direction === "down" && index === sections.length - 1)
                  ) {
                    return;
                  }
                  const updated = [...sections];
                  const targetIndex = direction === "up" ? index - 1 : index + 1;
                  [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
                  updated.forEach((s, i) => {
                    s.order_index = i;
                  });
                  setSections(updated);
                }}
                onToggleSection={(index) => {
                  const newExpanded = new Set(expandedSections);
                  if (newExpanded.has(index)) {
                    newExpanded.delete(index);
                  } else {
                    newExpanded.add(index);
                  }
                  setExpandedSections(newExpanded);
                }}
                expandedSections={expandedSections}
              >
                {(sectionIndex) => (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <Button onClick={() => addQuestion(sectionIndex)} variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Question to Section
                      </Button>
                    </div>
                    {questions
                      .filter(q => {
                        const section = sections[sectionIndex];
                        if (!section) return false;
                        
                        // Handle both real IDs and temporary IDs
                        return q.section_id === section.id || 
                               q.section_id === `temp_section_${sectionIndex}`;
                      })
                      .map((question, qIndex) => {
                        const globalIndex = questions.findIndex(q => q === question);
                        return (
                          <QuestionCard
                            key={globalIndex}
                            question={question}
                            index={globalIndex}
                            questions={questions}
                            onUpdate={updateQuestion}
                            onRemove={removeQuestion}
                            onMove={moveQuestion}
                            onOptionsChange={handleOptionsChange}
                          />
                        );
                      })}
                  </div>
                )}
              </SectionBuilder>

              {/* Standalone Questions */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Standalone Questions</h3>
                    <p className="text-sm text-muted-foreground">
                      Questions not assigned to any section
                    </p>
                  </div>
                  <Button onClick={() => addQuestion()} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </div>
                <div className="space-y-4">
                  {questions
                    .filter(q => {
                      if (!q.section_id) return true;
                      
                      // Check if it's a temporary section ID that exists
                      if (q.section_id.startsWith('temp_section_')) {
                        const sectionIndex = parseInt(q.section_id.replace('temp_section_', ''));
                        return !sections[sectionIndex];
                      }
                      
                      // Check if it's a real section ID that exists
                      return !sections.some(s => s.id === q.section_id);
                    })
                    .map((question, qIndex) => {
                      const globalIndex = questions.findIndex(q => q === question);
                      return (
                        <QuestionCard
                          key={globalIndex}
                          question={question}
                          index={globalIndex}
                          questions={questions}
                          onUpdate={updateQuestion}
                          onRemove={removeQuestion}
                          onMove={moveQuestion}
                          onOptionsChange={handleOptionsChange}
                        />
                      );
                    })}
                </div>
                
                {questions.filter(q => {
                  if (!q.section_id) return true;
                  if (q.section_id.startsWith('temp_section_')) {
                    const sectionIndex = parseInt(q.section_id.replace('temp_section_', ''));
                    return !sections[sectionIndex];
                  }
                  return !sections.some(s => s.id === q.section_id);
                }).length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                    <div className="text-muted-foreground mb-4">No standalone questions yet</div>
                    <Button onClick={() => addQuestion()} className="shadow-elegant">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Question
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;