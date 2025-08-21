-- Fix invalid project_phase values in certificate_templates default_tasks
UPDATE certificate_templates 
SET default_tasks = jsonb_path_set_lax(
  default_tasks, 
  '$[*].phase', 
  CASE 
    WHEN jsonb_path_query_first(default_tasks, '$[*].phase')::text = '"planning_design"' THEN '"design"'::jsonb
    WHEN jsonb_path_query_first(default_tasks, '$[*].phase')::text = '"construction"' THEN '"execution"'::jsonb
    WHEN jsonb_path_query_first(default_tasks, '$[*].phase')::text = '"commissioning_handover"' THEN '"handover"'::jsonb
    WHEN jsonb_path_query_first(default_tasks, '$[*].phase')::text = '"operation_maintenance"' THEN '"operations_maintenance"'::jsonb
    ELSE jsonb_path_query_first(default_tasks, '$[*].phase')
  END
) 
WHERE default_tasks IS NOT NULL;

-- Update all tasks with incorrect phase values individually for LEED template
UPDATE certificate_templates 
SET default_tasks = '[
  {"phase": "design", "priority": "high", "title": "Conduct energy modeling"},
  {"phase": "execution", "priority": "medium", "title": "Install low-flow plumbing fixtures"}, 
  {"phase": "execution", "priority": "high", "title": "Implement construction waste management"},
  {"phase": "handover", "priority": "high", "title": "Prepare LEED documentation package"}
]'::jsonb
WHERE name = 'LEED Gold Template';

-- Update ISO 45001 template
UPDATE certificate_templates 
SET default_tasks = '[
  {"phase": "execution", "priority": "high", "title": "Weekly safety inspections"},
  {"phase": "pre_construction", "priority": "high", "title": "Safety training for all workers"},
  {"phase": "execution", "priority": "high", "title": "Accident reporting system"}, 
  {"phase": "handover", "priority": "medium", "title": "Safety documentation review"}
]'::jsonb
WHERE name = 'ISO 45001 Template';

-- Update Energy Star template  
UPDATE certificate_templates
SET default_tasks = '[
  {"phase": "execution", "priority": "high", "title": "Install energy monitoring systems"},
  {"phase": "operations_maintenance", "priority": "high", "title": "Collect 12 months energy data"},
  {"phase": "operations_maintenance", "priority": "high", "title": "Third-party verification"}
]'::jsonb
WHERE name = 'Energy Star Template';