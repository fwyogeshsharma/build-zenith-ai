import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import { TeamMemberSelect } from './TeamMemberSelect';
import { useActivityLogger } from '@/hooks/useActivityLogger';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated: () => void;
  projects: any[];
}

export const CreateTaskDialog = ({ open, onOpenChange, onTaskCreated, projects }: CreateTaskDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    project_id: '',
    phase: 'concept' as 'concept' | 'design' | 'pre_construction' | 'execution' | 'handover' | 'operations_maintenance' | 'renovation_demolition',
    due_date: '',
    assigned_to: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.project_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const taskData = {
        ...formData,
        created_by: user?.id,
        assigned_to: formData.assigned_to || null,
        due_date: formData.due_date || null,
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single();

      if (error) throw error;

      // Log the activity
      await logActivity(
        'task_created',
        'Task Created',
        `Created task: ${taskData.title}`,
        taskData.project_id,
        data.id
      );

      toast({
        title: "Success",
        description: "Task created successfully",
      });
      
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        project_id: '',
        phase: 'concept' as 'concept' | 'design' | 'pre_construction' | 'execution' | 'handover' | 'operations_maintenance' | 'renovation_demolition',
        due_date: '',
        assigned_to: ''
      });
      
      onTaskCreated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Task Title *</Label>
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
              <Label htmlFor="project">Project *</Label>
              <Select value={formData.project_id} onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            {formData.project_id && (
              <TeamMemberSelect
                projectId={formData.project_id}
                value={formData.assigned_to}
                onChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value }))}
                label="Assigned To"
                placeholder="Select team member"
              />
            )}
          </div>
          
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-construction hover:bg-construction-dark">
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};