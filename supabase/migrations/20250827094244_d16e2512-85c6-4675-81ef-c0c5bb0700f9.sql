-- Add materials table for project resources
CREATE TABLE public.materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'kg',
  density DECIMAL(10,4),
  carbon_emission_factor DECIMAL(10,4), -- kg CO2 per unit
  chemical_composition JSONB DEFAULT '{}',
  material_category TEXT,
  cost_per_unit DECIMAL(10,2),
  supplier_info JSONB DEFAULT '{}',
  properties JSONB DEFAULT '{}', -- Store additional material properties
  created_by UUID NOT NULL,
  is_public BOOLEAN DEFAULT false, -- Public materials can be used by all users
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for materials
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- RLS policies for materials
CREATE POLICY "Public materials are viewable by all users" 
ON public.materials 
FOR SELECT 
USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create their own materials" 
ON public.materials 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own materials" 
ON public.materials 
FOR UPDATE 
USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own materials" 
ON public.materials 
FOR DELETE 
USING (created_by = auth.uid());

-- Add task resources table
CREATE TABLE public.task_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL,
  resource_type TEXT NOT NULL, -- 'material', 'equipment', 'labor', 'other'
  material_id UUID, -- References materials table
  resource_name TEXT NOT NULL,
  quantity DECIMAL(10,4) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'unit',
  cost_per_unit DECIMAL(10,2),
  total_cost DECIMAL(10,2) GENERATED ALWAYS AS (quantity * COALESCE(cost_per_unit, 0)) STORED,
  allocated_hours DECIMAL(8,2), -- For labor resources
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for task resources
ALTER TABLE public.task_resources ENABLE ROW LEVEL SECURITY;

-- RLS policies for task resources
CREATE POLICY "Team members can manage task resources" 
ON public.task_resources 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN projects p ON p.id = t.project_id
    LEFT JOIN project_team_members ptm ON p.id = ptm.project_id
    WHERE t.id = task_resources.task_id 
    AND (p.owner_id = auth.uid() OR ptm.user_id = auth.uid())
  )
);

-- Add team member assignments to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS team_members JSONB DEFAULT '[]';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS required_skills JSONB DEFAULT '[]';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS task_permissions JSONB DEFAULT '{}'; -- Role-based permissions

-- Create analytics data tables for dynamic analytics
CREATE TABLE public.project_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  metric_type TEXT NOT NULL, -- 'budget', 'progress', 'quality', 'risk'
  metric_name TEXT NOT NULL,
  value DECIMAL(12,4) NOT NULL,
  target_value DECIMAL(12,4),
  unit TEXT,
  phase TEXT,
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS for project metrics
ALTER TABLE public.project_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for project metrics
CREATE POLICY "Team members can view project metrics" 
ON public.project_metrics 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM projects p
    LEFT JOIN project_team_members ptm ON p.id = ptm.project_id
    WHERE p.id = project_metrics.project_id 
    AND (p.owner_id = auth.uid() OR ptm.user_id = auth.uid())
  )
);

CREATE POLICY "Project managers can manage metrics" 
ON public.project_metrics 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM projects p
    LEFT JOIN project_team_members ptm ON p.id = ptm.project_id
    WHERE p.id = project_metrics.project_id 
    AND (
      p.owner_id = auth.uid() OR 
      (ptm.user_id = auth.uid() AND ptm.role IN ('admin', 'project_manager'))
    )
  )
)
WITH CHECK (created_by = auth.uid());

-- Add triggers for updated_at
CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON public.materials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_resources_updated_at
  BEFORE UPDATE ON public.task_resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fix foreign key constraints by adding CASCADE deletes
-- This will fix the "INSERT is not allowed in non-volatile function" error during project deletion
ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_project_id_fkey;
ALTER TABLE public.activities ADD CONSTRAINT activities_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_project_id_fkey;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_project_id_fkey;
ALTER TABLE public.documents ADD CONSTRAINT documents_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.project_phases DROP CONSTRAINT IF EXISTS project_phases_project_id_fkey;
ALTER TABLE public.project_phases ADD CONSTRAINT project_phases_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.project_team_members DROP CONSTRAINT IF EXISTS project_team_members_project_id_fkey;
ALTER TABLE public.project_team_members ADD CONSTRAINT project_team_members_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.invitations DROP CONSTRAINT IF EXISTS invitations_project_id_fkey;
ALTER TABLE public.invitations ADD CONSTRAINT invitations_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.certifications DROP CONSTRAINT IF EXISTS certifications_project_id_fkey;
ALTER TABLE public.certifications ADD CONSTRAINT certifications_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.progress_entries DROP CONSTRAINT IF EXISTS progress_entries_project_id_fkey;
ALTER TABLE public.progress_entries ADD CONSTRAINT progress_entries_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- Add foreign key for task_resources
ALTER TABLE public.task_resources ADD CONSTRAINT task_resources_task_id_fkey 
  FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;

ALTER TABLE public.task_resources ADD CONSTRAINT task_resources_material_id_fkey 
  FOREIGN KEY (material_id) REFERENCES public.materials(id) ON DELETE SET NULL;

-- Add foreign key for project_metrics
ALTER TABLE public.project_metrics ADD CONSTRAINT project_metrics_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;