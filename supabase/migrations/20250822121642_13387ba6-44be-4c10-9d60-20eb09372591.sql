-- Add progress tracking capabilities to link tasks with project lifecycle

-- First, add a progress_entries table to track detailed progress data
CREATE TABLE IF NOT EXISTS public.progress_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  task_id UUID NULL,
  phase TEXT NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('task_progress', 'phase_milestone', 'manual_entry')),
  progress_percentage INTEGER NOT NULL CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  actual_value NUMERIC NULL,
  target_value NUMERIC NULL,
  unit TEXT NULL,
  notes TEXT NULL,
  evidence_documents JSONB DEFAULT '[]'::jsonb,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add task progress tracking columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
ADD COLUMN IF NOT EXISTS actual_hours NUMERIC NULL,
ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC NULL,
ADD COLUMN IF NOT EXISTS progress_notes TEXT NULL,
ADD COLUMN IF NOT EXISTS last_progress_update TIMESTAMP WITH TIME ZONE NULL;

-- Add phase progress tracking to project_phases table (if it doesn't exist, create it)
CREATE TABLE IF NOT EXISTS public.project_phases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  phase TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planning',
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  start_date DATE NULL,
  end_date DATE NULL,
  budget NUMERIC NULL,
  actual_cost NUMERIC NULL,
  ai_recommendations JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, phase)
);

-- Enable RLS on new tables
ALTER TABLE public.progress_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for progress_entries
CREATE POLICY "Team members can view progress entries" 
ON public.progress_entries 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM projects p
    LEFT JOIN project_team_members ptm ON p.id = ptm.project_id
    WHERE p.id = progress_entries.project_id 
    AND (p.owner_id = auth.uid() OR ptm.user_id = auth.uid())
  )
);

CREATE POLICY "Team members can manage progress entries" 
ON public.progress_entries 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM projects p
    LEFT JOIN project_team_members ptm ON p.id = ptm.project_id
    WHERE p.id = progress_entries.project_id 
    AND (p.owner_id = auth.uid() OR ptm.user_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects p
    LEFT JOIN project_team_members ptm ON p.id = ptm.project_id
    WHERE p.id = progress_entries.project_id 
    AND (p.owner_id = auth.uid() OR ptm.user_id = auth.uid())
  ) AND created_by = auth.uid()
);

-- Create function to automatically update phase progress based on task progress
CREATE OR REPLACE FUNCTION public.update_phase_progress()
RETURNS TRIGGER AS $$
DECLARE
  phase_avg_progress INTEGER;
  project_avg_progress INTEGER;
BEGIN
  -- Calculate average progress for the phase
  SELECT COALESCE(AVG(progress_percentage), 0)::INTEGER
  INTO phase_avg_progress
  FROM tasks 
  WHERE project_id = COALESCE(NEW.project_id, OLD.project_id) 
    AND phase = COALESCE(NEW.phase, OLD.phase);

  -- Update project_phases table
  INSERT INTO project_phases (project_id, phase, progress_percentage)
  VALUES (
    COALESCE(NEW.project_id, OLD.project_id), 
    COALESCE(NEW.phase, OLD.phase), 
    phase_avg_progress
  )
  ON CONFLICT (project_id, phase) 
  DO UPDATE SET 
    progress_percentage = phase_avg_progress,
    updated_at = now();

  -- Calculate overall project progress as average of all phases
  SELECT COALESCE(AVG(progress_percentage), 0)::INTEGER
  INTO project_avg_progress
  FROM project_phases
  WHERE project_id = COALESCE(NEW.project_id, OLD.project_id);

  -- Update projects table
  UPDATE projects 
  SET 
    progress_percentage = project_avg_progress,
    updated_at = now()
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update phase progress when tasks are updated
DROP TRIGGER IF EXISTS update_phase_progress_trigger ON tasks;
CREATE TRIGGER update_phase_progress_trigger
  AFTER INSERT OR UPDATE OF progress_percentage, phase OR DELETE
  ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_phase_progress();

-- Create trigger for updated_at on progress_entries
CREATE TRIGGER update_progress_entries_updated_at
  BEFORE UPDATE ON public.progress_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on project_phases  
CREATE TRIGGER update_project_phases_updated_at
  BEFORE UPDATE ON public.project_phases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();