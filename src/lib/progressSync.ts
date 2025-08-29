import { supabase } from '@/integrations/supabase/client';

export interface ProgressUpdateData {
  projectId: string;
  newProgress?: number;
  taskCompletionChange?: {
    taskId: string;
    oldStatus: string;
    newStatus: string;
  };
}

// Define phase progression order and weights
const PHASE_ORDER = [
  'concept',
  'design', 
  'pre_construction',
  'execution',
  'handover',
  'operations_maintenance',
  'renovation_demolition'
];

const PHASE_WEIGHTS = {
  concept: 10,           // 10% of total project
  design: 20,            // 20% of total project  
  pre_construction: 15,  // 15% of total project
  execution: 45,         // 45% of total project (main construction)
  handover: 10,          // 10% of total project
  operations_maintenance: 0, // Post-completion phase
  renovation_demolition: 0   // Future phase
};

/**
 * Calculate phase-specific progress based on tasks in current phase
 */
export async function calculatePhaseProgress(projectId: string, phase: string): Promise<number> {
  try {
    // Get tasks for the specific phase
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('status, priority')
      .eq('project_id', projectId)
      .eq('phase', phase);

    if (error) throw error;

    if (!tasks || tasks.length === 0) return 0;

    // Weight tasks by priority
    const priorityWeights = {
      high: 3,
      medium: 2,
      low: 1
    };

    let totalWeight = 0;
    let completedWeight = 0;

    tasks.forEach(task => {
      const weight = priorityWeights[task.priority as keyof typeof priorityWeights] || 1;
      totalWeight += weight;
      
      if (task.status === 'completed') {
        completedWeight += weight;
      } else if (task.status === 'in_progress') {
        // In-progress tasks count as 50% complete
        completedWeight += weight * 0.5;
      }
    });

    return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
  } catch (error) {
    console.error('Error calculating phase progress:', error);
    return 0;
  }
}

/**
 * Calculate overall project progress based on phase completion and current phase
 */
export async function calculateProjectProgress(projectId: string): Promise<number> {
  try {
    // Get project current phase
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('current_phase')
      .eq('id', projectId)
      .single();

    if (projectError) throw projectError;

    const currentPhase = project?.current_phase || 'concept';
    const currentPhaseIndex = PHASE_ORDER.indexOf(currentPhase);
    
    if (currentPhaseIndex === -1) return 0;

    let totalProgress = 0;

    // Calculate progress for completed phases (100% each)
    for (let i = 0; i < currentPhaseIndex; i++) {
      const phaseWeight = PHASE_WEIGHTS[PHASE_ORDER[i] as keyof typeof PHASE_WEIGHTS] || 0;
      totalProgress += phaseWeight; // 100% of completed phases
    }

    // Calculate progress for current phase
    const currentPhaseProgress = await calculatePhaseProgress(projectId, currentPhase);
    const currentPhaseWeight = PHASE_WEIGHTS[currentPhase as keyof typeof PHASE_WEIGHTS] || 0;
    totalProgress += (currentPhaseProgress * currentPhaseWeight) / 100;

    return Math.min(100, Math.round(totalProgress));
  } catch (error) {
    console.error('Error calculating project progress:', error);
    return 0;
  }
}

/**
 * Update project progress percentage in the database
 */
export async function updateProjectProgress(projectId: string, progressPercentage?: number): Promise<number> {
  try {
    // Calculate progress if not provided
    const newProgress = progressPercentage ?? await calculateProjectProgress(projectId);

    // Update project progress
    const { error } = await supabase
      .from('projects')
      .update({ progress_percentage: newProgress })
      .eq('id', projectId);

    if (error) throw error;

    // Add progress entry for tracking
    await supabase
      .from('progress_entries')
      .insert({
        project_id: projectId,
        progress_percentage: newProgress,
        created_at: new Date().toISOString()
      });

    // Trigger progress sync event
    window.dispatchEvent(new CustomEvent('progressSync', { 
      detail: { projectId, progress: newProgress } 
    }));

    return newProgress;
  } catch (error) {
    console.error('Error updating project progress:', error);
    return 0;
  }
}

/**
 * Check if current phase is complete and advance to next phase
 */
export async function checkAndAdvancePhase(projectId: string): Promise<{ advanced: boolean; newPhase?: string }> {
  try {
    // Get current project phase
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('current_phase')
      .eq('id', projectId)
      .single();

    if (projectError) throw projectError;

    const currentPhase = project?.current_phase || 'concept';
    const currentPhaseProgress = await calculatePhaseProgress(projectId, currentPhase);

    // If current phase is 100% complete, advance to next phase
    if (currentPhaseProgress >= 100) {
      const currentPhaseIndex = PHASE_ORDER.indexOf(currentPhase);
      const nextPhaseIndex = currentPhaseIndex + 1;

      // Only advance if there's a next phase and it has weight (active phases)
      if (nextPhaseIndex < PHASE_ORDER.length) {
        const nextPhase = PHASE_ORDER[nextPhaseIndex];
        const nextPhaseWeight = PHASE_WEIGHTS[nextPhase as keyof typeof PHASE_WEIGHTS];

        if (nextPhaseWeight > 0) {
          // Update project phase
          const { error: updateError } = await supabase
            .from('projects')
            .update({ current_phase: nextPhase })
            .eq('id', projectId);

          if (updateError) throw updateError;

          // Log phase advancement
          await supabase
            .from('activities')
            .insert({
              project_id: projectId,
              type: 'phase_advancement',
              description: `Project advanced from ${currentPhase} to ${nextPhase} phase`,
              metadata: {
                fromPhase: currentPhase,
                toPhase: nextPhase,
                phaseProgress: currentPhaseProgress
              }
            });

          return { advanced: true, newPhase: nextPhase };
        }
      }
    }

    return { advanced: false };
  } catch (error) {
    console.error('Error checking phase advancement:', error);
    return { advanced: false };
  }
}

/**
 * Update progress when task status changes
 */
export async function handleTaskStatusChange(
  projectId: string, 
  taskId: string, 
  oldStatus: string, 
  newStatus: string
): Promise<number> {
  try {
    // Check and advance phase if needed
    const phaseAdvancement = await checkAndAdvancePhase(projectId);
    
    // Calculate new progress based on task changes
    const newProgress = await calculateProjectProgress(projectId);
    
    // Update project progress
    await updateProjectProgress(projectId, newProgress);
    
    // Log activity
    await supabase
      .from('activities')
      .insert({
        project_id: projectId,
        type: 'task_status_change',
        description: `Task status changed from ${oldStatus} to ${newStatus}${phaseAdvancement.advanced ? ` - Advanced to ${phaseAdvancement.newPhase} phase` : ''}`,
        metadata: {
          taskId,
          oldStatus,
          newStatus,
          newProgress,
          phaseAdvanced: phaseAdvancement.advanced,
          newPhase: phaseAdvancement.newPhase
        }
      });

    return newProgress;
  } catch (error) {
    console.error('Error handling task status change:', error);
    return 0;
  }
}

/**
 * Setup progress synchronization listener for a component
 */
export function useProgressSync(
  callback: (data: { projectId: string; progress: number }) => void
): () => void {
  const handleProgressSync = (event: CustomEvent) => {
    callback(event.detail);
  };

  window.addEventListener('progressSync', handleProgressSync as EventListener);
  
  return () => {
    window.removeEventListener('progressSync', handleProgressSync as EventListener);
  };
}

/**
 * Get phase information and progress
 */
export async function getPhaseInfo(projectId: string): Promise<{
  currentPhase: string;
  currentPhaseProgress: number;
  overallProgress: number;
  phaseWeights: typeof PHASE_WEIGHTS;
  phaseOrder: typeof PHASE_ORDER;
}> {
  try {
    const { data: project, error } = await supabase
      .from('projects')
      .select('current_phase')
      .eq('id', projectId)
      .single();

    if (error) throw error;

    const currentPhase = project?.current_phase || 'concept';
    const currentPhaseProgress = await calculatePhaseProgress(projectId, currentPhase);
    const overallProgress = await calculateProjectProgress(projectId);

    return {
      currentPhase,
      currentPhaseProgress,
      overallProgress,
      phaseWeights: PHASE_WEIGHTS,
      phaseOrder: PHASE_ORDER
    };
  } catch (error) {
    console.error('Error getting phase info:', error);
    return {
      currentPhase: 'concept',
      currentPhaseProgress: 0,
      overallProgress: 0,
      phaseWeights: PHASE_WEIGHTS,
      phaseOrder: PHASE_ORDER
    };
  }
}

/**
 * Sync progress across all project-related data
 */
export async function syncAllProjectData(projectId: string): Promise<void> {
  try {
    // Check and advance phase if needed
    await checkAndAdvancePhase(projectId);
    
    // Update project progress
    const newProgress = await updateProjectProgress(projectId);
    
    // Update project status if completed
    if (newProgress === 100) {
      const { data: project } = await supabase
        .from('projects')
        .select('status, current_phase')
        .eq('id', projectId)
        .single();
      
      if (project && project.status === 'active') {
        // Mark project as completed if all phases are done
        await supabase
          .from('projects')
          .update({ 
            status: 'completed',
            current_phase: 'handover' 
          })
          .eq('id', projectId);
      }
    }
  } catch (error) {
    console.error('Error syncing project data:', error);
  }
}