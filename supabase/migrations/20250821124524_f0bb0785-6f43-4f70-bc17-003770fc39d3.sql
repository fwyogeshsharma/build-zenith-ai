-- Fix security issue: Restrict certificate templates access to authenticated users only
-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Anyone can view certificate templates" ON public.certificate_templates;

-- Create new policy that restricts SELECT access to authenticated users only
CREATE POLICY "Authenticated users can view certificate templates"
  ON public.certificate_templates
  FOR SELECT
  TO authenticated
  USING (true);