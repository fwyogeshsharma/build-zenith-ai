import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Filter, ZoomIn, ZoomOut, Clock, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type Task = Database['public']['Tables']['tasks']['Row'];

interface TaskGanttChartProps {
  projectId: string;
  tasks?: Task[];
}

type TimeScale = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';

interface GanttTask extends Task {
  startPosition: number;
  width: number;
  actualStartTime?: Date;
  actualEndTime?: Date;
  plannedDuration?: number; // in hours
  actualDuration?: number; // in hours
  timeEfficiency?: number; // percentage
  isOvertime?: boolean;
}

interface TimeMarker {
  position: number;
  label: string;
  type: 'major' | 'minor';
}

export const TaskGanttChart = ({ projectId, tasks: propTasks }: TaskGanttChartProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ganttTasks, setGanttTasks] = useState<GanttTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPhase, setFilterPhase] = useState('all');
  const [timeScale, setTimeScale] = useState<TimeScale>('daily');
  const [timelineStart, setTimelineStart] = useState<Date>();
  const [timelineEnd, setTimelineEnd] = useState<Date>();
  const [timeMarkers, setTimeMarkers] = useState<TimeMarker[]>([]);
  const [viewStartDate, setViewStartDate] = useState<Date>();
  const [viewEndDate, setViewEndDate] = useState<Date>();
  const { toast } = useToast();

  useEffect(() => {
    if (propTasks) {
      setTasks(propTasks);
      setLoading(false);
    } else {
      fetchTasks();
    }
  }, [projectId, propTasks]);

  useEffect(() => {
    calculateGanttPositions();
  }, [tasks, filterPhase, timeScale]);

  useEffect(() => {
    generateTimeMarkers();
  }, [timelineStart, timelineEnd, timeScale, viewStartDate, viewEndDate]);

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

  const getTimeScaleUnit = (scale: TimeScale) => {
    switch (scale) {
      case 'hourly': return { unit: 'hour', duration: 1, format: 'HH:mm' };
      case 'daily': return { unit: 'day', duration: 24, format: 'MMM dd' };
      case 'weekly': return { unit: 'week', duration: 168, format: 'MMM dd' };
      case 'monthly': return { unit: 'month', duration: 720, format: 'MMM yyyy' };
      case 'yearly': return { unit: 'year', duration: 8760, format: 'yyyy' };
      default: return { unit: 'day', duration: 24, format: 'MMM dd' };
    }
  };

  const generateTimeMarkers = () => {
    if (!timelineStart || !timelineEnd) return;

    const markers: TimeMarker[] = [];
    const timeUnit = getTimeScaleUnit(timeScale);
    const start = viewStartDate || timelineStart;
    const end = viewEndDate || timelineEnd;
    const totalDuration = end.getTime() - start.getTime();
    
    let current = new Date(start);
    let markerIndex = 0;

    while (current <= end && markerIndex < 100) { // Limit markers to prevent performance issues
      const position = ((current.getTime() - start.getTime()) / totalDuration) * 100;
      const isMajor = markerIndex % (timeScale === 'hourly' ? 6 : timeScale === 'daily' ? 7 : 4) === 0;
      
      markers.push({
        position,
        label: formatTimeMarker(current, timeScale),
        type: isMajor ? 'major' : 'minor'
      });

      // Increment based on time scale
      switch (timeScale) {
        case 'hourly':
          current.setHours(current.getHours() + 1);
          break;
        case 'daily':
          current.setDate(current.getDate() + 1);
          break;
        case 'weekly':
          current.setDate(current.getDate() + 7);
          break;
        case 'monthly':
          current.setMonth(current.getMonth() + 1);
          break;
        case 'yearly':
          current.setFullYear(current.getFullYear() + 1);
          break;
      }
      markerIndex++;
    }

    setTimeMarkers(markers);
  };

  const formatTimeMarker = (date: Date, scale: TimeScale) => {
    switch (scale) {
      case 'hourly':
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      case 'daily':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'weekly':
        return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      case 'monthly':
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      case 'yearly':
        return date.getFullYear().toString();
      default:
        return date.toLocaleDateString();
    }
  };

  const calculateTaskDuration = (task: Task): { planned: number, actual: number, efficiency: number } => {
    const plannedHours = task.estimated_hours || task.duration_hours || 8;
    let actualHours = task.actual_hours || 0;
    
    // If task is completed, calculate actual time from start to completion
    if (task.status === 'completed' && task.start_date) {
      const startTime = new Date(task.start_date);
      const endTime = task.completed_date ? new Date(task.completed_date) : new Date(task.updated_at);
      const timeDiff = endTime.getTime() - startTime.getTime();
      const calculatedHours = timeDiff / (1000 * 60 * 60);
      actualHours = task.actual_hours || calculatedHours;
    }
    
    const efficiency = plannedHours > 0 ? (plannedHours / Math.max(actualHours, 0.1)) * 100 : 100;
    
    return {
      planned: plannedHours,
      actual: actualHours,
      efficiency: Math.round(efficiency)
    };
  };

  const calculateGanttPositions = () => {
    const filteredTasks = filterPhase === 'all' 
      ? tasks 
      : tasks.filter(task => task.phase === filterPhase);

    if (filteredTasks.length === 0) {
      setGanttTasks([]);
      return;
    }

    // Get tasks with proper timing data
    const tasksWithDates = filteredTasks.filter(task => 
      task.start_date || task.due_date || task.created_at
    );
    
    if (tasksWithDates.length === 0) {
      setGanttTasks([]);
      return;
    }

    // Collect all relevant dates to establish project timeline
    const allDates: Date[] = [];
    
    tasksWithDates.forEach(task => {
      // Determine actual start date
      const actualStartDate = task.start_date ? new Date(task.start_date) : new Date(task.created_at);
      allDates.push(actualStartDate);
      
      // Calculate actual end date based on task status and available data
      let actualEndDate: Date;
      
      if (task.status === 'completed') {
        // For completed tasks, use actual completion date or updated_at
        actualEndDate = task.completed_date 
          ? new Date(task.completed_date) 
          : new Date(task.updated_at);
      } else {
        // For active/pending tasks, determine end date from available info
        if (task.due_date) {
          actualEndDate = new Date(task.due_date);
        } else if (task.duration_hours && task.start_date) {
          // Calculate end based on planned duration from start date
          actualEndDate = new Date(new Date(task.start_date).getTime() + (task.duration_hours * 60 * 60 * 1000));
        } else if (task.estimated_hours && task.start_date) {
          // Use estimated hours if duration not available
          actualEndDate = new Date(new Date(task.start_date).getTime() + (task.estimated_hours * 60 * 60 * 1000));
        } else {
          // Fallback: estimate based on task complexity and priority
          const defaultHours = task.priority === 'high' || task.priority === 'urgent' ? 8 : 24;
          actualEndDate = new Date(actualStartDate.getTime() + (defaultHours * 60 * 60 * 1000));
        }
      }
      
      allDates.push(actualEndDate);
    });

    // Find the earliest task start and latest task end to establish project timeline
    const projectStartDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const projectEndDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    
    // Add padding for better visualization (5% on each side)
    const totalProjectDays = (projectEndDate.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24);
    const paddingDays = Math.max(1, totalProjectDays * 0.05);
    
    const timelineStart = new Date(projectStartDate.getTime() - (paddingDays * 24 * 60 * 60 * 1000));
    const timelineEnd = new Date(projectEndDate.getTime() + (paddingDays * 24 * 60 * 60 * 1000));
    
    setTimelineStart(timelineStart);
    setTimelineEnd(timelineEnd);

    const totalTimelineDays = (timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);

    // Create synchronized Gantt tasks with accurate positioning
    const ganttData: GanttTask[] = tasksWithDates.map(task => {
      // Determine task start (actual or planned)
      const taskStart = task.start_date ? new Date(task.start_date) : new Date(task.created_at);
      
      // Determine task end based on current status and data
      let taskEnd: Date;
      if (task.status === 'completed') {
        taskEnd = task.completed_date 
          ? new Date(task.completed_date) 
          : new Date(task.updated_at);
      } else {
        if (task.due_date) {
          taskEnd = new Date(task.due_date);
        } else if (task.duration_hours && task.start_date) {
          taskEnd = new Date(new Date(task.start_date).getTime() + (task.duration_hours * 60 * 60 * 1000));
        } else if (task.estimated_hours && task.start_date) {
          taskEnd = new Date(new Date(task.start_date).getTime() + (task.estimated_hours * 60 * 60 * 1000));
        } else {
          const defaultHours = task.priority === 'high' || task.priority === 'urgent' ? 8 : 24;
          taskEnd = new Date(taskStart.getTime() + (defaultHours * 60 * 60 * 1000));
        }
      }
      
      // Calculate position and width as percentage of total timeline
      const startDays = (taskStart.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);
      const taskDuration = Math.max(0.25, (taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        ...task,
        startPosition: Math.max(0, (startDays / totalTimelineDays) * 100),
        width: Math.min(100, Math.max(1, (taskDuration / totalTimelineDays) * 100))
      };
    });

    // Enhanced Gantt data with time tracking and corrected progress
    const enhancedGanttData: GanttTask[] = ganttData.map(task => {
      const duration = calculateTaskDuration(task);
      const taskStart = task.start_date ? new Date(task.start_date) : new Date(task.created_at);
      const taskEnd = task.status === 'completed' 
        ? (task.completed_date ? new Date(task.completed_date) : new Date(task.updated_at))
        : (task.due_date ? new Date(task.due_date) : new Date(taskStart.getTime() + (duration.planned * 60 * 60 * 1000)));
      
      // Ensure completed tasks show 100% progress
      const correctedProgress = task.status === 'completed' ? 100 : (task.progress_percentage || 0);
      
      return {
        ...task,
        progress_percentage: correctedProgress,
        actualStartTime: taskStart,
        actualEndTime: taskEnd,
        plannedDuration: duration.planned,
        actualDuration: duration.actual,
        timeEfficiency: duration.efficiency,
        isOvertime: duration.actual > duration.planned,
        startPosition: task.startPosition,
        width: task.width
      };
    });

    // Sort tasks chronologically by actual start time (earliest first)
    enhancedGanttData.sort((a, b) => {
      const aStart = a.actualStartTime || new Date(a.created_at);
      const bStart = b.actualStartTime || new Date(b.created_at);
      return aStart.getTime() - bStart.getTime();
    });

    setGanttTasks(enhancedGanttData);

  };

  const navigateTimeline = (direction: 'prev' | 'next') => {
    if (!timelineStart || !timelineEnd) return;
    
    const currentStart = viewStartDate || timelineStart;
    const currentEnd = viewEndDate || timelineEnd;
    const duration = currentEnd.getTime() - currentStart.getTime();
    const shift = duration * 0.5; // Move by 50% of current view
    
    let newStart: Date, newEnd: Date;
    
    if (direction === 'next') {
      newStart = new Date(currentStart.getTime() + shift);
      newEnd = new Date(currentEnd.getTime() + shift);
      
      // Don't go beyond project end
      if (newEnd > timelineEnd) {
        newEnd = timelineEnd;
        newStart = new Date(newEnd.getTime() - duration);
      }
    } else {
      newStart = new Date(currentStart.getTime() - shift);
      newEnd = new Date(currentEnd.getTime() - shift);
      
      // Don't go before project start
      if (newStart < timelineStart) {
        newStart = timelineStart;
        newEnd = new Date(newStart.getTime() + duration);
      }
    }
    
    setViewStartDate(newStart);
    setViewEndDate(newEnd);
  };

  const zoomTimeline = (direction: 'in' | 'out') => {
    if (!timelineStart || !timelineEnd) return;
    
    const currentStart = viewStartDate || timelineStart;
    const currentEnd = viewEndDate || timelineEnd;
    const currentDuration = currentEnd.getTime() - currentStart.getTime();
    const center = new Date((currentStart.getTime() + currentEnd.getTime()) / 2);
    
    let newDuration: number;
    
    if (direction === 'in') {
      newDuration = currentDuration * 0.5; // Zoom in by 50%
    } else {
      newDuration = currentDuration * 2; // Zoom out by 200%
      // Don't zoom out beyond project boundaries
      const maxDuration = timelineEnd.getTime() - timelineStart.getTime();
      newDuration = Math.min(newDuration, maxDuration);
    }
    
    const newStart = new Date(center.getTime() - newDuration / 2);
    const newEnd = new Date(center.getTime() + newDuration / 2);
    
    // Keep within project boundaries
    if (newStart < timelineStart) {
      setViewStartDate(timelineStart);
      setViewEndDate(new Date(timelineStart.getTime() + newDuration));
    } else if (newEnd > timelineEnd) {
      setViewEndDate(timelineEnd);
      setViewStartDate(new Date(timelineEnd.getTime() - newDuration));
    } else {
      setViewStartDate(newStart);
      setViewEndDate(newEnd);
    }
  };

  const resetView = () => {
    setViewStartDate(undefined);
    setViewEndDate(undefined);
  };

  const getStatusColor = (task: Task) => {
    const now = new Date();
    const isOverdue = task.due_date && new Date(task.due_date) < now && task.status !== 'completed';
    
    switch (task.status) {
      case 'completed': 
        return isOverdue ? 'bg-orange-500' : 'bg-green-500';
      case 'in_progress': 
        return isOverdue ? 'bg-red-500' : 'bg-blue-500';
      case 'blocked': 
        return 'bg-red-600';
      default: 
        return isOverdue ? 'bg-yellow-500' : 'bg-gray-400';
    }
  };

  const getTaskBarClasses = (task: GanttTask) => {
    const now = new Date();
    const isOverdue = task.due_date && new Date(task.due_date) < now && task.status !== 'completed';
    const efficiency = task.timeEfficiency || 100;
    const isOvertime = task.isOvertime || false;
    
    let baseClasses = 'absolute h-full rounded relative overflow-hidden transition-all duration-200';
    
    // Color based on time efficiency and status
    if (task.status === 'completed') {
      if (isOvertime) {
        baseClasses += ' bg-gradient-to-r from-orange-400 to-orange-600'; // Took longer than planned
      } else if (efficiency > 120) {
        baseClasses += ' bg-gradient-to-r from-green-400 to-green-600'; // Completed faster than planned
      } else {
        baseClasses += ' bg-gradient-to-r from-blue-400 to-blue-600'; // Completed as planned
      }
    } else if (task.status === 'in_progress') {
      if (isOverdue) {
        baseClasses += ' bg-gradient-to-r from-red-500 to-red-700'; // Overdue
      } else if (efficiency < 80) {
        baseClasses += ' bg-gradient-to-r from-yellow-400 to-yellow-600'; // Taking longer than expected
      } else {
        baseClasses += ' bg-gradient-to-r from-blue-500 to-blue-700'; // On track
      }
    } else if (task.status === 'blocked') {
      baseClasses += ' bg-gradient-to-r from-red-600 to-red-800';
    } else {
      baseClasses += isOverdue ? ' bg-gradient-to-r from-yellow-300 to-yellow-500' : ' bg-gradient-to-r from-gray-300 to-gray-500';
    }
    
    // Add opacity based on priority
    const opacity = task.priority === 'urgent' ? ' opacity-100' : task.priority === 'high' ? ' opacity-90' : ' opacity-80';
    baseClasses += opacity;
    
    return baseClasses;
  };

  const getTimeEfficiencyIndicator = (task: GanttTask) => {
    const efficiency = task.timeEfficiency || 100;
    
    if (task.status !== 'completed') return null;
    
    if (efficiency > 120) {
      return { color: 'text-green-600', icon: '⚡', label: 'Fast' };
    } else if (efficiency < 80) {
      return { color: 'text-red-600', icon: '⏰', label: 'Slow' };
    } else {
      return { color: 'text-blue-600', icon: '✓', label: 'OnTime' };
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Time-Based Task Gantt Chart
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
          
          {/* Time Scale and Navigation Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Time Scale:</span>
              <Select value={timeScale} onValueChange={(value: TimeScale) => setTimeScale(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateTimeline('prev')}
                disabled={!timelineStart}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => zoomTimeline('in')}
                disabled={!timelineStart}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => zoomTimeline('out')}
                disabled={!timelineStart}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetView}
                disabled={!viewStartDate}
              >
                Reset
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateTimeline('next')}
                disabled={!timelineStart}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Enhanced Timeline Header */}
        {timelineStart && timelineEnd && (
          <div className="mb-6">
            <div className="relative h-12 border-b border-gray-200">
              {/* Time markers */}
              {timeMarkers.map((marker, index) => (
                <div
                  key={index}
                  className="absolute top-0 h-full flex flex-col items-center"
                  style={{ left: `${marker.position}%` }}
                >
                  <div className={`w-px bg-gray-300 ${
                    marker.type === 'major' ? 'h-full' : 'h-2/3 mt-auto'
                  }`} />
                  <div className={`text-xs mt-1 ${
                    marker.type === 'major' ? 'font-medium text-gray-700' : 'text-gray-500'
                  } transform -translate-x-1/2 whitespace-nowrap`}>
                    {marker.label}
                  </div>
                </div>
              ))}
              
              {/* Current time indicator */}
              {(() => {
                const now = new Date();
                const start = viewStartDate || timelineStart;
                const end = viewEndDate || timelineEnd;
                if (now >= start && now <= end) {
                  const position = ((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100;
                  return (
                    <div 
                      className="absolute top-0 h-full w-0.5 bg-red-500 z-10"
                      style={{ left: `${position}%` }}
                    >
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <div className="w-0 h-0 border-l-2 border-r-2 border-b-4 border-transparent border-b-red-500" />
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            
            {/* Timeline info */}
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
              <span>Viewing: {(viewStartDate || timelineStart).toLocaleDateString()} - {(viewEndDate || timelineEnd).toLocaleDateString()}</span>
              <span>Scale: {timeScale.charAt(0).toUpperCase() + timeScale.slice(1)}</span>
            </div>
          </div>
        )}

        {/* Gantt Chart */}
        <div className="space-y-2">
          {ganttTasks.map((task) => (
            <div key={task.id} className="relative">
              {/* Task Info */}
              <div className="flex items-center mb-2">
                <div className="w-2/5 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium truncate">{task.title}</div>
                    {getTimeEfficiencyIndicator(task) && (
                      <span className={`text-xs ${getTimeEfficiencyIndicator(task)?.color}`}>
                        {getTimeEfficiencyIndicator(task)?.icon}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getPriorityColor(task.priority)}`}
                    >
                      {task.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {task.phase.replace('_', ' ')}
                    </Badge>
                    {task.actualDuration && (
                      <Badge variant="outline" className="text-xs bg-blue-50">
                        {task.actualDuration.toFixed(1)}h
                      </Badge>
                    )}
                    {/* Show completion badge for completed tasks */}
                    {task.status === 'completed' ? (
                      <Badge 
                        variant="outline" 
                        className="text-xs bg-green-50 text-green-700 border-green-200"
                      >
                        ✓ 100% Complete
                      </Badge>
                    ) : task.timeEfficiency && task.status === 'in_progress' && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          task.timeEfficiency > 120 ? 'bg-green-50 text-green-700' :
                          task.timeEfficiency < 80 ? 'bg-red-50 text-red-700' :
                          'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {task.timeEfficiency}% eff
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="w-1/5 text-xs text-muted-foreground text-right">
                  {task.actualStartTime && (
                    <div>Start: {task.actualStartTime.toLocaleDateString()}</div>
                  )}
                  {task.actualEndTime && task.status === 'completed' && (
                    <div>End: {task.actualEndTime.toLocaleDateString()}</div>
                  )}
                </div>
              </div>

              {/* Enhanced Progress Bar with Time Tracking */}
              <div className="relative h-10 bg-gray-100 rounded ml-2 border border-gray-200 shadow-sm">
                <div
                  className={getTaskBarClasses(task)}
                  style={{
                    left: `${task.startPosition}%`,
                    width: `${task.width}%`,
                    minWidth: '20px'
                  }}
                >
                  {/* Progress overlay for incomplete tasks */}
                  {task.status !== 'completed' && (task.progress_percentage || 0) > 0 && (task.progress_percentage || 0) < 100 && (
                    <div 
                      className="absolute inset-0 bg-white bg-opacity-40 rounded"
                      style={{ 
                        left: `${task.progress_percentage || 0}%`,
                        width: `${100 - (task.progress_percentage || 0)}%`
                      }}
                    />
                  )}
                  
                  {/* Completion checkmark for completed tasks */}
                  {task.status === 'completed' && (
                    <div className="absolute right-1 top-1/2 transform -translate-y-1/2 text-white">
                      <div className="text-xs font-bold bg-black bg-opacity-20 rounded px-1">
                        ✓
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-center h-full relative z-10">
                    <div className="text-center">
                      <div className="text-xs text-white font-medium drop-shadow-sm">
                        {task.status === 'completed' ? '100' : (task.progress_percentage || 0)}%
                      </div>
                      {task.actualDuration > 0 && (
                        <div className="text-xs text-white/80 drop-shadow-sm">
                          {task.actualDuration.toFixed(1)}h
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Visual indicators */}
                  {/* Indicator for planned vs actual start */}
                  {task.start_date && task.start_date !== task.created_at && (
                    <div className="absolute left-0 top-0 w-1 h-full bg-white bg-opacity-60 rounded-l" />
                  )}
                  
                  {/* Indicator for overdue tasks */}
                  {task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed' && (
                    <div className="absolute right-0 top-0 w-1 h-full bg-red-600 bg-opacity-80 rounded-r" />
                  )}
                  
                  {/* Indicator for tasks with dependencies */}
                  {task.dependencies && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-1 bg-yellow-400" />
                  )}
                </div>
                
                {/* Task dates tooltip area */}
                <div 
                  className="absolute inset-0 cursor-pointer"
                  title={(() => {
                    // Comprehensive time tracking tooltip
                    const actualStart = task.actualStartTime || new Date(task.created_at);
                    const startLabel = task.start_date ? 'Scheduled Start' : 'Created';
                    
                    let timeAnalysis = '';
                    let statusInfo = '';
                    
                    if (task.status === 'completed') {
                      const completionDate = task.actualEndTime || new Date(task.updated_at);
                      const totalTime = (completionDate.getTime() - actualStart.getTime()) / (1000 * 60 * 60);
                      
                      timeAnalysis = `Completed: ${completionDate.toLocaleDateString()}`;
                      timeAnalysis += `\nActual Duration: ${task.actualDuration?.toFixed(1) || totalTime.toFixed(1)}h`;
                      
                      if (task.plannedDuration) {
                        timeAnalysis += `\nPlanned Duration: ${task.plannedDuration.toFixed(1)}h`;
                        timeAnalysis += `\nTime Efficiency: ${task.timeEfficiency}%`;
                        
                        if (task.timeEfficiency && task.timeEfficiency > 120) {
                          timeAnalysis += ' ⚡ (Faster than planned)';
                        } else if (task.timeEfficiency && task.timeEfficiency < 80) {
                          timeAnalysis += ' ⏰ (Slower than planned)';
                        } else {
                          timeAnalysis += ' ✅ (On track)';
                        }
                      }
                      
                      if (task.isOvertime) {
                        timeAnalysis += `\n⚠️ Overtime: +${((task.actualDuration || 0) - (task.plannedDuration || 0)).toFixed(1)}h`;
                      }
                    } else {
                      // For active/pending tasks
                      if (task.due_date) {
                        const dueDate = new Date(task.due_date);
                        const isOverdue = dueDate < new Date();
                        timeAnalysis = `Due: ${dueDate.toLocaleDateString()}${isOverdue ? ' 🚨 OVERDUE' : ''}`;
                        
                        if (task.actualDuration && task.actualDuration > 0) {
                          timeAnalysis += `\nTime Spent: ${task.actualDuration.toFixed(1)}h`;
                        }
                        
                        if (task.plannedDuration) {
                          timeAnalysis += `\nPlanned: ${task.plannedDuration.toFixed(1)}h`;
                          
                          if (task.actualDuration && task.actualDuration > task.plannedDuration) {
                            timeAnalysis += `\n⚠️ Over planned time by ${(task.actualDuration - task.plannedDuration).toFixed(1)}h`;
                          }
                        }
                      } else if (task.plannedDuration) {
                        timeAnalysis = `Estimated Duration: ${task.plannedDuration.toFixed(1)}h`;
                        
                        if (task.actualDuration && task.actualDuration > 0) {
                          timeAnalysis += `\nTime Spent: ${task.actualDuration.toFixed(1)}h`;
                        }
                      }
                    }
                    
                    // Status and progress info
                    const displayProgress = task.status === 'completed' ? 100 : (task.progress_percentage || 0);
                    statusInfo = `\nStatus: ${task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('_', ' ')}`;
                    statusInfo += `\nProgress: ${displayProgress}%${task.status === 'completed' ? ' ✓ COMPLETE' : ''}`;
                    statusInfo += `\nPhase: ${task.phase.charAt(0).toUpperCase() + task.phase.slice(1).replace('_', ' ')}`;
                    statusInfo += `\nPriority: ${task.priority.toUpperCase()}`;
                    
                    // Time scale specific info
                    const timeScaleInfo = `\nView: ${timeScale.charAt(0).toUpperCase() + timeScale.slice(1)} scale`;
                    
                    return `${task.title}\n\n${startLabel}: ${actualStart.toLocaleDateString()}\n${timeAnalysis}${statusInfo}${timeScaleInfo}`;
                  })()}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Timeline Summary with Time Analysis */}
        {timelineStart && timelineEnd && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
            <div className="text-sm font-semibold mb-3 text-gray-800">Project Timeline & Time Analysis</div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">Project Start:</span>
                <div className="font-medium">{timelineStart.toLocaleDateString()}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Project End:</span>
                <div className="font-medium">{timelineEnd.toLocaleDateString()}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Total Duration:</span>
                <div className="font-medium">
                  {Math.ceil((timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24))} days
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Total Tasks:</span>
                <div className="font-medium">{ganttTasks.length}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Completed:</span>
                <div className="font-medium text-green-600">
                  {ganttTasks.filter(t => t.status === 'completed').length}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">In Progress:</span>
                <div className="font-medium text-blue-600">
                  {ganttTasks.filter(t => t.status === 'in_progress').length}
                </div>
              </div>
            </div>
            
            {/* Time Efficiency Summary */}
            {ganttTasks.some(t => t.status === 'completed' && t.timeEfficiency) && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs font-medium mb-2">Time Efficiency Analysis</div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-green-600">⚡ Fast Tasks:</span>
                    <div className="font-medium">
                      {ganttTasks.filter(t => t.timeEfficiency && t.timeEfficiency > 120).length}
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-600">✓ On-Time:</span>
                    <div className="font-medium">
                      {ganttTasks.filter(t => t.timeEfficiency && t.timeEfficiency >= 80 && t.timeEfficiency <= 120).length}
                    </div>
                  </div>
                  <div>
                    <span className="text-red-600">⏰ Slow Tasks:</span>
                    <div className="font-medium">
                      {ganttTasks.filter(t => t.timeEfficiency && t.timeEfficiency < 80).length}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Legend with Time Tracking Indicators */}
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium mb-2">Task Status Colors</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-green-600 rounded"></div>
                  <span>Fast Completion (⚡)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-blue-400 to-blue-600 rounded"></div>
                  <span>On-Time Completion (✓)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-orange-400 to-orange-600 rounded"></div>
                  <span>Overtime Completion (⏰)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-red-700 rounded"></div>
                  <span>Overdue/Blocked</span>
                </div>
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium mb-2">Time Scale Views</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>• <strong>Hourly:</strong> Detailed task timing</div>
                <div>• <strong>Daily:</strong> Day-by-day progress</div>
                <div>• <strong>Weekly:</strong> Week overview</div>
                <div>• <strong>Monthly:</strong> Project milestones</div>
                <div>• <strong>Yearly:</strong> Long-term planning</div>
                <div>• <strong>Red line:</strong> Current time</div>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1 bg-gray-50 p-3 rounded">
            <p><strong>Understanding the Gantt Chart:</strong></p>
            <p>• Tasks are ordered chronologically by start time (earliest first)</p>
            <p>• Bar colors indicate time efficiency: Green=Fast, Blue=On-time, Orange=Overtime, Red=Overdue</p>
            <p>• Time badges show actual hours spent and efficiency percentages</p>
            <p>• Use time scale controls to zoom from hourly detail to yearly overview</p>
            <p>• Navigate timeline with arrow buttons or zoom in/out for better focus</p>
            <p>• Hover over task bars for detailed time analysis and efficiency metrics</p>
            <p>• Current time indicator (red line) shows real-time project status</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};