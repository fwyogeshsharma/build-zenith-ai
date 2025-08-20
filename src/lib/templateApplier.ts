import { supabase } from '@/integrations/supabase/client';
import { getProjectTemplate } from './projectTemplates';
import { Database } from '@/integrations/supabase/types';

type ProjectType = Database['public']['Enums']['project_type'];

export interface ApplyTemplateResult {
  success: boolean;
  error?: string;
  phasesCreated?: number;
  tasksCreated?: number;
  certificationsCreated?: number;
}

export const applyProjectTemplate = async (
  projectId: string,
  projectType: ProjectType,
  userId: string
): Promise<ApplyTemplateResult> => {
  try {
    const template = getProjectTemplate(projectType);
    
    let phasesCreated = 0;
    let tasksCreated = 0;
    let certificationsCreated = 0;

    // Create project phases
    if (template.phases.length > 0) {
      const phasesData = template.phases.map(phase => ({
        project_id: projectId,
        phase: phase.phase,
        status: 'planning' as const,
        budget: phase.budget_percentage ? Math.round((phase.budget_percentage / 100) * 1000000) : null, // Default to 1M total for percentage calculation
      }));

      const { data: phases, error: phasesError } = await supabase
        .from('project_phases')
        .insert(phasesData)
        .select();

      if (phasesError) throw phasesError;
      phasesCreated = phases?.length || 0;
    }

    // Create tasks
    if (template.tasks.length > 0) {
      const tasksData = template.tasks.map(task => ({
        project_id: projectId,
        title: task.title,
        description: task.description,
        phase: task.phase,
        priority: task.priority,
        ai_generated: task.ai_generated,
        created_by: userId,
        status: 'pending' as const,
      }));

      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .insert(tasksData)
        .select();

      if (tasksError) throw tasksError;
      tasksCreated = tasks?.length || 0;
    }

    // Create certifications
    if (template.certifications.length > 0) {
      const certificationsData = template.certifications.map(cert => ({
        project_id: projectId,
        type: cert.type,
        target_level: cert.target_level,
        requirements: cert.requirements,
        current_status: 'planning',
        progress_percentage: 0,
        expected_date: cert.expected_weeks 
          ? new Date(Date.now() + cert.expected_weeks * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : null,
      }));

      const { data: certifications, error: certificationsError } = await supabase
        .from('certifications')
        .insert(certificationsData)
        .select();

      if (certificationsError) throw certificationsError;
      certificationsCreated = certifications?.length || 0;
    }

    return {
      success: true,
      phasesCreated,
      tasksCreated,
      certificationsCreated,
    };
  } catch (error: any) {
    console.error('Error applying project template:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};