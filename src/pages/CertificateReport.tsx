import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Award, Calendar, Target, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import LEEDReport from '@/components/Project/LEEDReport';

const CertificateReport = () => {
  const { id: projectId, certId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [certificate, setCertificate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId && certId) {
      fetchCertificate();
    }
  }, [projectId, certId]);

  const fetchCertificate = async () => {
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
        .eq('id', certId)
        .eq('project_id', projectId)
        .single();

      if (error) throw error;
      
      if (!data) {
        toast({
          title: "Certificate not found",
          description: "The requested certificate could not be found.",
          variant: "destructive",
        });
        navigate(`/projects/${projectId}`);
        return;
      }

      // Calculate progress
      const requirements = data.certificate_requirements || [];
      const completed = requirements.filter((req: any) => req.is_completed).length;
      const calculatedProgress = requirements.length > 0 
        ? Math.round((completed / requirements.length) * 100)
        : data.progress_percentage || 0;
      
      setCertificate({
        ...data,
        calculated_progress: calculatedProgress
      });
    } catch (error: any) {
      console.error('Error fetching certificate:', error);
      toast({
        title: "Error loading certificate",
        description: error.message,
        variant: "destructive",
      });
      navigate(`/projects/${projectId}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCertificationType = (type: string) => {
    return type.toUpperCase().replace('_', ' ');
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
      case 'in_progress': return <Target className="h-4 w-4" />;
      case 'planning': return <Calendar className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Certificate not found</h1>
            <Button onClick={() => navigate(`/projects/${projectId}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Project
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/projects/${projectId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Project
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Certificate Report</h1>
              <p className="text-muted-foreground">
                Detailed report for {formatCertificationType(certificate.type)} certification
              </p>
            </div>
          </div>
        </div>

        {/* Certificate Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-6 w-6 text-amber-500" />
              {formatCertificationType(certificate.type)}
              {certificate.version && (
                <Badge variant="outline">v{certificate.version}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Status</div>
                <Badge className={getStatusColor(certificate.current_status)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(certificate.current_status)}
                    {certificate.current_status.replace('_', ' ')}
                  </div>
                </Badge>
              </div>
              
              {certificate.target_level && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Target Level</div>
                  <Badge variant="outline">{certificate.target_level}</Badge>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Progress</div>
                <div className="text-2xl font-bold">{certificate.calculated_progress}%</div>
              </div>
            </div>

            {certificate.expected_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Expected Completion: {new Date(certificate.expected_date).toLocaleDateString()}
                </span>
              </div>
            )}

            {certificate.certification_body && (
              <div className="text-sm text-muted-foreground">
                Certification Body: {certificate.certification_body}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Certificate-Specific Report */}
        <LEEDReport 
          projectId={projectId!} 
          certificateId={certId}
          certificationType={certificate.type}
          version={certificate.version}
        />
      </div>
    </div>
  );
};

export default CertificateReport;