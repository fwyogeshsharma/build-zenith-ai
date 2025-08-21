-- Add version field to certifications table
ALTER TABLE public.certifications 
ADD COLUMN version text;