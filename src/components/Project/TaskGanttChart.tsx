import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type Task = Database['public']['Tables']['tasks']['Row'];

interface TaskGanttChartProps {
  projectId: string;
}

interface GanttTask extends Task {
  startPosition: number;
  width: number;
}

export const TaskGanttChart = ({ projectId }: TaskGanttChartProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ganttTasks, setGanttTasks] = useState<GanttTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPhase, setFilterPhase] = useState('all');
  const [timelineStart, setTimelineStart] = useState<Date>();
  const [timelineEnd, setTimelineEnd] = useState<Date>();
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  useEffect(() => {
    calculateGanttPositions();
  }, [tasks, filterPhase]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
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

  const calculateGanttPositions = () => {
    const filteredTasks = filterPhase === 'all' 
      ? tasks 
      : tasks.filter(task => task.phase === filterPhase);

    if (filteredTasks.length === 0) {
      setGanttTasks([]);
      return;
    }

    // Find the earliest and latest dates
    const tasksWithDates = filteredTasks.filter(task => task.due_date || task.created_at);
    
    if (tasksWithDates.length === 0) {
      setGanttTasks([]);
      return;
    }

    const dates = tasksWithDates.flatMap(task => [
      new Date(task.created_at),
      task.due_date ? new Date(task.due_date) : new Date()
    ]);

    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Add padding
    minDate.setDate(minDate.getDate() - 2);
    maxDate.setDate(maxDate.getDate() + 7);
    
    setTimelineStart(minDate);
    setTimelineEnd(maxDate);

    const totalDays = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);

    const ganttData: GanttTask[] = filteredTasks.map(task => {
      const taskStart = new Date(task.created_at);
      const taskEnd = task.due_date ? new Date(task.due_date) : new Date();
      
      const startDays = (taskStart.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
      const taskDuration = Math.max(1, (taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        ...task,
        startPosition: (startDays / totalDays) * 100,
        width: (taskDuration / totalDays) * 100
      };
    });

    setGanttTasks(ganttData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'blocked': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-400';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return <div className="text-center p-8">Loading Gantt chart...</div>;
  }

  if (ganttTasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Task Gantt Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No tasks with dates found. Add tasks with due dates to see the Gantt chart.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Task Gantt Chart
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filterPhase} onValueChange={setFilterPhase}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Phases</SelectItem>
                <SelectItem value="concept">Concept</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="pre_construction">Pre-Construction</SelectItem>
                <SelectItem value="execution">Execution</SelectItem>
                <SelectItem value="handover">Handover</SelectItem>
                <SelectItem value="operations_maintenance">Operations</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Timeline Header */}
        {timelineStart && timelineEnd && (
          <div className="mb-4 relative h-8 border-b">
            <div className="absolute left-0 text-xs text-muted-foreground">
              {formatDate(timelineStart)}
            </div>
            <div className="absolute right-0 text-xs text-muted-foreground">
              {formatDate(timelineEnd)}
            </div>
          </div>
        )}

        {/* Gantt Chart */}
        <div className="space-y-2">
          {ganttTasks.map((task) => (
            <div key={task.id} className="relative">
              {/* Task Info */}
              <div className="flex items-center mb-1">
                <div className="w-1/3 min-w-0">
                  <div className="text-sm font-medium truncate">{task.title}</div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getPriorityColor(task.priority)}`}
                    >
                      {task.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {task.phase.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative h-6 bg-gray-100 rounded ml-2">
                <div
                  className={`absolute h-full rounded ${getStatusColor(task.status)} opacity-80`}
                  style={{
                    left: `${task.startPosition}%`,
                    width: `${task.width}%`,
                    minWidth: '20px'
                  }}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className="text-xs text-white font-medium">
                      {task.progress_percentage || 0}%
                    </span>
                  </div>
                </div>
                
                {/* Task dates tooltip area */}
                <div 
                  className="absolute inset-0 cursor-pointer"
                  title={`${task.title}\nStart: ${new Date(task.created_at).toLocaleDateString()}\nDue: ${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Not set'}\nProgress: ${task.progress_percentage || 0}%`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-400 rounded"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Blocked</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};