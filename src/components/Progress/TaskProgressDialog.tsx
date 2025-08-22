import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  FileText, 
  Save,
  Calendar,
  BarChart3
} from 'lucide-react';

interface TaskProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: {
    id: string;
    title: string;
    phase: string;
    project_id?: string;
    progress_percentage?: number;
    actual_hours?: number;
    estimated_hours?: number;
    progress_notes?: string;
  };
  onProgressUpdated: () => void;
}

export const TaskProgressDialog = ({ 
  open, 
  onOpenChange, 
  task, 
  onProgressUpdated 
}: TaskProgressDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [progressEntries, setProgressEntries] = useState<any[]>([]);
  
  // Form state
  const [progressPercentage, setProgressPercentage] = useState(task.progress_percentage || 0);
  const [actualHours, setActualHours] = useState(task.actual_hours?.toString() || '');
  const [estimatedHours, setEstimatedHours] = useState(task.estimated_hours?.toString() || '');
  const [progressNotes, setProgressNotes] = useState(task.progress_notes || '');
  
  // New progress entry form
  const [newEntry, setNewEntry] = useState({
    actual_value: '',
    target_value: '',
    unit: 'hours',
    notes: ''
  });

  useEffect(() => {
    if (open) {
      fetchProgressEntries();
      // Reset form with current task data
      setProgressPercentage(task.progress_percentage || 0);
      setActualHours(task.actual_hours?.toString() || '');
      setEstimatedHours(task.estimated_hours?.toString() || '');
      setProgressNotes(task.progress_notes || '');
    }
  }, [open, task]);

  const fetchProgressEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('progress_entries')
        .select('*')
        .eq('task_id', task.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProgressEntries(data || []);
    } catch (error: any) {
      console.error('Error fetching progress entries:', error);
    }
  };

  const updateTaskProgress = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          progress_percentage: progressPercentage,
          actual_hours: actualHours ? parseFloat(actualHours) : null,
          estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null,
          progress_notes: progressNotes,
          last_progress_update: new Date().toISOString()
        })
        .eq('id', task.id);

      if (error) throw error;

      toast({
        title: "Progress Updated",
        description: "Task progress has been saved successfully.",
      });

      onProgressUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addProgressEntry = async () => {
    if (!newEntry.actual_value && !newEntry.notes) {
      toast({
        title: "Error",
        description: "Please provide either a value or notes for this progress entry.",
        variant: "destructive",
      });
      return;
    }

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('progress_entries')
        .insert({
          project_id: task.project_id || '', // Use task's project_id
          task_id: task.id,
          phase: task.phase as any,
          entry_type: 'task_progress',
          progress_percentage: progressPercentage,
          actual_value: newEntry.actual_value ? parseFloat(newEntry.actual_value) : null,
          target_value: newEntry.target_value ? parseFloat(newEntry.target_value) : null,
          unit: newEntry.unit,
          notes: newEntry.notes,
          created_by: user.data.user.id
        });

      if (error) throw error;

      setNewEntry({
        actual_value: '',
        target_value: '',
        unit: 'hours',
        notes: ''
      });

      fetchProgressEntries();
      
      toast({
        title: "Progress Entry Added",
        description: "New progress entry has been recorded.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Track Progress: {task.title}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Current Progress */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Current Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Completion Percentage</Label>
                    <span className={`text-2xl font-bold ${getProgressColor(progressPercentage)}`}>
                      {progressPercentage}%
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="mb-3" />
                  <Input
                    type="range"
                    min="0"
                    max="100"
                    value={progressPercentage}
                    onChange={(e) => setProgressPercentage(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="actual_hours">Actual Hours</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="actual_hours"
                        type="number"
                        step="0.5"
                        value={actualHours}
                        onChange={(e) => setActualHours(e.target.value)}
                        placeholder="0"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="estimated_hours">Estimated Hours</Label>
                    <div className="relative">
                      <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="estimated_hours"
                        type="number"
                        step="0.5"
                        value={estimatedHours}
                        onChange={(e) => setEstimatedHours(e.target.value)}
                        placeholder="0"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="progress_notes">Progress Notes</Label>
                  <Textarea
                    id="progress_notes"
                    value={progressNotes}
                    onChange={(e) => setProgressNotes(e.target.value)}
                    placeholder="Add notes about current progress, blockers, or next steps..."
                    rows={3}
                  />
                </div>

                <Button onClick={updateTaskProgress} disabled={loading} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save Progress
                </Button>
              </CardContent>
            </Card>

            {/* Add New Progress Entry */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Add Progress Entry
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="actual_value">Actual Value</Label>
                    <Input
                      id="actual_value"
                      type="number"
                      step="0.1"
                      value={newEntry.actual_value}
                      onChange={(e) => setNewEntry({...newEntry, actual_value: e.target.value})}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="target_value">Target Value</Label>
                    <Input
                      id="target_value"
                      type="number"
                      step="0.1"
                      value={newEntry.target_value}
                      onChange={(e) => setNewEntry({...newEntry, target_value: e.target.value})}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Select value={newEntry.unit} onValueChange={(value) => setNewEntry({...newEntry, unit: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="items">Items</SelectItem>
                      <SelectItem value="meters">Meters</SelectItem>
                      <SelectItem value="square_meters">Square Meters</SelectItem>
                      <SelectItem value="cubic_meters">Cubic Meters</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="entry_notes">Notes</Label>
                  <Textarea
                    id="entry_notes"
                    value={newEntry.notes}
                    onChange={(e) => setNewEntry({...newEntry, notes: e.target.value})}
                    placeholder="Describe what was accomplished, any issues encountered..."
                    rows={2}
                  />
                </div>

                <Button onClick={addProgressEntry} variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Progress History */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Progress History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {progressEntries.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No progress entries yet</p>
                    <p className="text-sm">Add your first progress entry above</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {progressEntries.map((entry, index) => (
                      <div key={entry.id} className="relative">
                        {index !== progressEntries.length - 1 && (
                          <div className="absolute left-4 top-8 bottom-0 w-px bg-border" />
                        )}
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-xs text-primary-foreground font-medium">
                              {entry.progress_percentage}%
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {entry.entry_type.replace('_', ' ')}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(entry.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {(entry.actual_value || entry.target_value) && (
                              <div className="text-sm mb-1">
                                {entry.actual_value && (
                                  <span>Actual: {entry.actual_value} {entry.unit}</span>
                                )}
                                {entry.actual_value && entry.target_value && ' / '}
                                {entry.target_value && (
                                  <span>Target: {entry.target_value} {entry.unit}</span>
                                )}
                              </div>
                            )}
                            {entry.notes && (
                              <p className="text-sm text-muted-foreground">{entry.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};