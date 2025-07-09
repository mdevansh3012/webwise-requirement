import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Zap } from "lucide-react";

export interface QuestionCondition {
  id?: string;
  condition_question_id: string;
  condition_operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
  condition_value: string;
}

interface ConditionalLogicProps {
  conditions: QuestionCondition[];
  availableQuestions: { id: string; label: string; type: string }[];
  onAddCondition: () => void;
  onUpdateCondition: (index: number, field: keyof QuestionCondition, value: any) => void;
  onRemoveCondition: (index: number) => void;
}

const operators = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Does not equal' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does not contain' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'less_than', label: 'Less than' },
];

export const ConditionalLogic = ({
  conditions,
  availableQuestions,
  onAddCondition,
  onUpdateCondition,
  onRemoveCondition,
}: ConditionalLogicProps) => {
  return (
    <Card className="border-dashed border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Conditional Logic</CardTitle>
          </div>
          <Button onClick={onAddCondition} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Condition
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {conditions.length === 0 ? (
          <div className="text-center py-4">
            <div className="text-sm text-muted-foreground mb-2">
              No conditions set. This question will always be visible.
            </div>
          </div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground mb-3">
              Show this question only when:
            </div>
            {conditions.map((condition, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-background rounded border">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Question</Label>
                    <Select
                      value={condition.condition_question_id}
                      onValueChange={(value) => onUpdateCondition(index, "condition_question_id", value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select question" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableQuestions.map((q) => (
                          <SelectItem key={q.id} value={q.id}>
                            {q.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs">Operator</Label>
                    <Select
                      value={condition.condition_operator}
                      onValueChange={(value) => onUpdateCondition(index, "condition_operator", value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {operators.map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs">Value</Label>
                    <Input
                      value={condition.condition_value}
                      onChange={(e) => onUpdateCondition(index, "condition_value", e.target.value)}
                      placeholder="Enter value..."
                      className="h-8"
                    />
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveCondition(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            
            {conditions.length > 1 && (
              <div className="text-xs text-muted-foreground text-center pt-2">
                All conditions must be met (AND logic)
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};