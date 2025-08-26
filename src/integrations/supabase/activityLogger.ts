import { supabase } from './client';

export const logActivity = async (
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

// Helper functions for common activities
export const logTaskCompleted = (taskTitle: string, projectId: string, taskId: string) => {
  return logActivity(
    'task_completed',
    'Task Completed',
    `completed task "${taskTitle}"`,
    projectId,
    taskId
  );
};

export const logDocumentUploaded = (documentName: string, projectId: string, taskId?: string) => {
  return logActivity(
    'document_uploaded',
    'Document Uploaded',
    `uploaded document "${documentName}"`,
    projectId,
    taskId
  );
};

export const logTeamMemberAdded = (memberName: string, projectId: string) => {
  return logActivity(
    'team_member_added',
    'Team Member Added',
    `added ${memberName} to the team`,
    projectId
  );
};

export const logMilestoneReached = (milestoneName: string, projectId: string) => {
  return logActivity(
    'milestone_reached',
    'Milestone Reached',
    `reached milestone "${milestoneName}"`,
    projectId
  );
};

export const logCommentAdded = (targetName: string, projectId: string, taskId?: string) => {
  return logActivity(
    'comment_added',
    'Comment Added',
    `commented on "${targetName}"`,
    projectId,
    taskId
  );
};