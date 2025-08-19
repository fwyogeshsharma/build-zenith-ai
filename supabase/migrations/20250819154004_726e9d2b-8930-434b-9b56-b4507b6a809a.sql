-- Fix infinite recursion in projects RLS policies
-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Project owners can manage their projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view projects they are team members of" ON public.projects;

-- Create security definer function to check team membership
CREATE OR REPLACE FUNCTION public.is_project_team_member(project_uuid uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_team_members 
    WHERE project_id = project_uuid AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create new policies without recursion
CREATE POLICY "Users can insert their own projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can view their own projects" 
ON public.projects 
FOR SELECT 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can update their own projects" 
ON public.projects 
FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own projects" 
ON public.projects 
FOR DELETE 
USING (auth.uid() = owner_id);

CREATE POLICY "Team members can view projects" 
ON public.projects 
FOR SELECT 
USING (public.is_project_team_member(id));