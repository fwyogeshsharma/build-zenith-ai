-- Fix the update_phase_progress function by removing STABLE keyword
-- STABLE functions cannot perform INSERT operations
CREATE OR REPLACE FUNCTION public.update_phase_progress()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$