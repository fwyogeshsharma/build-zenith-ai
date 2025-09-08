// LEED Points Synchronization Utility
import { loadCSVData } from './csvParser';
import { LEEDSubcategory } from './leedSubcategories';

// Cache for subcategories
let cachedSubcategories: LEEDSubcategory[] | null = null;

// Load and cache subcategories
export const loadSubcategories = async (): Promise<LEEDSubcategory[]> => {
  if (!cachedSubcategories) {
    cachedSubcategories = await loadCSVData();
  }
  return cachedSubcategories;
};

// Get subcategory info by ID
export const getSubcategoryById = async (subcategoryId: string): Promise<LEEDSubcategory | null> => {
  const subcategories = await loadSubcategories();
  return subcategories.find(sub => sub.subcategoryId === subcategoryId) || null;
};

// Auto-populate task LEED points based on subcategory ID
export const populateTaskLEEDPoints = async (task: any): Promise<any> => {
  if (!task.leed_subcategory_id) return task;
  
  const subcategory = await getSubcategoryById(task.leed_subcategory_id);
  if (!subcategory) return task;
  
  return {
    ...task,
    leed_points_possible: subcategory.maxScore,
    // If task is completed but no points achieved are set, use max score
    leed_points_achieved: task.status === 'completed' && !task.leed_points_achieved 
      ? subcategory.maxScore 
      : task.leed_points_achieved
  };
};

// Bulk update tasks with correct LEED points
export const syncAllTasksLEEDPoints = async (projectId: string): Promise<void> => {
  const { supabase } = await import('@/integrations/supabase/client');
  
  // Get all LEED tasks for the project
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .not('leed_subcategory_id', 'is', null);
    
  if (error) {
    console.error('Error fetching LEED tasks:', error);
    return;
  }
  
  if (!tasks || tasks.length === 0) return;
  
  const subcategories = await loadSubcategories();
  
  // Update each task with correct points
  const updates = tasks.map(task => {
    const subcategory = subcategories.find(sub => sub.subcategoryId === task.leed_subcategory_id);
    if (!subcategory) return null;
    
    return {
      id: task.id,
      leed_points_possible: subcategory.maxScore,
      leed_points_achieved: task.status === 'completed' && !task.leed_points_achieved
        ? subcategory.maxScore
        : task.leed_points_achieved
    };
  }).filter(Boolean);
  
  // Batch update
  for (const update of updates) {
    if (update) {
      await supabase
        .from('tasks')
        .update({
          leed_points_possible: update.leed_points_possible,
          leed_points_achieved: update.leed_points_achieved
        })
        .eq('id', update.id);
    }
  }
  
  console.log(`Synced LEED points for ${updates.length} tasks`);
};

// Get category from subcategory ID
export const getCategoryFromSubcategory = (subcategoryId: string): string => {
  // Extract category prefix (e.g., "SS" from "SSc1")
  const match = subcategoryId.match(/^([A-Z]+)/);
  return match ? match[1] : 'Unknown';
};

// Get category name mapping
export const getCategoryName = (categoryId: string): string => {
  const categoryMap: Record<string, string> = {
    'IP': 'Integrative Process',
    'LT': 'Location and Transportation', 
    'SS': 'Sustainable Sites',
    'WE': 'Water Efficiency',
    'EA': 'Energy and Atmosphere',
    'MR': 'Materials and Resources', 
    'IEQ': 'Indoor Environmental Quality',
    'I': 'Innovation',
    'RP': 'Regional Priority',
    'NSE': 'Natural Systems & Ecology',
    'TL': 'Transportation & Land Use',
    'EGGE': 'Energy and Greenhouse Gas Emissions',
    'QL': 'Quality of Life'
  };
  
  return categoryMap[categoryId] || categoryId;
};