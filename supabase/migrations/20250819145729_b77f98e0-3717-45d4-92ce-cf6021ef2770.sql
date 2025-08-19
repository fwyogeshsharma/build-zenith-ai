-- Create enum types for the construction project management platform

-- Project types
CREATE TYPE public.project_type AS ENUM (
  'new_construction',
  'renovation_repair', 
  'interior_fitout',
  'land_development',
  'sustainable_green',
  'affordable_housing',
  'luxury',
  'mixed_use',
  'co_living_working',
  'redevelopment'
);

-- Project lifecycle phases
CREATE TYPE public.project_phase AS ENUM (
  'concept',
  'design', 
  'pre_construction',
  'execution',
  'handover',
  'operations_maintenance',
  'renovation_demolition'
);

-- User roles
CREATE TYPE public.user_role AS ENUM (
  'admin',
  'project_manager',
  'contractor',
  'architect',
  'engineer', 
  'client',
  'inspector'
);

-- Certification types
CREATE TYPE public.certification_type AS ENUM (
  'leed',
  'igbc',
  'breeam',
  'iso',
  'energy_star',
  'well',
  'other'
);

-- Project status
CREATE TYPE public.project_status AS ENUM (
  'planning',
  'active',
  'on_hold',
  'completed',
  'cancelled'
);

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'client',
  company TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  project_type project_type NOT NULL,
  status project_status NOT NULL DEFAULT 'planning',
  current_phase project_phase NOT NULL DEFAULT 'concept',
  owner_id UUID NOT NULL,
  location TEXT,
  budget DECIMAL(15,2),
  start_date DATE,
  expected_completion_date DATE,
  actual_completion_date DATE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  ai_insights JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project phases tracking
CREATE TABLE public.project_phases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  phase project_phase NOT NULL,
  status project_status NOT NULL DEFAULT 'planning',
  start_date DATE,
  end_date DATE,
  budget DECIMAL(15,2),
  actual_cost DECIMAL(15,2),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  ai_recommendations JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, phase)
);

-- Create certifications table
CREATE TABLE public.certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  type certification_type NOT NULL,
  target_level TEXT,
  current_status TEXT,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  certification_body TEXT,
  expected_date DATE,
  achieved_date DATE,
  documents JSONB DEFAULT '[]',
  requirements JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project team members
CREATE TABLE public.project_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role user_role NOT NULL,
  permissions JSONB DEFAULT '{}',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  phase project_phase NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  assigned_to UUID,
  due_date DATE,
  completed_date DATE,
  ai_generated BOOLEAN DEFAULT false,
  dependencies JSONB DEFAULT '[]',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  phase project_phase,
  certification_id UUID,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID NOT NULL,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view and edit their own profile" 
ON public.profiles 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view projects they are team members of" 
ON public.projects 
FOR SELECT 
USING (
  auth.uid() = owner_id OR 
  EXISTS (
    SELECT 1 FROM public.project_team_members 
    WHERE project_id = projects.id AND user_id = auth.uid()
  )
);

CREATE POLICY "Project owners can manage their projects" 
ON public.projects 
FOR ALL 
USING (auth.uid() = owner_id);

CREATE POLICY "Team members can view project phases" 
ON public.project_phases 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    LEFT JOIN public.project_team_members ptm ON p.id = ptm.project_id
    WHERE p.id = project_phases.project_id 
    AND (p.owner_id = auth.uid() OR ptm.user_id = auth.uid())
  )
);

CREATE POLICY "Project managers can manage phases" 
ON public.project_phases 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    LEFT JOIN public.project_team_members ptm ON p.id = ptm.project_id
    WHERE p.id = project_phases.project_id 
    AND (p.owner_id = auth.uid() OR (ptm.user_id = auth.uid() AND ptm.role IN ('admin', 'project_manager')))
  )
);

-- Similar policies for other tables
CREATE POLICY "Team members can view certifications" 
ON public.certifications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    LEFT JOIN public.project_team_members ptm ON p.id = ptm.project_id
    WHERE p.id = certifications.project_id 
    AND (p.owner_id = auth.uid() OR ptm.user_id = auth.uid())
  )
);

CREATE POLICY "Project managers can manage certifications" 
ON public.certifications 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    LEFT JOIN public.project_team_members ptm ON p.id = ptm.project_id
    WHERE p.id = certifications.project_id 
    AND (p.owner_id = auth.uid() OR (ptm.user_id = auth.uid() AND ptm.role IN ('admin', 'project_manager')))
  )
);

CREATE POLICY "Users can view team members of their projects" 
ON public.project_team_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_team_members.project_id 
    AND p.owner_id = auth.uid()
  ) OR user_id = auth.uid()
);

CREATE POLICY "Project owners can manage team members" 
ON public.project_team_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_team_members.project_id 
    AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "Team members can view tasks" 
ON public.tasks 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    LEFT JOIN public.project_team_members ptm ON p.id = ptm.project_id
    WHERE p.id = tasks.project_id 
    AND (p.owner_id = auth.uid() OR ptm.user_id = auth.uid())
  )
);

CREATE POLICY "Team members can manage tasks" 
ON public.tasks 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    LEFT JOIN public.project_team_members ptm ON p.id = ptm.project_id
    WHERE p.id = tasks.project_id 
    AND (p.owner_id = auth.uid() OR ptm.user_id = auth.uid())
  )
);

CREATE POLICY "Team members can view documents" 
ON public.documents 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    LEFT JOIN public.project_team_members ptm ON p.id = ptm.project_id
    WHERE p.id = documents.project_id 
    AND (p.owner_id = auth.uid() OR ptm.user_id = auth.uid())
  )
);

CREATE POLICY "Team members can upload documents" 
ON public.documents 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p 
    LEFT JOIN public.project_team_members ptm ON p.id = ptm.project_id
    WHERE p.id = documents.project_id 
    AND (p.owner_id = auth.uid() OR ptm.user_id = auth.uid())
  ) AND uploaded_by = auth.uid()
);

-- Create foreign key constraints
ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_user_id 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.projects ADD CONSTRAINT fk_projects_owner_id 
  FOREIGN KEY (owner_id) REFERENCES auth.users(id);

ALTER TABLE public.project_phases ADD CONSTRAINT fk_project_phases_project_id 
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.certifications ADD CONSTRAINT fk_certifications_project_id 
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.project_team_members ADD CONSTRAINT fk_team_members_project_id 
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.project_team_members ADD CONSTRAINT fk_team_members_user_id 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.tasks ADD CONSTRAINT fk_tasks_project_id 
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.tasks ADD CONSTRAINT fk_tasks_assigned_to 
  FOREIGN KEY (assigned_to) REFERENCES auth.users(id);

ALTER TABLE public.tasks ADD CONSTRAINT fk_tasks_created_by 
  FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE public.documents ADD CONSTRAINT fk_documents_project_id 
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.documents ADD CONSTRAINT fk_documents_certification_id 
  FOREIGN KEY (certification_id) REFERENCES public.certifications(id) ON DELETE CASCADE;

ALTER TABLE public.documents ADD CONSTRAINT fk_documents_uploaded_by 
  FOREIGN KEY (uploaded_by) REFERENCES auth.users(id);

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_type ON public.projects(project_type);
CREATE INDEX idx_project_phases_project_id ON public.project_phases(project_id);
CREATE INDEX idx_certifications_project_id ON public.certifications(project_id);
CREATE INDEX idx_team_members_project_id ON public.project_team_members(project_id);
CREATE INDEX idx_team_members_user_id ON public.project_team_members(user_id);
CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_documents_project_id ON public.documents(project_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_phases_updated_at
  BEFORE UPDATE ON public.project_phases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_certifications_updated_at
  BEFORE UPDATE ON public.certifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();