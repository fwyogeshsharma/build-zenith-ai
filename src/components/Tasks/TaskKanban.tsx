import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EditTaskDialog } from './EditTaskDialog';
import { TaskDetail } from './TaskDetail';
import { TaskDocumentUpload } from './TaskDocumentUpload';
import { 
  MoreHorizontal, 
  Calendar, 
  User, 
  Building2,
  Edit,
  Trash2,
  FileText
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  assigned_to: string | null;
  project_id: string;
  phase: string;
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

interface TaskKanbanProps {
  tasks: Task[];
  onTaskUpdate: () => void;
  projects: any[];
}

const statusColumns = [
  { id: 'pending', title: 'Pending', color: 'border-warning/20 bg-warning/5' },
  { id: 'in_progress', title: 'In Progress', color: 'border-primary/20 bg-primary/5' },
  { id: 'completed', title: 'Completed', color: 'border-success/20 bg-success/5' },
  { id: 'blocked', title: 'Blocked', color: 'border-destructive/20 bg-destructive/5' }
];

export const TaskKanban = ({ tasks, onTaskUpdate, projects }: TaskKanbanProps) => {
  const { toast } = useToast();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [uploadingToTask, setUploadingToTask] = useState<Task | null>(null);

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
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Task moved to ${newStatus.replace('_', ' ')}`,
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

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
      onTaskUpdate();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== newStatus) {
      updateTaskStatus(draggedTask.id, newStatus);
    }
    setDraggedTask(null);
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-[calc(100vh-300px)]">
      {statusColumns.map((column) => {
        const columnTasks = getTasksByStatus(column.id);
        
        return (
          <div key={column.id} className="flex flex-col">
            <Card className={`${column.color} flex-1 flex flex-col`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  {column.title}
                  <Badge variant="secondary" className="ml-2">
                    {columnTasks.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              
              <CardContent 
                className="flex-1 space-y-3 overflow-y-auto"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {columnTasks.map((task) => (
                  <Card
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    className={`cursor-move transition-all hover:shadow-md ${
                      isOverdue(task.due_date, task.status) 
                        ? 'border-destructive/30 bg-destructive/5' 
                        : 'hover:bg-accent/50'
                    } ${draggedTask?.id === task.id ? 'opacity-50' : ''}`}
                  >
                    <CardContent className="p-3">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <h4 
                              className="font-medium text-sm leading-tight cursor-pointer hover:text-primary transition-colors"
                              onClick={() => setViewingTask(task)}
                            >
                              {task.title}
                            </h4>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingTask(task)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Task
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setUploadingToTask(task)}>
                                <FileText className="h-4 w-4 mr-2" />
                                Add Document
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => deleteTask(task.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Task
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap gap-1">
                          <Badge className={getPriorityColor(task.priority)} style={{ fontSize: '10px' }}>
                            {task.priority}
                          </Badge>
                          {isOverdue(task.due_date, task.status) && (
                            <Badge className="bg-destructive/10 text-destructive border-destructive/20" style={{ fontSize: '10px' }}>
                              Overdue
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate">{task.project.name}</span>
                          </div>
                          
                          {task.due_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{format(new Date(task.due_date), 'MMM d')}</span>
                            </div>
                          )}
                          
                          {task.assignee && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <Avatar className="h-4 w-4">
                                <AvatarFallback className="text-[10px]">
                                  {task.assignee.first_name.charAt(0)}{task.assignee.last_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate">
                                {task.assignee.first_name} {task.assignee.last_name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {columnTasks.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    No tasks in {column.title.toLowerCase()}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}

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

      {/* Document Upload Dialog */}
      {uploadingToTask && (
        <Dialog open={!!uploadingToTask} onOpenChange={(open) => !open && setUploadingToTask(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Document to "{uploadingToTask.title}"</DialogTitle>
            </DialogHeader>
            <TaskDocumentUpload
              taskId={uploadingToTask.id}
              projectId={uploadingToTask.project_id}
              onUploadComplete={() => {
                setUploadingToTask(null);
                onTaskUpdate();
              }}
              onCancel={() => setUploadingToTask(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};