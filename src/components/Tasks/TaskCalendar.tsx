import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

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

interface TaskCalendarProps {
  tasks: Task[];
  onTaskUpdate: () => void;
  projects: any[];
}

export const TaskCalendar = ({ tasks, onTaskUpdate, projects }: TaskCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => 
      task.due_date && isSameDay(new Date(task.due_date), date)
    );
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-warning',
      in_progress: 'bg-primary',
      completed: 'bg-success',
      blocked: 'bg-destructive'
    };
    return colors[status as keyof typeof colors] || 'bg-muted';
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

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDateClick = (date: Date) => {
    const tasksForDate = getTasksForDate(date);
    if (tasksForDate.length > 0) {
      setSelectedDate(date);
      setSelectedTasks(tasksForDate);
    }
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              {format(currentDate, 'MMMM yyyy')}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date) => {
              const tasksForDate = getTasksForDate(date);
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              const isDateToday = isToday(date);
              
              return (
                <div
                  key={date.toISOString()}
                  className={`
                    min-h-[100px] p-2 border border-border rounded-md cursor-pointer
                    transition-colors hover:bg-accent/50
                    ${!isCurrentMonth ? 'opacity-50' : ''}
                    ${isDateToday ? 'bg-primary/10 border-primary/20' : ''}
                    ${tasksForDate.length > 0 ? 'hover:bg-accent' : ''}
                  `}
                  onClick={() => handleDateClick(date)}
                >
                  <div className="text-sm font-medium mb-1">
                    {format(date, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {tasksForDate.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className={`
                          text-xs p-1 rounded truncate
                          ${getStatusColor(task.status)} text-white
                          ${isOverdue(task.due_date, task.status) ? 'ring-1 ring-destructive' : ''}
                        `}
                        title={`${task.title} - ${task.project.name}`}
                      >
                        {task.title}
                      </div>
                    ))}
                    
                    {tasksForDate.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{tasksForDate.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tasks Detail Dialog */}
      <Dialog open={selectedDate !== null} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Tasks for {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedTasks.map((task) => (
              <Card key={task.id} className={isOverdue(task.due_date, task.status) ? 'border-destructive/30 bg-destructive/5' : ''}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold">{task.title}</h4>
                      <div className="flex gap-1">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status)}`} />
                      </div>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      <Badge variant="outline">
                        {task.status.replace('_', ' ')}
                      </Badge>
                      {isOverdue(task.due_date, task.status) && (
                        <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                          Overdue
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{task.project.name}</span>
                      {task.assignee && (
                        <div className="flex items-center gap-2">
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
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};