-- Create sections table for organizing questions
CREATE TABLE public.sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create question conditions table for conditional logic
CREATE TABLE public.question_conditions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  condition_question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  condition_operator TEXT NOT NULL CHECK (condition_operator IN ('equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than')),
  condition_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add section_id to questions table
ALTER TABLE public.questions 
ADD COLUMN section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE;

-- Enable RLS on new tables
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_conditions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sections
CREATE POLICY "Anyone can view sections for active forms" 
ON public.sections 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM forms 
  WHERE forms.id = sections.form_id 
  AND forms.is_active = true
));

CREATE POLICY "Authenticated users can manage sections" 
ON public.sections 
FOR ALL 
USING (true);

-- Create RLS policies for question_conditions
CREATE POLICY "Anyone can view conditions for active forms" 
ON public.question_conditions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM questions q
  JOIN forms f ON f.id = q.form_id
  WHERE q.id = question_conditions.question_id 
  AND f.is_active = true
));

CREATE POLICY "Authenticated users can manage conditions" 
ON public.question_conditions 
FOR ALL 
USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_sections_updated_at
BEFORE UPDATE ON public.sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_sections_form_id ON public.sections(form_id);
CREATE INDEX idx_sections_order ON public.sections(form_id, order_index);
CREATE INDEX idx_questions_section_id ON public.questions(section_id);
CREATE INDEX idx_question_conditions_question_id ON public.question_conditions(question_id);
CREATE INDEX idx_question_conditions_condition_question_id ON public.question_conditions(condition_question_id);
CREATE INDEX idx_responses_form_session ON public.responses(form_id, session_id);