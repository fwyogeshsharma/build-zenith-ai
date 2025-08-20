-- Add certificate_id to tasks table for linking tasks to certificates
ALTER TABLE tasks ADD COLUMN certificate_id uuid REFERENCES certifications(id) ON DELETE SET NULL;

-- Create certificate requirements table to store individual requirements for each certificate
CREATE TABLE certificate_requirements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  certificate_id uuid NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
  requirement_text text NOT NULL,
  requirement_category text,
  is_mandatory boolean DEFAULT true,
  is_completed boolean DEFAULT false,
  completion_date date,
  evidence_documents jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create certificate templates table for reusable certificate configurations
CREATE TABLE certificate_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL,
  description text,
  default_requirements jsonb DEFAULT '[]'::jsonb,
  default_tasks jsonb DEFAULT '[]'::jsonb,
  lifecycle_phases text[] DEFAULT '{}',
  estimated_duration_weeks integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE certificate_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for certificate_requirements
CREATE POLICY "Team members can view certificate requirements" 
ON certificate_requirements FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM certifications c
    JOIN projects p ON p.id = c.project_id
    LEFT JOIN project_team_members ptm ON p.id = ptm.project_id
    WHERE c.id = certificate_requirements.certificate_id 
    AND (p.owner_id = auth.uid() OR ptm.user_id = auth.uid())
  )
);

CREATE POLICY "Project managers can manage certificate requirements" 
ON certificate_requirements FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM certifications c
    JOIN projects p ON p.id = c.project_id
    LEFT JOIN project_team_members ptm ON p.id = ptm.project_id
    WHERE c.id = certificate_requirements.certificate_id 
    AND (p.owner_id = auth.uid() OR (ptm.user_id = auth.uid() AND ptm.role IN ('admin', 'project_manager')))
  )
);

-- RLS policies for certificate_templates (public read, admin write)
CREATE POLICY "Anyone can view certificate templates" 
ON certificate_templates FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can manage templates" 
ON certificate_templates FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Add updated_at trigger to new tables
CREATE TRIGGER update_certificate_requirements_updated_at
  BEFORE UPDATE ON certificate_requirements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificate_templates_updated_at
  BEFORE UPDATE ON certificate_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some common certificate templates
INSERT INTO certificate_templates (name, type, description, default_requirements, default_tasks, lifecycle_phases, estimated_duration_weeks) VALUES 
('LEED Gold Template', 'leed', 'LEED Gold certification template with core requirements', 
 '[
   {"text": "Achieve 60-79 LEED points", "category": "Points", "mandatory": true},
   {"text": "Meet all prerequisites", "category": "Prerequisites", "mandatory": true},
   {"text": "Water efficiency measures", "category": "Water", "mandatory": false},
   {"text": "Energy performance optimization", "category": "Energy", "mandatory": false},
   {"text": "Sustainable site development", "category": "Site", "mandatory": false}
 ]'::jsonb,
 '[
   {"title": "Conduct energy modeling", "phase": "planning_design", "priority": "high"},
   {"title": "Install low-flow plumbing fixtures", "phase": "construction", "priority": "medium"},
   {"title": "Implement construction waste management", "phase": "construction", "priority": "high"},
   {"title": "Prepare LEED documentation package", "phase": "commissioning_handover", "priority": "high"}
 ]'::jsonb,
 ARRAY['planning_design', 'construction', 'commissioning_handover'],
 16),

('ISO 45001 Template', 'iso_45001', 'Occupational Health and Safety Management System', 
 '[
   {"text": "Establish OH&S policy", "category": "Policy", "mandatory": true},
   {"text": "Conduct hazard identification", "category": "Risk Management", "mandatory": true},
   {"text": "Implement emergency procedures", "category": "Emergency", "mandatory": true},
   {"text": "Training and competence program", "category": "Training", "mandatory": true}
 ]'::jsonb,
 '[
   {"title": "Weekly safety inspections", "phase": "construction", "priority": "high"},
   {"title": "Safety training for all workers", "phase": "pre_construction", "priority": "high"},
   {"title": "Accident reporting system", "phase": "construction", "priority": "high"},
   {"title": "Safety documentation review", "phase": "commissioning_handover", "priority": "medium"}
 ]'::jsonb,
 ARRAY['pre_construction', 'construction', 'commissioning_handover'],
 12),

('Energy Star Template', 'energy_star', 'Energy Star certification for commercial buildings', 
 '[
   {"text": "Achieve Energy Star score of 75+", "category": "Performance", "mandatory": true},
   {"text": "Third-party verification", "category": "Verification", "mandatory": true},
   {"text": "12 months of energy data", "category": "Data", "mandatory": true}
 ]'::jsonb,
 '[
   {"title": "Install energy monitoring systems", "phase": "construction", "priority": "high"},
   {"title": "Collect 12 months energy data", "phase": "operation_maintenance", "priority": "high"},
   {"title": "Third-party verification", "phase": "operation_maintenance", "priority": "high"}
 ]'::jsonb,
 ARRAY['construction', 'operation_maintenance'],
 52);