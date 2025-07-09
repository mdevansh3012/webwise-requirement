import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { 
  ClipboardList, 
  Send, 
  CheckCircle2, 
  ArrowLeft,
  Calendar as CalendarIcon 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Form {
  id: string;
  title: string;
  description: string | null;
  client_name: string;
}

interface Section {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
}

interface Question {
  id: string;
  type: string;
  label: string;
  placeholder: string | null;
  options: string[] | null;
  is_required: boolean;
  order_index: number;
  section_id: string | null;
}

const ClientForm = () => {
  const { clientName } = useParams<{ clientName: string }>();
  const navigate = useNavigate();
  
  // Fix the URL parsing issue by extracting only the client name
  const actualClientName = clientName?.split('?')[0] || clientName;
  
  const [form, setForm] = useState<Form | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadForm();
  }, [clientName]);

  const loadForm = async () => {
    if (!actualClientName) return;

    try {
      // Load form
      const { data: formData, error: formError } = await supabase
        .from("forms")
        .select("*")
        .eq("client_name", actualClientName)
        .eq("is_active", true)
        .single();

      if (formError) {
        if (formError.code === "PGRST116") {
          // No form found
          setForm(null);
        } else {
          throw formError;
        }
        return;
      }

      // Load sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from("sections")
        .select("*")
        .eq("form_id", formData.id)
        .order("order_index");

      if (sectionsError) throw sectionsError;

      // Load questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq("form_id", formData.id)
        .order("order_index");

      if (questionsError) throw questionsError;

      setForm(formData);
      setSections(sectionsData || []);
      setQuestions((questionsData || []).map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options.map(String) : null
      })));
    } catch (error) {
      console.error("Error loading form:", error);
      toast({
        title: "Error loading form",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const validateCurrentStep = () => {
    const question = questions[currentStep];
    if (question.is_required) {
      const answer = answers[question.id];
      if (!answer || (Array.isArray(answer) && answer.length === 0) || answer === "") {
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (!validateCurrentStep()) {
      toast({
        title: "Required field",
        description: "Please answer this required question before proceeding.",
        variant: "destructive",
      });
      return;
    }

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!form) return;

    // Validate all required questions
    const unansweredRequired = questions.filter(q => {
      const answer = answers[q.id];
      return q.is_required && (!answer || (Array.isArray(answer) && answer.length === 0) || answer === "");
    });

    if (unansweredRequired.length > 0) {
      toast({
        title: "Missing required answers",
        description: "Please answer all required questions.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const responses = Object.entries(answers).map(([questionId, answer]) => ({
        form_id: form.id,
        question_id: questionId,
        answer: answer,
        session_id: sessionId,
      }));

      const { error } = await supabase
        .from("responses")
        .insert(responses);

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: "Thank you!",
        description: "Your responses have been submitted successfully.",
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Submission failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (question: Question) => {
    const value = answers[question.id];

    switch (question.type) {
      case "text":
      case "email":
      case "number":
        return (
          <Input
            type={question.type}
            placeholder={question.placeholder || ""}
            value={value || ""}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="text-lg p-4"
          />
        );

      case "textarea":
        return (
          <Textarea
            placeholder={question.placeholder || ""}
            value={value || ""}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="text-lg p-4 min-h-[120px]"
          />
        );

      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal text-lg p-4",
                  !value && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => handleAnswerChange(question.id, date?.toISOString())}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        );

      case "select":
        return (
          <Select value={value || ""} onValueChange={(val) => handleAnswerChange(question.id, val)}>
            <SelectTrigger className="text-lg p-4">
              <SelectValue placeholder={question.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "radio":
        return (
          <RadioGroup
            value={value || ""}
            onValueChange={(val) => handleAnswerChange(question.id, val)}
            className="space-y-3"
          >
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-3">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`} className="text-lg">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "checkbox":
        const selectedOptions = value || [];
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-3">
                <Checkbox
                  id={`${question.id}-${index}`}
                  checked={selectedOptions.includes(option)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleAnswerChange(question.id, [...selectedOptions, option]);
                    } else {
                      handleAnswerChange(question.id, selectedOptions.filter((o: string) => o !== option));
                    }
                  }}
                />
                <Label htmlFor={`${question.id}-${index}`} className="text-lg">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <ClipboardList className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading questionnaire...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto shadow-elegant border-0 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <ClipboardList className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Form Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The questionnaire for "{actualClientName}" could not be found or is not currently active.
            </p>
            <Button onClick={() => navigate("/")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto shadow-elegant border-0 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
            <p className="text-muted-foreground mb-6">
              Your responses have been submitted successfully. We appreciate your time and input.
            </p>
            <Button onClick={() => navigate("/")} className="shadow-elegant">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <ClipboardList className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold text-primary">RequireFlow</span>
            </div>
            <h1 className="text-2xl font-bold">{form.title}</h1>
            {form.description && (
              <p className="text-muted-foreground mt-2">{form.description}</p>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Question {currentStep + 1} of {questions.length}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Section Header */}
          {currentQuestion.section_id && sections.length > 0 && (() => {
            const currentSection = sections.find(s => s.id === currentQuestion.section_id);
            const isFirstQuestionInSection = currentStep === 0 || 
              questions[currentStep - 1]?.section_id !== currentQuestion.section_id;
            
            if (currentSection && isFirstQuestionInSection) {
              return (
                <Card className="shadow-soft border-0 bg-primary/5 backdrop-blur-sm mb-6">
                  <CardContent className="p-4">
                    <h2 className="text-lg font-semibold text-primary mb-1">
                      {currentSection.title}
                    </h2>
                    {currentSection.description && (
                      <p className="text-sm text-muted-foreground">
                        {currentSection.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            }
            return null;
          })()}

          {/* Question Card */}
          <Card className="shadow-elegant border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl">
                {currentQuestion.label}
                {currentQuestion.is_required && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </CardTitle>
              {currentQuestion.placeholder && (
                <CardDescription className="text-base">
                  {currentQuestion.placeholder}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {renderQuestion(currentQuestion)}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="shadow-soft"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <Button
              onClick={nextStep}
              disabled={isSubmitting}
              className="shadow-elegant"
            >
              {isSubmitting ? (
                "Submitting..."
              ) : currentStep === questions.length - 1 ? (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit
                </>
              ) : (
                "Next"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientForm;