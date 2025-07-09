import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  GripVertical,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export interface Section {
  id?: string;
  title: string;
  description: string;
  order_index: number;
  questions: any[];
}

interface SectionBuilderProps {
  sections: Section[];
  onAddSection: () => void;
  onUpdateSection: (index: number, field: keyof Section, value: any) => void;
  onRemoveSection: (index: number) => void;
  onMoveSection: (index: number, direction: "up" | "down") => void;
  onToggleSection: (index: number) => void;
  expandedSections: Set<number>;
  children: (sectionIndex: number) => React.ReactNode;
}

export const SectionBuilder = ({
  sections,
  onAddSection,
  onUpdateSection,
  onRemoveSection,
  onMoveSection,
  onToggleSection,
  expandedSections,
  children,
}: SectionBuilderProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Form Sections</h3>
          <p className="text-sm text-muted-foreground">
            Organize your questions into logical sections
          </p>
        </div>
        <Button onClick={onAddSection} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>
      </div>

      {sections.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">No sections yet</div>
              <Button onClick={onAddSection} className="shadow-elegant">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Section
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sections.map((section, index) => (
            <Card key={index} className="border shadow-soft">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMoveSection(index, "up")}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMoveSection(index, "down")}
                      disabled={index === sections.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline">Section {index + 1}</Badge>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onToggleSection(index)}
                        >
                          {expandedSections.has(index) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveSection(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Section Title</Label>
                        <Input
                          value={section.title}
                          onChange={(e) => onUpdateSection(index, "title", e.target.value)}
                          placeholder="Enter section title..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={section.description}
                          onChange={(e) => onUpdateSection(index, "description", e.target.value)}
                          placeholder="Optional section description..."
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {expandedSections.has(index) && (
                <CardContent>
                  {children(index)}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};