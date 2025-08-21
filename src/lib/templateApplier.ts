import { supabase } from '@/integrations/supabase/client';
import { getProjectTemplate } from './projectTemplates';
import { Database } from '@/integrations/supabase/types';

export const applyCertificateTemplate = async (
  projectId: string,
  certificationType: string,
  userId: string
): Promise<{ success: boolean; error?: string; tasksCreated?: number; requirementsCreated?: number }> => {
  try {
    // Get certificate template based on type
    const { data: template, error: templateError } = await supabase
      .from('certificate_templates')
      .select('*')
      .eq('type', certificationType)
      .single();

    if (templateError || !template) {
      return { success: false, error: 'Certificate template not found' };
    }

    // First create the certification
    const { data: certification, error: certError } = await supabase
      .from('certifications')
      .insert({
        project_id: projectId,
        type: certificationType as any,
        current_status: 'planning' as any,
        progress_percentage: 0
      })
      .select()
      .single();

    if (certError) throw certError;

    let requirementsCreated = 0;
    let tasksCreated = 0;

    // Create requirements from template
    if (template.default_requirements && Array.isArray(template.default_requirements) && template.default_requirements.length > 0) {
      const requirementsData = (template.default_requirements as any[]).map((req: any) => ({
        certificate_id: certification.id,
        requirement_text: req.text,
        requirement_category: req.category || 'General',
        is_mandatory: req.mandatory !== false
      }));

      const { data: requirements, error: reqError } = await supabase
        .from('certificate_requirements')
        .insert(requirementsData)
        .select();

      if (reqError) throw reqError;
      requirementsCreated = requirements?.length || 0;
    }

    // Create tasks from template
    if (template.default_tasks && Array.isArray(template.default_tasks) && template.default_tasks.length > 0) {
      const tasksData = (template.default_tasks as any[]).map((task: any) => ({
        project_id: projectId,
        certificate_id: certification.id,
        title: task.title,
        description: `Template task for ${template.name} certification`,
        phase: task.phase,
        priority: task.priority || 'medium',
        status: 'pending',
        created_by: userId,
        ai_generated: true
      }));

      const { data: tasks, error: taskError } = await supabase
        .from('tasks')
        .insert(tasksData)
        .select();

      if (taskError) throw taskError;
      tasksCreated = tasks?.length || 0;
    }

    return {
      success: true,
      tasksCreated,
      requirementsCreated
    };
  } catch (error: any) {
    console.error('Error applying certificate template:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

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

    // Don't create certifications by default - users will add them manually

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