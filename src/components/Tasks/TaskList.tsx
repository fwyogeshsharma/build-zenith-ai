import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EditTaskDialog } from './EditTaskDialog';
import { TaskDetail } from './TaskDetail';
import { TaskProgressDialog } from '../Progress/TaskProgressDialog';
import { Progress } from '@/components/ui/progress';
import { 
  MoreHorizontal, 
  Calendar, 
  User, 
  Building2,
  Edit,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  TrendingUp
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  start_date: string | null;
  duration_hours: number | null;
  created_at: string;
  updated_at: string;
  assigned_to: string | null;
  project_id: string;
  phase: string;
  progress_percentage?: number;
  actual_hours?: number;
  estimated_hours?: number;
  progress_notes?: string;
  project: {
    name: string;
    status: string;
  };
  assignee?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface TaskListProps {
  tasks: Task[];
  onTaskUpdate: () => void;
  projects: any[];
}

export const TaskList = ({ tasks, onTaskUpdate, projects }: TaskListProps) => {
  const { toast } = useToast();
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [progressingTask, setProgressingTask] = useState<Task | null>(null);

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-warning/10 text-warning border-warning/20',
      in_progress: 'bg-primary/10 text-primary border-primary/20',
      completed: 'bg-success/10 text-success border-success/20',
      blocked: 'bg-destructive/10 text-destructive border-destructive/20'
    };
    return colors[status as keyof typeof colors] || 'bg-muted/10 text-muted-foreground border-muted/20';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-muted/10 text-muted-foreground border-muted/20',
      medium: 'bg-primary/10 text-primary border-primary/20',
      high: 'bg-construction/10 text-construction border-construction/20',
      urgent: 'bg-destructive/10 text-destructive border-destructive/20'
    };
    return colors[priority as keyof typeof colors] || 'bg-muted/10 text-muted-foreground border-muted/20';
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const updateData: any = { 
        status: newStatus,
        progress_percentage: newStatus === 'completed' ? 100 : (newStatus === 'in_progress' ? 50 : 0)
      };
      
      // Set start_date when task is started
      if (newStatus === 'in_progress') {
        updateData.start_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Task status updated to ${newStatus}`,
      });
      onTaskUpdate();
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async () => {
    if (!deletingTask) return;
    
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', deletingTask.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
      onTaskUpdate();
      setDeletingTask(null);
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && tasks.find(t => t.due_date === dueDate)?.status !== 'completed';
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedTasks.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedTasks.length} task{selectedTasks.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    selectedTasks.forEach(taskId => updateTaskStatus(taskId, 'in_progress'));
                    setSelectedTasks([]);
                  }}
                >
                  Start Selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    selectedTasks.forEach(taskId => updateTaskStatus(taskId, 'completed'));
                    setSelectedTasks([]);
                  }}
                >
                  Complete Selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedTasks([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Cards */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground">
                <CheckCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
                <p>Create a new task or adjust your filters to see results.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          tasks.map((task) => (
            <Card key={task.id} className={`transition-all hover:shadow-md ${isOverdue(task.due_date) ? 'border-destructive/30 bg-destructive/5' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={selectedTasks.includes(task.id)}
                    onCheckedChange={() => toggleTaskSelection(task.id)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 
                          className="font-semibold text-foreground mb-1 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => setViewingTask(task)}
                        >
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          {isOverdue(task.due_date) && (
                            <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                              Overdue
                            </Badge>
                          )}
                        </div>

                        {/* Progress Bar */}
                        {task.progress_percentage !== undefined && task.progress_percentage > 0 && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{task.progress_percentage}%</span>
                            </div>
                            <Progress value={task.progress_percentage} className="h-2" />
                          </div>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            <span>{task.project.name}</span>
                          </div>
                          
                          {task.start_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>Start: {format(new Date(task.start_date), 'MMM d, yyyy')}</span>
                            </div>
                          )}
                          
                          {task.due_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>Due: {format(new Date(task.due_date), 'MMM d, yyyy')}</span>
                            </div>
                          )}
                          
                          {task.duration_hours && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>Duration: {task.duration_hours}h</span>
                            </div>
                          )}
                          
                          {task.start_date && task.duration_hours && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>Expected: {format(new Date(new Date(task.start_date).getTime() + (task.duration_hours * 60 * 60 * 1000)), 'MMM d, yyyy')}</span>
                            </div>
                          )}
                          
                          {task.assignee && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-xs">
                                  {task.assignee.first_name.charAt(0)}{task.assignee.last_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{task.assignee.first_name} {task.assignee.last_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Progress Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setProgressingTask(task)}
                          className="h-8"
                        >
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Progress
                        </Button>
                        
                        {/* Quick Actions */}
                        {task.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateTaskStatus(task.id, 'in_progress')}
                            className="h-8"
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Start
                          </Button>
                        )}
                        
                        {task.status === 'in_progress' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateTaskStatus(task.id, 'completed')}
                            className="h-8"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Complete
                          </Button>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingTask(task)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Task
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateTaskStatus(task.id, 'pending')}
                              disabled={task.status === 'pending'}
                            >
                              <Pause className="h-4 w-4 mr-2" />
                              Set to Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateTaskStatus(task.id, 'in_progress')}
                              disabled={task.status === 'in_progress'}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Set to In Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateTaskStatus(task.id, 'completed')}
                              disabled={task.status === 'completed'}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark Complete
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeletingTask(task)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Task
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Task Dialog */}
      {editingTask && (
        <EditTaskDialog
          task={editingTask}
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
          onTaskUpdated={onTaskUpdate}
          projects={projects}
        />
      )}

      {/* Task Detail Dialog */}
      {viewingTask && (
        <TaskDetail
          task={viewingTask}
          open={!!viewingTask}
          onOpenChange={(open) => !open && setViewingTask(null)}
          onTaskUpdated={onTaskUpdate}
          projects={projects}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTask} onOpenChange={(open) => !open && setDeletingTask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingTask?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Task Progress Dialog */}
      {progressingTask && (
        <TaskProgressDialog
          task={{ ...progressingTask, project_id: progressingTask.project_id }}
          open={!!progressingTask}
          onOpenChange={(open) => !open && setProgressingTask(null)}
          onProgressUpdated={onTaskUpdate}
        />
      )}
    </div>
  );
};