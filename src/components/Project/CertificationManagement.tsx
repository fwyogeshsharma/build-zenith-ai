import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Award, Plus, Calendar, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  'fitwel'
];

const CertificationManagement = ({ projectId }: CertificationManagementProps) => {
  const [certifications, setCertifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    certification_body: '',
    target_level: '',
    expected_date: '',
    current_status: 'planning'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCertifications();
  }, [projectId]);

  const fetchCertifications = async () => {
    try {
      const { data, error } = await supabase
        .from('certifications')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCertifications(data || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('certifications')
        .insert({
          project_id: projectId,
          type: formData.type as any,
          certification_body: formData.certification_body,
          target_level: formData.target_level,
          expected_date: formData.expected_date,
          current_status: formData.current_status,
          progress_percentage: 0
        });

      if (error) throw error;

      toast({
        title: "Certification added",
        description: "New certification has been added to the project",
      });

      setIsDialogOpen(false);
      setFormData({
        type: '',
        certification_body: '',
        target_level: '',
        expected_date: '',
        current_status: 'planning'
      });
      fetchCertifications();
    } catch (error: any) {
      toast({
        title: "Error adding certification",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'achieved': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'planning': return 'bg-gray-100 text-gray-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'achieved': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'planning': return <FileText className="h-4 w-4" />;
      case 'on_hold': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatCertificationType = (type: string) => {
    return type.toUpperCase().replace('_', ' ');
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
              <div>
                <Label htmlFor="type">Certification Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certifications.map((cert) => (
            <Card key={cert.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-amber-500" />
                      {formatCertificationType(cert.type)}
                    </CardTitle>
                    {cert.certification_body && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {cert.certification_body}
                      </p>
                    )}
                  </div>
                  <Badge className={getStatusColor(cert.current_status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(cert.current_status)}
                      {cert.current_status.replace('_', ' ')}
                    </div>
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
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
                    <span className="text-sm font-medium">{cert.progress_percentage || 0}%</span>
                  </div>
                  <Progress value={cert.progress_percentage || 0} className="h-2" />
                </div>

                {cert.current_status === 'achieved' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Certification Achieved!</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
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
                  {Math.round(certifications.reduce((acc, cert) => acc + (cert.progress_percentage || 0), 0) / certifications.length)}%
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