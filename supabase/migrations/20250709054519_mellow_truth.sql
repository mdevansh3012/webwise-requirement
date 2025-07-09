/*
  # Add client requirements functionality

  1. New Tables
    - `client_requirements`
      - `id` (uuid, primary key)
      - `form_id` (uuid, foreign key to forms)
      - `title` (text)
      - `description` (text)
      - `requirements` (jsonb, array of requirement items)
      - `images` (jsonb, array of image URLs/metadata)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `client_requirements` table
    - Add policies for authenticated users to manage requirements
    - Add policy for public to view requirements for active forms
*/

CREATE TABLE IF NOT EXISTS public.client_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  requirements JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_requirements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view requirements for active forms" 
ON public.client_requirements 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM forms 
  WHERE forms.id = client_requirements.form_id 
  AND forms.is_active = true
));

CREATE POLICY "Authenticated users can manage requirements" 
ON public.client_requirements 
FOR ALL 
TO authenticated 
USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_client_requirements_form_id ON public.client_requirements(form_id);

-- Create trigger for updated_at
CREATE TRIGGER update_client_requirements_updated_at
BEFORE UPDATE ON public.client_requirements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();