-- Create activities table to track user actions
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID NULL,
  task_id UUID NULL,
  activity_type TEXT NOT NULL, -- 'task_completed', 'document_uploaded', 'team_member_added', 'milestone_reached', 'comment_added'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view activities from their projects" 
ON public.activities 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM projects p
    LEFT JOIN project_team_members ptm ON p.id = ptm.project_id
    WHERE p.id = activities.project_id 
    AND (p.owner_id = auth.uid() OR ptm.user_id = auth.uid())
  )
);

CREATE POLICY "Users can create their own activities" 
ON public.activities 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Create index for better performance
CREATE INDEX idx_activities_user_id ON public.activities(user_id);
CREATE INDEX idx_activities_project_id ON public.activities(project_id);
CREATE INDEX idx_activities_created_at ON public.activities(created_at DESC);

-- Create certificate versions mapping table
CREATE TABLE public.certificate_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  certification_type TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for certificate_versions
ALTER TABLE public.certificate_versions ENABLE ROW LEVEL SECURITY;

-- Create policy for certificate versions
CREATE POLICY "Authenticated users can view certificate versions" 
ON public.certificate_versions 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Insert sample certificate versions
INSERT INTO public.certificate_versions (certification_type, version, description) VALUES
('BREEAM', 'v6.0', 'BREEAM Version 6.0'),
('BREEAM', 'v2018', 'BREEAM Version 2018'),
('BREEAM', 'v2014', 'BREEAM Version 2014'),
('LEED', 'v4.1', 'LEED Version 4.1'),
('LEED', 'v4', 'LEED Version 4'),
('LEED', 'v2009', 'LEED Version 2009'),
('WELL', 'v2', 'WELL Building Standard v2'),
('WELL', 'v1', 'WELL Building Standard v1'),
('Passivhaus', '2021', 'Passivhaus Standard 2021'),
('Passivhaus', '2015', 'Passivhaus Standard 2015'),
('NABERS', '2019', 'NABERS 2019'),
('NABERS', '2016', 'NABERS 2016'),
('Green Star', 'v1.3', 'Green Star Version 1.3'),
('Green Star', 'v1.2', 'Green Star Version 1.2'),
('HQE', '2016', 'HQE 2016'),
('HQE', '2012', 'HQE 2012');

-- Function to log activities (fixed parameter order)
CREATE OR REPLACE FUNCTION public.log_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_title TEXT,
  p_description TEXT,
  p_project_id UUID DEFAULT NULL,
  p_task_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO activities (user_id, project_id, task_id, activity_type, title, description, metadata)
  VALUES (p_user_id, p_project_id, p_task_id, p_activity_type, p_title, p_description, p_metadata)
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$;