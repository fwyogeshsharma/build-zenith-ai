import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Award, CheckCircle, Clock, AlertTriangle, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CertificationTrackerProps {
  projectId: string;
  className?: string;
}

const CertificationTracker = ({ projectId, className }: CertificationTrackerProps) => {
  const [certifications, setCertifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    achieved: 0,
    inProgress: 0,
    planning: 0,
    averageProgress: 0,
    upcomingDeadlines: 0
  });

  useEffect(() => {
    fetchCertifications();
  }, [projectId]);

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

      const certs = data || [];
      setCertifications(certs);

      // Calculate stats
      const total = certs.length;
      const achieved = certs.filter(c => c.current_status === 'achieved').length;
      const inProgress = certs.filter(c => c.current_status === 'in_progress').length;
      const planning = certs.filter(c => c.current_status === 'planning').length;
      const averageProgress = total > 0 
        ? Math.round(certs.reduce((acc, cert) => acc + (cert.progress_percentage || 0), 0) / total)
        : 0;
      
      // Calculate upcoming deadlines (within 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const upcomingDeadlines = certs.filter(c => 
        c.expected_date && 
        new Date(c.expected_date) <= thirtyDaysFromNow && 
        c.current_status !== 'achieved'
      ).length;

      setStats({
        total,
        achieved,
        inProgress,
        planning,
        averageProgress,
        upcomingDeadlines
      });
    } catch (error: any) {
      console.error('Error fetching certifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'achieved': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'planning': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'achieved': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'planning': return <Target className="h-4 w-4" />;
      case 'on_hold': return <AlertTriangle className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const formatCertificationType = (type: string) => {
    return type.toUpperCase().replace('_', ' ');
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Award className="h-5 w-5 text-amber-500" />
          Certification Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.total === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No certifications added yet</p>
          </div>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-600">{stats.achieved}</div>
                <div className="text-xs text-muted-foreground">Achieved</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-gray-600">{stats.planning}</div>
                <div className="text-xs text-muted-foreground">Planning</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-amber-600">{stats.averageProgress}%</div>
                <div className="text-xs text-muted-foreground">Avg Progress</div>
              </div>
            </div>

            {/* Progress Overview */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Overall Progress</span>
                <span className="text-sm font-medium">{stats.averageProgress}%</span>
              </div>
              <Progress value={stats.averageProgress} className="h-2" />
            </div>

            {/* Upcoming Deadlines Alert */}
            {stats.upcomingDeadlines > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {stats.upcomingDeadlines} certification{stats.upcomingDeadlines > 1 ? 's' : ''} due within 30 days
                  </span>
                </div>
              </div>
            )}

            {/* Active Certifications List */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Active Certifications</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {certifications
                  .filter(cert => cert.current_status !== 'achieved')
                  .slice(0, 5)
                  .map((cert) => (
                    <div key={cert.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {getStatusIcon(cert.current_status)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">
                            {formatCertificationType(cert.type)}
                          </div>
                          {cert.target_level && (
                            <div className="text-xs text-muted-foreground">
                              Target: {cert.target_level}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-xs text-muted-foreground">
                          {cert.progress_percentage || 0}%
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getStatusColor(cert.current_status)}`}
                        >
                          {cert.current_status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Achieved Certifications */}
            {stats.achieved > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Recent Achievements</h4>
                <div className="space-y-1">
                  {certifications
                    .filter(cert => cert.current_status === 'achieved')
                    .slice(0, 3)
                    .map((cert) => (
                      <div key={cert.id} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-green-800 truncate">
                            {formatCertificationType(cert.type)}
                          </div>
                          {cert.achieved_date && (
                            <div className="text-xs text-green-600">
                              Achieved: {new Date(cert.achieved_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CertificationTracker;