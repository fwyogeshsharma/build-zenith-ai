import { supabase } from '@/integrations/supabase/client';

export const useActivityLogger = () => {
  const logActivity = async (
    activityType: string,
    title: string,
    description: string,
    projectId?: string,
    taskId?: string,
    metadata?: any
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.rpc('log_activity', {
        p_user_id: user.id,
        p_activity_type: activityType,
        p_title: title,
        p_description: description,
        p_project_id: projectId || null,
        p_task_id: taskId || null,
        p_metadata: metadata || {}
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  return { logActivity };
};