-- Fix certificate templates with invalid phase names
UPDATE certificate_templates 
SET default_tasks = jsonb_set(
  default_tasks,
  '{}',
  (
    SELECT jsonb_agg(
      CASE 
        WHEN task->>'phase' = 'planning_design' THEN jsonb_set(task, '{phase}', '"concept"')
        WHEN task->>'phase' = 'construction' THEN jsonb_set(task, '{phase}', '"execution"')
        WHEN task->>'phase' = 'operation_maintenance' THEN jsonb_set(task, '{phase}', '"operations_maintenance"')
        WHEN task->>'phase' = 'commissioning_handover' THEN jsonb_set(task, '{phase}', '"handover"')
        ELSE task
      END
    )
    FROM jsonb_array_elements(default_tasks) task
  )
)
WHERE default_tasks IS NOT NULL;