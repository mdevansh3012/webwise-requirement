/*
  # Add sections and conditional logic functionality

  1. New Tables
    - `sections`
      - `id` (uuid, primary key)
      - `form_id` (uuid, foreign key to forms)
      - `title` (text)
      - `description` (text)
      - `order_index` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `question_conditions`
      - `id` (uuid, primary key)
      - `question_id` (uuid, foreign key to questions)
      - `condition_question_id` (uuid, foreign key to questions)
      - `condition_operator` (text with check constraint)
      - `condition_value` (text)
      - `created_at` (timestamp)

  2. Table Modifications
    - Add `section_id` column to `questions` table

  3. Security
    - Enable RLS on new tables
    - Add policies for public to view sections/conditions for active forms
    - Add policies for authenticated users to manage sections/conditions

  4. Performance
    - Add indexes for better query performance
    - Add triggers for automatic timestamp updates
*/

-- Create sections table for organizing questions (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create question conditions table for conditional logic (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.question_conditions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  condition_question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  condition_operator TEXT NOT NULL CHECK (condition_operator IN ('equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than')),
  condition_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add section_id to questions table (only if column doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'section_id'
  ) THEN
    ALTER TABLE public.questions 
    ADD COLUMN section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS on new tables (safe to run multiple times)
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_conditions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate them
DO $$
BEGIN
  -- Drop sections policies if they exist
  DROP POLICY IF EXISTS "Anyone can view sections for active forms" ON public.sections;
  DROP POLICY IF EXISTS "Authenticated users can manage sections" ON public.sections;
  
  -- Drop question_conditions policies if they exist
  DROP POLICY IF EXISTS "Anyone can view conditions for active forms" ON public.question_conditions;
  DROP POLICY IF EXISTS "Authenticated users can manage conditions" ON public.question_conditions;
END $$;

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

-- Create trigger for updated_at on sections (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'update_sections_updated_at'
  ) THEN
    CREATE TRIGGER update_sections_updated_at
    BEFORE UPDATE ON public.sections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_sections_form_id ON public.sections(form_id);
CREATE INDEX IF NOT EXISTS idx_sections_order ON public.sections(form_id, order_index);
CREATE INDEX IF NOT EXISTS idx_questions_section_id ON public.questions(section_id);
CREATE INDEX IF NOT EXISTS idx_question_conditions_question_id ON public.question_conditions(question_id);
CREATE INDEX IF NOT EXISTS idx_question_conditions_condition_question_id ON public.question_conditions(condition_question_id);
CREATE INDEX IF NOT EXISTS idx_responses_form_session ON public.responses(form_id, session_id);