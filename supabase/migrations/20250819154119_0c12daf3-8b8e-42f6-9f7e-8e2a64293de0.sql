-- Fix function search path security warning
CREATE OR REPLACE FUNCTION public.is_project_team_member(project_uuid uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_team_members 
    WHERE project_id = project_uuid AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;