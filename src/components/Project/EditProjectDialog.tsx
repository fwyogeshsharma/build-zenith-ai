import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  project_type: z.enum(['new_construction', 'renovation_repair', 'interior_fitout', 'land_development', 'sustainable_green', 'affordable_housing', 'luxury', 'mixed_use', 'co_living_working', 'redevelopment']),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']),
  current_phase: z.enum(['concept', 'design', 'pre_construction', 'execution', 'handover', 'operations_maintenance', 'renovation_demolition']),
  location: z.string().optional(),
  budget: z.string().optional(),
  start_date: z.string().optional(),
  expected_completion_date: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface EditProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onProjectUpdated: (project: Project) => void;
}

export const EditProjectDialog = ({ isOpen, onClose, project, onProjectUpdated }: EditProjectDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project.name,
      description: project.description || '',
      project_type: project.project_type,
      status: project.status,
      current_phase: project.current_phase,
      location: project.location || '',
      budget: project.budget?.toString() || '',
      start_date: project.start_date || '',
      expected_completion_date: project.expected_completion_date || '',
    },
  });

  // Reset form when project changes
  useEffect(() => {
    form.reset({
      name: project.name,
      description: project.description || '',
      project_type: project.project_type,
      status: project.status,
      current_phase: project.current_phase,
      location: project.location || '',
      budget: project.budget?.toString() || '',
      start_date: project.start_date || '',
      expected_completion_date: project.expected_completion_date || '',
    });
  }, [project, form]);

  const onSubmit = async (data: ProjectFormData) => {
    setIsLoading(true);
    try {
      const { data: updatedProject, error } = await supabase
        .from('projects')
        .update({
          name: data.name,
          description: data.description || null,
          project_type: data.project_type,
          status: data.status,
          current_phase: data.current_phase,
          location: data.location || null,
          budget: data.budget ? parseFloat(data.budget) : null,
          start_date: data.start_date || null,
          expected_completion_date: data.expected_completion_date || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project updated successfully",
      });

      onProjectUpdated(updatedProject);
      onClose();
    } catch (error: any) {
      toast({
        title: "Error updating project",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter project name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your project..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="project_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="new_construction">New Construction</SelectItem>
                        <SelectItem value="renovation_repair">Renovation & Repair</SelectItem>
                        <SelectItem value="interior_fitout">Interior Fitout</SelectItem>
                        <SelectItem value="land_development">Land Development</SelectItem>
                        <SelectItem value="sustainable_green">Sustainable & Green</SelectItem>
                        <SelectItem value="affordable_housing">Affordable Housing</SelectItem>
                        <SelectItem value="luxury">Luxury</SelectItem>
                        <SelectItem value="mixed_use">Mixed Use</SelectItem>
                        <SelectItem value="co_living_working">Co-living & Co-working</SelectItem>
                        <SelectItem value="redevelopment">Redevelopment</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="current_phase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Phase *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select current phase" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="concept">Concept</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="pre_construction">Pre-Construction</SelectItem>
                        <SelectItem value="execution">Execution</SelectItem>
                        <SelectItem value="handover">Handover</SelectItem>
                        <SelectItem value="operations_maintenance">Operations & Maintenance</SelectItem>
                        <SelectItem value="renovation_demolition">Renovation & Demolition</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Project location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget ($)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter budget amount"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expected_completion_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Completion Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Project
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};