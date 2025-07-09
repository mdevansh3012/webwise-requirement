import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  Download, 
  Calendar,
  User,
  FileText
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface FormData {
  id: string;
  title: string;
  client_name: string;
  description: string;
}

interface ResponseData {
  session_id: string;
  created_at: string;
  responses: {
    question_id: string;
    question_label: string;
    question_type: string;
    answer: any;
  }[];
}

const FormResponses = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FormData | null>(null);
  const [responses, setResponses] = useState<ResponseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      
      await loadFormAndResponses();
    };

    checkAuth();
  }, [formId]);

  const loadFormAndResponses = async () => {
    if (!formId) return;
    
    setIsLoading(true);
    try {
      // Load form data
      const { data: form, error: formError } = await supabase
        .from("forms")
        .select("*")
        .eq("id", formId)
        .single();

      if (formError) throw formError;
      setFormData(form);

      // Load questions
      const { data: questions, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq("form_id", formId)
        .order("order_index");

      if (questionsError) throw questionsError;

      // Load responses
      const { data: rawResponses, error: responsesError } = await supabase
        .from("responses")
        .select("*")
        .eq("form_id", formId)
        .order("created_at", { ascending: false });

      if (responsesError) throw responsesError;

      // Group responses by session_id
      const groupedResponses: { [key: string]: ResponseData } = {};
      
      rawResponses.forEach((response) => {
        const sessionId = response.session_id;
        
        if (!groupedResponses[sessionId]) {
          groupedResponses[sessionId] = {
            session_id: sessionId,
            created_at: response.created_at,
            responses: []
          };
        }
        
        const question = questions.find(q => q.id === response.question_id);
        if (question) {
          groupedResponses[sessionId].responses.push({
            question_id: response.question_id,
            question_label: question.label,
            question_type: question.type,
            answer: response.answer
          });
        }
      });

      setResponses(Object.values(groupedResponses));
    } catch (error) {
      console.error("Error loading form responses:", error);
      toast({
        title: "Error loading responses",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportResponses = () => {
    if (!formData || responses.length === 0) return;

    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${formData.client_name}_responses.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateCSV = () => {
    if (responses.length === 0) return '';

    // Get all unique questions
    const allQuestions = Array.from(
      new Set(responses.flatMap(r => r.responses.map(res => res.question_label)))
    );

    // CSV headers
    const headers = ['Submission Date', 'Session ID', ...allQuestions];
    
    // CSV rows
    const rows = responses.map(response => {
      const row = [
        format(new Date(response.created_at), 'yyyy-MM-dd HH:mm:ss'),
        response.session_id
      ];
      
      allQuestions.forEach(questionLabel => {
        const answer = response.responses.find(r => r.question_label === questionLabel);
        if (answer) {
          let value = answer.answer;
          if (Array.isArray(value)) {
            value = value.join(', ');
          } else if (typeof value === 'object') {
            value = JSON.stringify(value);
          }
          row.push(String(value).replace(/"/g, '""'));
        } else {
          row.push('');
        }
      });
      
      return row;
    });

    return [headers, ...rows].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
  };

  const formatAnswer = (answer: any, type: string) => {
    if (answer === null || answer === undefined) return "No answer";
    
    if (Array.isArray(answer)) {
      return answer.join(", ");
    }
    
    if (type === "date") {
      return format(new Date(answer), "PPP");
    }
    
    return String(answer);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">Loading responses...</div>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="text-destructive">Form not found</div>
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
              <div>
                <h1 className="text-xl font-semibold">{formData.title} - Responses</h1>
                <p className="text-sm text-muted-foreground">
                  Client: {formData.client_name}
                </p>
              </div>
            </div>
            {responses.length > 0 && (
              <Button onClick={exportResponses} className="shadow-elegant">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {responses.length === 0 ? (
            <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No responses yet</h3>
                  <p className="text-muted-foreground">
                    Share your form link to start collecting responses.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className="text-sm">
                    {responses.length} {responses.length === 1 ? 'Response' : 'Responses'}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-6">
                {responses.map((response, index) => (
                  <Card key={response.session_id} className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Response #{index + 1}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(response.created_at), "PPP 'at' p")}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {response.session_id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {response.responses.map((answer, answerIndex) => (
                          <div key={answer.question_id}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <Label className="font-medium text-foreground">
                                  {answer.question_label}
                                </Label>
                                <div className="mt-1 text-sm text-muted-foreground">
                                  {formatAnswer(answer.answer, answer.question_type)}
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {answer.question_type}
                              </Badge>
                            </div>
                            {answerIndex < response.responses.length - 1 && (
                              <Separator className="mt-4" />
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormResponses;