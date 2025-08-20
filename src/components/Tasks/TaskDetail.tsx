import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TaskDocuments } from './TaskDocuments';
import { EditTaskDialog } from './EditTaskDialog';
import { 
  Calendar, 
  User, 
  Building2,
  Edit,
  Clock,
  Flag,
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

interface TaskDetailProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated: () => void;
  projects: any[];
}

export const TaskDetail = ({ task, open, onOpenChange, onTaskUpdated, projects }: TaskDetailProps) => {
  const [editingTask, setEditingTask] = useState(false);

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

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate || task.status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-xl mb-2">{task.title}</DialogTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={getStatusColor(task.status)}>
                    {task.status.replace('_', ' ')}
                  </Badge>
                  <Badge className={getPriorityColor(task.priority)}>
                    <Flag className="h-3 w-3 mr-1" />
                    {task.priority}
                  </Badge>
                  {isOverdue(task.due_date) && (
                    <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                      Overdue
                    </Badge>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditingTask(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </DialogHeader>

          <Tabs defaultValue="details" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Task Details</TabsTrigger>
              <TabsTrigger value="documents">
                <FileText className="h-4 w-4 mr-2" />
                Documents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6 mt-6">
              {/* Description */}
              {task.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{task.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Task Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Task Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Project</p>
                        <p className="text-sm text-muted-foreground">{task.project.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Phase</p>
                        <p className="text-sm text-muted-foreground capitalize">{task.phase.replace('_', ' ')}</p>
                      </div>
                    </div>

                    {task.due_date && (
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Due Date</p>
                          <p className={`text-sm ${isOverdue(task.due_date) ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {format(new Date(task.due_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    )}

                    {task.assignee && (
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {task.assignee.first_name.charAt(0)}{task.assignee.last_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">Assigned to</p>
                            <p className="text-sm text-muted-foreground">
                              {task.assignee.first_name} {task.assignee.last_name}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Created: </span>
                      {format(new Date(task.created_at), 'MMM d, yyyy')}
                    </div>
                    <div>
                      <span className="font-medium">Last updated: </span>
                      {format(new Date(task.updated_at), 'MMM d, yyyy')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-6">
              <TaskDocuments taskId={task.id} projectId={task.project_id} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      {editingTask && (
        <EditTaskDialog
          task={task}
          open={editingTask}
          onOpenChange={setEditingTask}
          onTaskUpdated={() => {
            onTaskUpdated();
            setEditingTask(false);
          }}
          projects={projects}
        />
      )}
    </>
  );
};