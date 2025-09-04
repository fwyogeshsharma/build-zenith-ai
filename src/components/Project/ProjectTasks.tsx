import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Plus, Search, Filter, CheckCircle2, Clock, AlertCircle, User, Trash2, MoreVertical, FileText, Bot, TrendingUp, Wrench, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import { handleTaskStatusChange } from '@/lib/progressSync';
import { TaskDetail } from '../Tasks/TaskDetail';
import { TaskProgressDialog } from '../Progress/TaskProgressDialog';
import { TaskResourcesDialog } from '../Tasks/TaskResourcesDialog';
import { TaskGanttChart } from './TaskGanttChart';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskWithProject = Task & {
  project: {
    name: string;
    status: string;
  };
};

interface ProjectTasksProps {
  projectId: string;
  initialPhaseFilter?: string | null;
}

const ProjectTasks = ({ projectId, initialPhaseFilter }: ProjectTasksProps) => {
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [taskDocuments, setTaskDocuments] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPhase, setFilterPhase] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<TaskWithProject | null>(null);
  const [progressTask, setProgressTask] = useState<TaskWithProject | null>(null);
  const [resourcesTask, setResourcesTask] = useState<TaskWithProject | null>(null);
  const [showGantt, setShowGantt] = useState(false);
  const { toast } = useToast();

  const [newTask, setNewTask] = useState<Partial<TaskInsert>>({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    phase: 'concept',
    project_id: projectId
  });

  useEffect(() => {
    fetchTasks();
    fetchTaskDocuments();
    
    // Set initial phase filter if provided
    if (initialPhaseFilter) {
      setFilterPhase(initialPhaseFilter);
    }
  }, [projectId, initialPhaseFilter]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          project:projects!tasks_project_id_fkey(name, status)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks((data || []) as any[]);
    } catch (error: any) {
      toast({
        title: "Error loading tasks",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('task_id')
        .eq('project_id', projectId)
        .not('task_id', 'is', null);

      if (error) throw error;
      
      // Count documents per task
      const documentCounts: Record<string, number> = {};
      (data || []).forEach((doc) => {
        if (doc.task_id) {
          documentCounts[doc.task_id] = (documentCounts[doc.task_id] || 0) + 1;
        }
      });
      
      setTaskDocuments(documentCounts);
    } catch (error: any) {
      console.error('Error loading task documents:', error);
    }
  };

  const createTask = async () => {
    if (!newTask.title?.trim()) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: newTask.title!,
          description: newTask.description,
          status: newTask.status!,
          priority: newTask.priority!,
          phase: newTask.phase!,
          due_date: newTask.due_date,
          project_id: projectId,
          created_by: (await supabase.auth.getUser()).data.user?.id || ''
        })
        .select()
        .single();

      if (error) throw error;

      // Refetch tasks to get the updated task with project info
      fetchTasks();
      setIsCreateOpen(false);
      setNewTask({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        phase: 'concept',
        project_id: projectId
      });

      // Refresh document counts
      fetchTaskDocuments();

      toast({
        title: "Task created",
        description: "New task has been added to the project",
      });
    } catch (error: any) {
      toast({
        title: "Error creating task",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      // Get the old status before updating
      const task = tasks.find(t => t.id === taskId);
      const oldStatus = task?.status || 'pending';
      
      const updateData: any = { 
        status,
        completed_date: status === 'completed' ? new Date().toISOString().split('T')[0] : null,
        progress_percentage: status === 'completed' ? 100 : (task?.progress_percentage || 0)
      };

      // Auto-set start_date when task starts
      if (status === 'in_progress' && task && !task.start_date) {
        updateData.start_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;

      // Update local state
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, ...updateData }
          : task
      ));

      // Trigger progress sync across all components
      await handleTaskStatusChange(projectId, taskId, oldStatus, status);

      toast({
        title: "Task updated",
        description: `Task marked as ${status}`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating task",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteTask = async (taskId: string, taskTitle: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.filter(task => task.id !== taskId));

      // Refresh document counts since we might have deleted tasks with documents
      fetchTaskDocuments();

      toast({
        title: "Task deleted",
        description: `"${taskTitle}" has been removed from the project`,
      });
    } catch (error: any) {
      toast({
        title: "Error deleting task",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'blocked': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPhase = filterPhase === 'all' || task.phase === filterPhase;
    return matchesSearch && matchesStatus && matchesPhase;
  });

  if (loading) {
    return <div className="text-center p-8">Loading tasks...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPhase} onValueChange={setFilterPhase}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Phase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Phases</SelectItem>
              <SelectItem value="concept">Concept</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="pre_construction">Pre-Construction</SelectItem>
              <SelectItem value="execution">Execution</SelectItem>
              <SelectItem value="handover">Handover</SelectItem>
              <SelectItem value="operations_maintenance">Operations & Maintenance</SelectItem>
              <SelectItem value="renovation_demolition">Renovation & Demolition</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={() => setShowGantt(!showGantt)}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            {showGantt ? 'List View' : 'Gantt Chart'}
          </Button>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Task Title *</Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Enter task title"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Task description..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newTask.priority} onValueChange={(value) => setNewTask({ ...newTask, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="phase">Phase</Label>
                  <Select value={newTask.phase} onValueChange={(value) => setNewTask({ ...newTask, phase: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concept">Concept</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="pre_construction">Pre-Construction</SelectItem>
                      <SelectItem value="execution">Execution</SelectItem>
                      <SelectItem value="handover">Handover</SelectItem>
                      <SelectItem value="operations_maintenance">Operations & Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={newTask.due_date || ''}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={createTask} className="flex-1">
                  Create Task
                </Button>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tasks List or Gantt Chart */}
      {showGantt ? (
        <TaskGanttChart projectId={projectId} />
      ) : (
        <>
          {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              {tasks.length === 0 ? 'No tasks created yet' : 'No tasks match your search'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setViewingTask(task)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(task.status)}
                      <h3 className="font-semibold truncate">{task.title}</h3>
                      <Badge variant="outline" className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(task.status)}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Phase: {task.phase.replace('_', ' ')}</span>
                      {task.due_date && (
                        <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                      )}
                      {task.assigned_to && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>Assigned</span>
                        </div>
                      )}
                      {taskDocuments[task.id] && (
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          <span>{taskDocuments[task.id]} document{taskDocuments[task.id] !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setResourcesTask(task)}
                      className="flex items-center gap-1"
                    >
                      <Wrench className="h-3 w-3" />
                      Resources
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toast({
                        title: "AI Task Insight",
                        description: `Analyzing task: ${task.title}. AI recommendations will be generated based on task context, priority, and project phase.`,
                      })}
                      className="flex items-center gap-1"
                    >
                      <Bot className="h-3 w-3" />
                      AI Insights
                    </Button>
                    {task.status !== 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTaskStatus(task.id, 'completed')}
                      >
                        Complete
                      </Button>
                    )}
                    {task.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTaskStatus(task.id, 'in_progress')}
                      >
                        Start
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Task
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Task</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{task.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteTask(task.id, task.title)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete Task
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
           ))}
         </div>
       )}
       </>
     )}

     {/* Task Statistics */}
     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">
              {tasks.filter(t => t.status === 'pending').length}
            </div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {tasks.filter(t => t.status === 'in_progress').length}
            </div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {tasks.filter(t => t.status === 'completed').length}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {tasks.filter(t => t.status === 'blocked').length}
            </div>
            <div className="text-sm text-muted-foreground">Blocked</div>
          </CardContent>
        </Card>
       </div>

       {/* Task Detail Dialog */}
       {viewingTask && (
        <TaskDetail
          task={viewingTask}
          open={!!viewingTask}
          onOpenChange={(open) => !open && setViewingTask(null)}
          onTaskUpdated={() => {
            fetchTasks();
            fetchTaskDocuments();
          }}
          projects={[]} // We don't need projects array for viewing
        />
      )}
      {/* Task Progress Dialog */}
      {progressTask && (
        <TaskProgressDialog
          task={{ ...progressTask, project_id: progressTask.project_id }}
          open={!!progressTask}
          onOpenChange={(open) => !open && setProgressTask(null)}
          onProgressUpdated={fetchTasks}
        />
      )}

      {/* Task Resources Dialog */}
      {resourcesTask && (
        <TaskResourcesDialog
          isOpen={!!resourcesTask}
          onClose={() => setResourcesTask(null)}
          taskId={resourcesTask.id}
          taskTitle={resourcesTask.title}
        />
      )}
    </div>
  );
};

export default ProjectTasks;