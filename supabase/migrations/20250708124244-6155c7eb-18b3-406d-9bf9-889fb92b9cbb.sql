-- Create enum for question types
CREATE TYPE public.question_type AS ENUM (
  'text',
  'textarea', 
  'email',
  'number',
  'select',
  'radio',
  'checkbox',
  'date'
);

-- Create forms table
CREATE TABLE public.forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  client_name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  type question_type NOT NULL,
  label TEXT NOT NULL,
  placeholder TEXT,
  options JSONB, -- For select, radio, checkbox options
  is_required BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create responses table
CREATE TABLE public.responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer JSONB NOT NULL, -- Store answer as JSON to handle different types
  session_id TEXT NOT NULL, -- Group responses from same form submission
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- Create policies for forms
CREATE POLICY "Anyone can view active forms" 
ON public.forms 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Authenticated users can manage forms" 
ON public.forms 
FOR ALL 
TO authenticated 
USING (true);

-- Create policies for questions
CREATE POLICY "Anyone can view questions for active forms" 
ON public.questions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.forms 
    WHERE forms.id = questions.form_id 
    AND forms.is_active = true
  )
);

CREATE POLICY "Authenticated users can manage questions" 
ON public.questions 
FOR ALL 
TO authenticated 
USING (true);

-- Create policies for responses
CREATE POLICY "Anyone can create responses" 
ON public.responses 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can view all responses" 
ON public.responses 
FOR SELECT 
TO authenticated 
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_questions_form_id ON public.questions(form_id);
CREATE INDEX idx_questions_order ON public.questions(form_id, order_index);
CREATE INDEX idx_responses_form_id ON public.responses(form_id);
CREATE INDEX idx_responses_session_id ON public.responses(session_id);
CREATE INDEX idx_forms_client_name ON public.forms(client_name);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_forms_updated_at
  BEFORE UPDATE ON public.forms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();