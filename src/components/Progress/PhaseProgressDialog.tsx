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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  Target, 
  FileText, 
  Save,
  Users,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Layers
} from 'lucide-react';

interface PhaseProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  phase: {
    id: string;
    name: string;
    progress_percentage?: number;
    status?: string;
  };
  onProgressUpdated: () => void;
}

export const PhaseProgressDialog = ({ 
  open, 
  onOpenChange, 
  projectId,
  phase, 
  onProgressUpdated 
}: PhaseProgressDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [progressEntries, setProgressEntries] = useState<any[]>([]);
  const [phaseTasks, setPhaseTasks] = useState<any[]>([]);
  const [phaseData, setPhaseData] = useState<any>(null);
  
  // Form state for new progress entry
  const [newEntry, setNewEntry] = useState({
    progress_percentage: phase.progress_percentage || 0,
    actual_value: '',
    target_value: '',
    unit: 'percentage',
    notes: '',
    entry_type: 'phase_milestone'
  });

  useEffect(() => {
    if (open) {
      fetchPhaseData();
      fetchProgressEntries();
      fetchPhaseTasks();
    }
  }, [open, projectId, phase.id]);

  const fetchPhaseData = async () => {
    try {
      const { data, error } = await supabase
        .from('project_phases')
        .select('*')
        .eq('project_id', projectId)
        .eq('phase', phase.id as any)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setPhaseData(data);
    } catch (error: any) {
      console.error('Error fetching phase data:', error);
    }
  };

  const fetchProgressEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('progress_entries')
        .select('*')
        .eq('project_id', projectId)
        .eq('phase', phase.id as any)
        .is('task_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProgressEntries(data || []);
    } catch (error: any) {
      console.error('Error fetching progress entries:', error);
    }
  };

  const fetchPhaseTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, status, progress_percentage')
        .eq('project_id', projectId)
        .eq('phase', phase.id as any)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhaseTasks(data || []);
    } catch (error: any) {
      console.error('Error fetching phase tasks:', error);
    }
  };

  const addPhaseProgressEntry = async () => {
    if (!newEntry.notes && !newEntry.actual_value) {
      toast({
        title: "Error",
        description: "Please provide either a value or notes for this progress entry.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('progress_entries')
        .insert({
          project_id: projectId,
          task_id: null,
          phase: phase.id as any,
          entry_type: newEntry.entry_type,
          progress_percentage: newEntry.progress_percentage,
          actual_value: newEntry.actual_value ? parseFloat(newEntry.actual_value) : null,
          target_value: newEntry.target_value ? parseFloat(newEntry.target_value) : null,
          unit: newEntry.unit,
          notes: newEntry.notes,
          created_by: user.data.user.id
        });

      if (error) throw error;

      // Reset form
      setNewEntry({
        progress_percentage: newEntry.progress_percentage,
        actual_value: '',
        target_value: '',
        unit: 'percentage',
        notes: '',
        entry_type: 'phase_milestone'
      });

      fetchProgressEntries();
      onProgressUpdated();
      
      toast({
        title: "Progress Entry Added",
        description: "Phase progress has been updated successfully.",
      });
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case 'blocked': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const averageTaskProgress = phaseTasks.length > 0 
    ? Math.round(phaseTasks.reduce((sum, task) => sum + (task.progress_percentage || 0), 0) / phaseTasks.length)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Phase Progress: {phase.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Phase Overview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Phase Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Current Progress</span>
                    <span className={`text-2xl font-bold ${getProgressColor(phase.progress_percentage || 0)}`}>
                      {phase.progress_percentage || 0}%
                    </span>
                  </div>
                  <Progress value={phase.progress_percentage || 0} className="mb-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Average Task Progress</span>
                    <span className={`text-lg font-semibold ${getProgressColor(averageTaskProgress)}`}>
                      {averageTaskProgress}%
                    </span>
                  </div>
                  <Progress value={averageTaskProgress} className="mb-2" />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Tasks</span>
                  <Badge variant="outline">{phaseTasks.length}</Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Completed Tasks</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    {phaseTasks.filter(task => task.status === 'completed').length}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Phase Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Phase Tasks ({phaseTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {phaseTasks.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No tasks in this phase</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {phaseTasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getStatusIcon(task.status)}
                          <span className="text-sm truncate">{task.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${getProgressColor(task.progress_percentage || 0)}`}>
                            {task.progress_percentage || 0}%
                          </span>
                        </div>
                      </div>
                    ))}
                    {phaseTasks.length > 5 && (
                      <div className="text-center text-sm text-muted-foreground">
                        +{phaseTasks.length - 5} more tasks
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Add Progress Entry */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Update Phase Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="progress">Progress Percentage</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="progress"
                      type="range"
                      min="0"
                      max="100"
                      value={newEntry.progress_percentage}
                      onChange={(e) => setNewEntry({...newEntry, progress_percentage: parseInt(e.target.value)})}
                      className="flex-1"
                    />
                    <span className="text-lg font-semibold w-12 text-right">
                      {newEntry.progress_percentage}%
                    </span>
                  </div>
                  <Progress value={newEntry.progress_percentage} className="mt-2" />
                </div>

                <div>
                  <Label htmlFor="entry_type">Entry Type</Label>
                  <Select value={newEntry.entry_type} onValueChange={(value) => setNewEntry({...newEntry, entry_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phase_milestone">Phase Milestone</SelectItem>
                      <SelectItem value="manual_entry">Manual Entry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="items">Items</SelectItem>
                      <SelectItem value="meters">Meters</SelectItem>
                      <SelectItem value="square_meters">Square Meters</SelectItem>
                      <SelectItem value="cubic_meters">Cubic Meters</SelectItem>
                      <SelectItem value="tons">Tons</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newEntry.notes}
                    onChange={(e) => setNewEntry({...newEntry, notes: e.target.value})}
                    placeholder="Describe milestone achievements, challenges, or next steps..."
                    rows={4}
                  />
                </div>

                <Button onClick={addPhaseProgressEntry} disabled={loading} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Add Progress Entry'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Progress History */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Progress History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {progressEntries.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No progress entries yet</p>
                    <p className="text-sm">Add your first milestone above</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
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
                          <div className="flex-1 min-w-0 pb-4">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {entry.entry_type.replace('_', ' ')}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(entry.created_at).toLocaleDateString()} at {new Date(entry.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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