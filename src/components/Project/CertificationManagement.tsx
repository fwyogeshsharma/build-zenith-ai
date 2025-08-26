import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, Plus, Calendar, FileText, CheckCircle, Clock, AlertCircle, Settings, Target, Trash2, MoreVertical, Bot } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CertificateRequirements from './CertificateRequirements';

interface CertificationManagementProps {
  projectId: string;
}

const certificationTypes = [
  'leed',
  'breeam',
  'igbc',
  'griha',
  'well',
  'lbc',
  'iso_9001',
  'iso_45001',
  'ohsas',
  'energy_star',
  'green_globes',
  'edge',
  'sites',
  'fitwel',
  'other'
];

const CertificationManagement = ({ projectId }: CertificationManagementProps) => {
  const [certifications, setCertifications] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [certificateVersions, setCertificateVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<string | null>(null);
  const [useTemplate, setUseTemplate] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    certification_body: '',
    target_level: '',
    version: '',
    expected_date: '',
    current_status: 'planning',
    template_id: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCertifications();
    fetchTemplates();
    fetchCertificateVersions();
  }, [projectId]);

  const fetchCertificateVersions = async () => {
    try {
      const { data, error } = await supabase
        .from('certificate_versions')
        .select('*')
        .eq('is_active', true)
        .order('certification_type, version');

      if (error) throw error;
      setCertificateVersions(data || []);
    } catch (error: any) {
      console.error('Error loading certificate versions:', error);
    }
  };

  const getVersionsForType = (type: string) => {
    if (!type) return [];
    return certificateVersions.filter(v => 
      v.certification_type.toLowerCase() === type.toLowerCase()
    );
  };

  const fetchCertifications = async () => {
    try {
      const { data, error } = await supabase
        .from('certifications')
        .select(`
          *,
          certificate_requirements (
            id,
            is_completed,
            is_mandatory
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Calculate progress for each certification based on requirements
      const certsWithProgress = (data || []).map(cert => {
        const requirements = cert.certificate_requirements || [];
        const completed = requirements.filter((req: any) => req.is_completed).length;
        const calculatedProgress = requirements.length > 0 
          ? Math.round((completed / requirements.length) * 100)
          : cert.progress_percentage || 0;
        
        return {
          ...cert,
          calculated_progress: calculatedProgress
        };
      });

      setCertifications(certsWithProgress);
    } catch (error: any) {
      toast({
        title: "Error loading certifications",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('certificate_templates')
        .select('*')
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error('Error loading templates:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Insert the certification first
      const { data: certification, error: certError } = await supabase
        .from('certifications')
        .insert({
          project_id: projectId,
          type: formData.type as any,
          certification_body: formData.certification_body,
          target_level: formData.target_level,
          version: formData.version,
          expected_date: formData.expected_date,
          current_status: formData.current_status as any,
          progress_percentage: 0
        })
        .select()
        .single();

      if (certError) throw certError;

      // If using a template, create requirements and tasks
      if (useTemplate && formData.template_id) {
        await applyTemplate(certification.id, formData.template_id);
      }

      toast({
        title: "Certification added",
        description: useTemplate 
          ? "New certification with template requirements has been added"
          : "New certification has been added to the project",
      });

      setIsDialogOpen(false);
      setFormData({
        type: '',
        certification_body: '',
        target_level: '',
        version: '',
        expected_date: '',
        current_status: 'planning',
        template_id: ''
      });
      setUseTemplate(false);
      fetchCertifications();
    } catch (error: any) {
      toast({
        title: "Error adding certification",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const applyTemplate = async (certificationId: string, templateId: string) => {
    try {
      // Refresh templates to get latest data
      await fetchTemplates();
      const template = templates.find(t => t.id === templateId);
      if (!template) return;

      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      // Create requirements from template
      if (template.default_requirements && template.default_requirements.length > 0) {
        const requirementsData = template.default_requirements.map((req: any) => ({
          certificate_id: certificationId,
          requirement_text: req.text,
          requirement_category: req.category || 'General',
          is_mandatory: req.mandatory !== false
        }));

        const { error: reqError } = await supabase
          .from('certificate_requirements')
          .insert(requirementsData);

        if (reqError) throw reqError;
      }

      // Create tasks from template with phase validation
      if (template.default_tasks && template.default_tasks.length > 0) {
        const validPhases = ['concept', 'design', 'pre_construction', 'execution', 'handover', 'operations_maintenance', 'renovation_demolition'];
        
        const tasksData = template.default_tasks.map((task: any) => {
          // Map invalid phases to valid ones
          let validPhase = task.phase;
          if (task.phase === 'construction') validPhase = 'execution';
          if (task.phase === 'commissioning_handover') validPhase = 'handover';
          if (task.phase === 'operation_maintenance') validPhase = 'operations_maintenance';
          if (task.phase === 'planning_design') validPhase = 'design';
          
          // Ensure phase is valid
          if (!validPhases.includes(validPhase)) {
            validPhase = 'execution'; // Default fallback
          }

          return {
            project_id: projectId,
            certificate_id: certificationId,
            title: task.title,
            description: `Template task for ${template.name} certification`,
            phase: validPhase,
            priority: task.priority || 'medium',
            status: 'pending',
            created_by: userId,
            ai_generated: true
          };
        });

        const { error: taskError } = await supabase
          .from('tasks')
          .insert(tasksData);

        if (taskError) throw taskError;
      }
    } catch (error: any) {
      console.error('Error applying template:', error);
      throw error;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'achieved': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'planning': return 'bg-gray-100 text-gray-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'achieved': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'planning': return <FileText className="h-4 w-4" />;
      case 'on_hold': return <AlertCircle className="h-4 w-4" />;
      case 'expired': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatCertificationType = (type: string) => {
    return type.toUpperCase().replace('_', ' ');
  };

  const handleDeleteCertification = async (certificationId: string, certificationType: string) => {
    try {
      // Delete related requirements first (due to foreign key constraints)
      await supabase
        .from('certificate_requirements')
        .delete()
        .eq('certificate_id', certificationId);

      // Delete related tasks
      await supabase
        .from('tasks')
        .delete()
        .eq('certificate_id', certificationId);

      // Finally delete the certification
      const { error } = await supabase
        .from('certifications')
        .delete()
        .eq('id', certificationId);

      if (error) throw error;

      toast({
        title: "Certification deleted",
        description: `${formatCertificationType(certificationType)} certification has been removed from the project`,
      });

      // Clear selected certificate if it was the one being deleted
      if (selectedCertificate === certificationId) {
        setSelectedCertificate(null);
      }

      fetchCertifications();
    } catch (error: any) {
      toast({
        title: "Error deleting certification",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading certifications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Certification Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Certification
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Certification</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Template Toggle */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="use-template"
                  checked={useTemplate}
                  onChange={(e) => setUseTemplate(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="use-template" className="text-sm">
                  Use certification template (auto-create requirements & tasks)
                </Label>
              </div>

              {useTemplate && (
                <div>
                  <Label htmlFor="template">Template</Label>
                  <Select 
                    value={formData.template_id} 
                    onValueChange={(value) => {
                      const selectedTemplate = templates.find(t => t.id === value);
                      const newFormData = { ...formData, template_id: value };
                      
                      // Auto-set version for LEED v4.1 template
                      if (selectedTemplate && selectedTemplate.name === 'LEED v4.1 Template') {
                        newFormData.version = 'v4.1';
                      }
                      
                      setFormData(newFormData);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="type">Certification Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData({...formData, type: value, version: ''})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select certification type" />
                  </SelectTrigger>
                  <SelectContent>
                    {certificationTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {formatCertificationType(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="certification_body">Certification Body</Label>
                <Input
                  id="certification_body"
                  value={formData.certification_body}
                  onChange={(e) => setFormData({...formData, certification_body: e.target.value})}
                  placeholder="e.g., USGBC, BRE, IGBC"
                />
              </div>

              <div>
                <Label htmlFor="target_level">Target Level</Label>
                <Input
                  id="target_level"
                  value={formData.target_level}
                  onChange={(e) => setFormData({...formData, target_level: e.target.value})}
                  placeholder="e.g., Gold, Platinum, 4 Star"
                />
              </div>

              <div>
                <Label htmlFor="version">Version</Label>
                <Select 
                  value={formData.version} 
                  onValueChange={(value) => setFormData({...formData, version: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    {getVersionsForType(formData.type).map((version) => (
                      <SelectItem key={version.version} value={version.version}>
                        {version.version} - {version.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="expected_date">Expected Achievement Date</Label>
                <Input
                  id="expected_date"
                  type="date"
                  value={formData.expected_date}
                  onChange={(e) => setFormData({...formData, expected_date: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="current_status">Current Status</Label>
                <Select value={formData.current_status} onValueChange={(value) => setFormData({...formData, current_status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="achieved">Achieved</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full">
                Add Certification
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {certifications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Certifications Yet</h3>
            <p className="text-muted-foreground mb-4">
              Add certifications to track compliance and sustainability goals
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Certification
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="list" className="space-y-6">
          <TabsList>
            <TabsTrigger value="list">Certifications List</TabsTrigger>
            <TabsTrigger value="requirements">Requirements Detail</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certifications.map((cert) => (
                <Card 
                  key={cert.id} 
                  className={`hover:shadow-lg transition-shadow ${
                    selectedCertificate === cert.id ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => setSelectedCertificate(cert.id)}
                      >
                        <CardTitle className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-amber-500" />
                          {formatCertificationType(cert.type)}
                        </CardTitle>
                        {cert.certification_body && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {cert.certification_body}
                          </p>
                        )}
                        {cert.version && (
                          <p className="text-xs text-muted-foreground mt-1 font-medium">
                            Version: {cert.version}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            toast({
                              title: "AI Certification Insight",
                              description: `Analyzing ${formatCertificationType(cert.type)} certification. AI recommendations will be generated based on requirements progress, timeline, and compliance status.`,
                            });
                          }}
                          className="flex items-center gap-1"
                        >
                          <Bot className="h-3 w-3" />
                          AI Insights
                        </Button>
                        <Badge className={getStatusColor(cert.current_status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(cert.current_status)}
                            {cert.current_status.replace('_', ' ')}
                          </div>
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Certification
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Certification</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete the {formatCertificationType(cert.type)} certification? 
                                    This will permanently remove all associated requirements and tasks. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteCertification(cert.id, cert.type)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Delete Certification
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent 
                    className="space-y-4 cursor-pointer"
                    onClick={() => setSelectedCertificate(cert.id)}
                  >
                    {cert.target_level && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Target Level</span>
                        <Badge variant="outline">{cert.target_level}</Badge>
                      </div>
                    )}

                    {cert.expected_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Expected: {new Date(cert.expected_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {cert.achieved_date && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-700">
                          Achieved: {new Date(cert.achieved_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Progress</span>
                          <span className="text-sm font-medium">{cert.calculated_progress || 0}%</span>
                        </div>
                        <Progress value={cert.calculated_progress || 0} className="h-2" />
                      </div>

                    {cert.current_status === 'achieved' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-green-800">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Certification Achieved!</span>
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground text-center">
                      Click to view requirements
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="requirements" className="space-y-6">
            {selectedCertificate ? (
              <CertificateRequirements
                certificateId={selectedCertificate}
                certificationType={certifications.find(c => c.id === selectedCertificate)?.type || ''}
                onRequirementUpdate={fetchCertifications}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a Certification</h3>
                  <p className="text-muted-foreground">
                    Click on a certification from the list to view its detailed requirements
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Certification Summary */}
      {certifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Certification Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {certifications.filter(c => c.current_status === 'achieved').length}
                </div>
                <div className="text-sm text-muted-foreground">Achieved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {certifications.filter(c => c.current_status === 'in_progress').length}
                </div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {certifications.filter(c => c.current_status === 'planning').length}
                </div>
                <div className="text-sm text-muted-foreground">Planning</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {Math.round(certifications.reduce((acc, cert) => acc + (cert.calculated_progress || 0), 0) / certifications.length)}%
                </div>
                <div className="text-sm text-muted-foreground">Avg Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CertificationManagement;