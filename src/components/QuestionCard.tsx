import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
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
import { ConditionalLogic, QuestionCondition } from "@/components/ConditionalLogic";

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

interface QuestionCardProps {
  question: Question;
  index: number;
  questions: Question[];
  onUpdate: (index: number, field: keyof Question, value: any) => void;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: "up" | "down") => void;
  onOptionsChange: (questionIndex: number, optionsText: string) => void;
}

export const QuestionCard = ({
  question,
  index,
  questions,
  onUpdate,
  onRemove,
  onMove,
  onOptionsChange,
}: QuestionCardProps) => {
  const availableQuestions = questions
    .filter((_, i) => i < index)
    .map((q, i) => ({ id: i.toString(), label: q.label, type: q.type }));

  return (
    <Card className="border shadow-soft">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex flex-col gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMove(index, "up")}
              disabled={index === 0}
            >
              ↑
            </Button>
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMove(index, "down")}
              disabled={index === questions.length - 1}
            >
              ↓
            </Button>
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline">Question {index + 1}</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Question Type</Label>
                <Select
                  value={question.type}
                  onValueChange={(value) => onUpdate(index, "type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {questionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={question.is_required}
                  onCheckedChange={(checked) => onUpdate(index, "is_required", checked)}
                />
                <Label>Required</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Question Label</Label>
              <Input
                value={question.label}
                onChange={(e) => onUpdate(index, "label", e.target.value)}
                placeholder="Enter your question..."
              />
            </div>

            <div className="space-y-2">
              <Label>Placeholder Text</Label>
              <Input
                value={question.placeholder}
                onChange={(e) => onUpdate(index, "placeholder", e.target.value)}
                placeholder="Optional placeholder text..."
              />
            </div>

            {(question.type === "select" || question.type === "radio" || question.type === "checkbox") && (
              <div className="space-y-2">
                <Label>Options (one per line)</Label>
                <Textarea
                  value={question.options.join("\n")}
                  onChange={(e) => onOptionsChange(index, e.target.value)}
                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                  rows={4}
                />
              </div>
            )}

            <ConditionalLogic
              conditions={question.conditions}
              availableQuestions={availableQuestions}
              onAddCondition={() => {
                const newCondition: QuestionCondition = {
                  condition_question_id: "",
                  condition_operator: "equals",
                  condition_value: ""
                };
                onUpdate(index, "conditions", [...question.conditions, newCondition]);
              }}
              onUpdateCondition={(conditionIndex, field, value) => {
                const updated = [...question.conditions];
                updated[conditionIndex] = { ...updated[conditionIndex], [field]: value };
                onUpdate(index, "conditions", updated);
              }}
              onRemoveCondition={(conditionIndex) => {
                const updated = question.conditions.filter((_, i) => i !== conditionIndex);
                onUpdate(index, "conditions", updated);
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};