import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Info, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import DashboardSidebar from '@/components/Dashboard/DashboardSidebar';
import { Database } from '@/integrations/supabase/types';
import { getProjectTemplate, getAllProjectTemplates } from '@/lib/projectTemplates';
import { applyProjectTemplate } from '@/lib/templateApplier';

type ProjectInsert = Database['public']['Tables']['projects']['Insert'];

const NewProject = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<Partial<ProjectInsert>>({
    name: '',
    description: '',
    location: '',
    project_type: 'new_construction',
    current_phase: 'concept',
    status: 'planning',
    budget: undefined,
    start_date: '',
    expected_completion_date: '',
  });

  const [selectedTemplate, setSelectedTemplate] = useState(getProjectTemplate('new_construction'));
  const [applyingTemplate, setApplyingTemplate] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setApplyingTemplate(true);
    
    try {
      // Create the project
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...formData,
          name: formData.name!,
          owner_id: user.id,
          project_type: formData.project_type!,
          budget: formData.budget ? Number(formData.budget) : null,
        })
        .select()
        .single();

      if (error) throw error;

      // Apply the project template
      const templateResult = await applyProjectTemplate(
        data.id,
        formData.project_type!,
        user.id
      );

      if (templateResult.success) {
        toast({
          title: "Project created successfully",
          description: `${formData.name} has been created with ${templateResult.tasksCreated} tasks, ${templateResult.phasesCreated} phases, and ${templateResult.certificationsCreated} certifications.`,
        });
      } else {
        toast({
          title: "Project created with warnings",
          description: `${formData.name} was created but template application failed: ${templateResult.error}`,
          variant: "destructive",
        });
      }

      navigate(`/projects/${data.id}`);
    } catch (error: any) {
      toast({
        title: "Error creating project",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setApplyingTemplate(false);
    }
  };

  const updateFormData = (field: keyof ProjectInsert, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Update selected template when project type changes
    if (field === 'project_type') {
      setSelectedTemplate(getProjectTemplate(value));
      
      // Auto-fill budget range and dates based on template
      const template = getProjectTemplate(value);
      if (template.defaultBudgetRange && !formData.budget) {
        setFormData(prev => ({ 
          ...prev, 
          [field]: value,
          budget: template.defaultBudgetRange!.min 
        }));
      }
      
      // Set estimated completion date
      if (template.estimatedDuration && formData.start_date) {
        const startDate = new Date(formData.start_date);
        const completionDate = new Date(startDate.getTime() + template.estimatedDuration * 7 * 24 * 60 * 60 * 1000);
        setFormData(prev => ({ 
          ...prev, 
          [field]: value,
          expected_completion_date: completionDate.toISOString().split('T')[0]
        }));
      }
    }
    
    // Auto-calculate completion date when start date changes
    if (field === 'start_date' && value && selectedTemplate.estimatedDuration) {
      const startDate = new Date(value);
      const completionDate = new Date(startDate.getTime() + selectedTemplate.estimatedDuration * 7 * 24 * 60 * 60 * 1000);
      setFormData(prev => ({ 
        ...prev, 
        [field]: value,
        expected_completion_date: completionDate.toISOString().split('T')[0]
      }));
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <DashboardSidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/projects')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">New Project</h1>
              <p className="text-muted-foreground mt-1">
                Create a new construction project
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Project Name *</Label>
                      <Input
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => updateFormData('name', e.target.value)}
                        placeholder="Enter project name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => updateFormData('location', e.target.value)}
                        placeholder="Project location"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => updateFormData('description', e.target.value)}
                      placeholder="Describe the project..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="project_type">Project Type *</Label>
                      <Select
                        value={formData.project_type}
                        onValueChange={(value) => updateFormData('project_type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAllProjectTemplates().map(template => (
                            <SelectItem key={template.type} value={template.type}>
                              {template.emoji} {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="current_phase">Current Phase</Label>
                      <Select
                        value={formData.current_phase}
                        onValueChange={(value) => updateFormData('current_phase', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select phase" />
                        </SelectTrigger>
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
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => updateFormData('status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planning">Planning</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="on_hold">On Hold</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Template Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    {selectedTemplate.emoji} {selectedTemplate.name} Template
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{selectedTemplate.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Key Focus Areas:</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedTemplate.emphasis.map((item, index) => (
                          <Badge key={index} variant="secondary">{item}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">AI-Powered Tools:</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedTemplate.ai_focus.map((item, index) => (
                          <Badge key={index} variant="outline">{item}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <div>
                        <p className="text-sm font-medium">{selectedTemplate.tasks.length} Tasks</p>
                        <p className="text-xs text-muted-foreground">Pre-defined workflow</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{selectedTemplate.estimatedDuration} weeks</p>
                        <p className="text-xs text-muted-foreground">Estimated duration</p>
                      </div>
                    </div>
                    
                    {selectedTemplate.defaultBudgetRange && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium">
                            ${(selectedTemplate.defaultBudgetRange.min / 1000).toFixed(0)}K - ${(selectedTemplate.defaultBudgetRange.max / 1000000).toFixed(1)}M
                          </p>
                          <p className="text-xs text-muted-foreground">Typical budget range</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      This template will automatically create {selectedTemplate.phases.length} lifecycle phases, 
                      {selectedTemplate.tasks.length} tasks, and {selectedTemplate.certifications.length} certification 
                      tracking items when you create your project.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Timeline & Budget</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="budget">Budget ($)</Label>
                      <Input
                        id="budget"
                        type="number"
                        value={formData.budget || ''}
                        onChange={(e) => updateFormData('budget', e.target.value)}
                        placeholder="0"
                        min="0"
                        step="1000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => updateFormData('start_date', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expected_completion_date">Expected Completion</Label>
                      <Input
                        id="expected_completion_date"
                        type="date"
                        value={formData.expected_completion_date}
                        onChange={(e) => updateFormData('expected_completion_date', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-end gap-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate('/projects')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || !formData.name}
                  className="bg-primary hover:bg-primary/90"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      {applyingTemplate ? 'Applying Template...' : 'Creating...'}
                    </div>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Project with Template
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewProject;