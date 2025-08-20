import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardSidebar from '@/components/Dashboard/DashboardSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { TaskList } from '@/components/Tasks/TaskList';
import { TaskKanban } from '@/components/Tasks/TaskKanban';
import { TaskCalendar } from '@/components/Tasks/TaskCalendar';
import { CreateTaskDialog } from '@/components/Tasks/CreateTaskDialog';
import { 
  Search, 
  Plus, 
  Filter, 
  Calendar,
  List,
  Columns3,
  Target,
  Clock,
  CheckCircle,
  AlertCircle
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

interface TaskStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  overdue: number;
}

const Tasks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'calendar'>('list');
  const [taskStats, setTaskStats] = useState<TaskStats>({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    overdue: 0
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchProjects();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          project:projects(name, status),
          assignee:profiles!tasks_assigned_to_fkey(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter out tasks with invalid assignee data
      const validTasks = (data || []).map(task => ({
        ...task,
        assignee: task.assignee && typeof task.assignee === 'object' && 'first_name' in task.assignee 
          ? task.assignee 
          : undefined
      }));

      setTasks(validTasks);
      calculateStats(validTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, status')
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const calculateStats = (taskData: Task[]) => {
    const now = new Date();
    const stats = taskData.reduce((acc, task) => {
      acc.total++;
      
      if (task.status === 'pending') acc.pending++;
      else if (task.status === 'in_progress') acc.in_progress++;
      else if (task.status === 'completed') acc.completed++;
      
      if (task.due_date && new Date(task.due_date) < now && task.status !== 'completed') {
        acc.overdue++;
      }
      
      return acc;
    }, { total: 0, pending: 0, in_progress: 0, completed: 0, overdue: 0 });

    setTaskStats(stats);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchQuery || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.project.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesProject = projectFilter === 'all' || task.project_id === projectFilter;
    const matchesAssignee = assigneeFilter === 'all' || task.assigned_to === assigneeFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesProject && matchesAssignee;
  });

  const getUniqueAssignees = () => {
    const assignees = tasks
      .filter(task => task.assignee)
      .map(task => task.assignee!)
      .filter((assignee, index, self) => 
        assignee && index === self.findIndex(a => a && a.email === assignee.email)
      );
    return assignees;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex">
          <DashboardSidebar />
          <div className="flex-1 p-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-1/4"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-muted rounded"></div>
                ))}
              </div>
              <div className="h-96 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <DashboardSidebar />
        <div className="flex-1 p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Task Management</h1>
              <p className="text-muted-foreground mt-2">
                Manage and track tasks across all your projects
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-construction hover:bg-construction-dark">
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{taskStats.total}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">{taskStats.pending}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <div className="h-4 w-4 rounded-full bg-primary"></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{taskStats.in_progress}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{taskStats.completed}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <AlertCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{taskStats.overdue}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and View Toggle */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={projectFilter} onValueChange={setProjectFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'kanban' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('kanban')}
                  >
                    <Columns3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'calendar' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('calendar')}
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Task Views */}
          <div className="space-y-6">
            {viewMode === 'list' && (
              <TaskList 
                tasks={filteredTasks} 
                onTaskUpdate={fetchTasks}
                projects={projects}
              />
            )}
            
            {viewMode === 'kanban' && (
              <TaskKanban 
                tasks={filteredTasks} 
                onTaskUpdate={fetchTasks}
                projects={projects}
              />
            )}
            
            {viewMode === 'calendar' && (
              <TaskCalendar 
                tasks={filteredTasks} 
                onTaskUpdate={fetchTasks}
                projects={projects}
              />
            )}
          </div>

          {/* Create Task Dialog */}
          <CreateTaskDialog
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            onTaskCreated={fetchTasks}
            projects={projects}
          />
        </div>
      </div>
    </div>
  );
};

export default Tasks;