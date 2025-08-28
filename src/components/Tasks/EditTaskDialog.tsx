import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useActivityLogger } from '@/hooks/useActivityLogger';

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

interface EditTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated: () => void;
  projects: any[];
}

export const EditTaskDialog = ({ task, open, onOpenChange, onTaskUpdated, projects }: EditTaskDialogProps) => {
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    project_id: '',
    phase: 'concept' as 'concept' | 'design' | 'pre_construction' | 'execution' | 'handover' | 'operations_maintenance' | 'renovation_demolition',
    due_date: '',
    start_date: '',
    duration_hours: '',
    assigned_to: ''
  });

  useEffect(() => {
    if (task && open) {
      console.log('EditTaskDialog: Setting form data with task:', task);
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        status: task.status || 'pending',
        project_id: task.project_id || '',
        phase: (task.phase || 'concept') as 'concept' | 'design' | 'pre_construction' | 'execution' | 'handover' | 'operations_maintenance' | 'renovation_demolition',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        start_date: task.start_date ? task.start_date.split('T')[0] : '',
        duration_hours: task.duration_hours ? String(task.duration_hours) : '',
        assigned_to: task.assigned_to || ''
      });
      if (task.project_id) {
        fetchTeamMembers(task.project_id);
      }
    } else if (open && !task) {
      console.error('EditTaskDialog: Dialog opened without task data');
    }
  }, [task, open]);

  const fetchTeamMembers = async (projectId: string) => {
    try {
      const { data: teamData, error } = await supabase
        .from('project_team_members')
        .select('user_id, role')
        .eq('project_id', projectId);

      if (error) throw error;

      if (teamData && teamData.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, email')
          .in('user_id', teamData.map(t => t.user_id));

        const membersWithProfiles = teamData.map(member => {
          const profile = profilesData?.find(p => p.user_id === member.user_id);
          return {
            ...member,
            profiles: profile || null
          };
        }).filter(member => member.profiles !== null);

        setTeamMembers(membersWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        ...formData,
        assigned_to: formData.assigned_to || null,
        due_date: formData.due_date || null,
        start_date: formData.start_date || null,
        duration_hours: formData.duration_hours ? parseFloat(formData.duration_hours) : null,
      };

      // Auto-set start_date when task starts
      if (formData.status === 'in_progress' && !formData.start_date && task.status !== 'in_progress') {
        updateData.start_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', task.id);

      if (error) throw error;

      // Log the activity
      await logActivity(
        'task_updated',
        'Task Updated',
        `Updated task: ${updateData.title}`,
        task.project_id,
        task.id
      );

      toast({
        title: "Success",
        description: "Task updated successfully",
      });
      
      onTaskUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!task) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter task title"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter task description"
                rows={3}
              />
            </div>
            
            
            <div>
              <Label htmlFor="phase">Phase</Label>
              <Select value={formData.phase} onValueChange={(value) => setFormData(prev => ({ ...prev, phase: value as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concept">Concept</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="pre_construction">Pre Construction</SelectItem>
                  <SelectItem value="execution">Execution</SelectItem>
                  <SelectItem value="handover">Handover</SelectItem>
                  <SelectItem value="operations_maintenance">Operations & Maintenance</SelectItem>
                  <SelectItem value="renovation_demolition">Renovation & Demolition</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="duration_hours">Duration (Hours)</Label>
              <Input
                id="duration_hours"
                type="number"
                min="0"
                step="0.5"
                value={formData.duration_hours}
                onChange={(e) => setFormData(prev => ({ ...prev, duration_hours: e.target.value }))}
                placeholder="Expected hours"
              />
            </div>

            <div>
              <Label htmlFor="assigned_to">Assigned To</Label>
              <Select value={formData.assigned_to} onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.profiles?.first_name} {member.profiles?.last_name} ({member.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-construction hover:bg-construction-dark">
              {loading ? 'Updating...' : 'Update Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};