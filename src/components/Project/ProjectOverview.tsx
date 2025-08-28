import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Users, FileText, Calendar, BarChart3, MapPin, DollarSign, Clock, Activity } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';

type Project = Database['public']['Tables']['projects']['Row'];

interface ProjectOverviewProps {
  project: Project;
}

interface ProjectStats {
  tasksCompleted: number;
  tasksPending: number;
  teamMembers: number;
  documents: number;
  certificates: number;
}

const ProjectOverview = ({ project }: ProjectOverviewProps) => {
  const [stats, setStats] = useState<ProjectStats>({
    tasksCompleted: 0,
    tasksPending: 0,
    teamMembers: 0,
    documents: 0,
    certificates: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectStats();
  }, [project.id]);

  const fetchProjectStats = async () => {
    try {
      setLoading(true);
      
      // Fetch tasks counts
      const [tasksData, teamData, documentsData, certificatesData] = await Promise.all([
        supabase
          .from('tasks')
          .select('status')
          .eq('project_id', project.id),
        supabase
          .from('project_team_members')
          .select('id')
          .eq('project_id', project.id),
        supabase
          .from('documents')
          .select('id')
          .eq('project_id', project.id),
        supabase
          .from('certifications')
          .select('id')
          .eq('project_id', project.id)
      ]);

      const tasks = tasksData.data || [];
      const tasksCompleted = tasks.filter(task => task.status === 'completed').length;
      const tasksPending = tasks.filter(task => task.status !== 'completed').length;

      setStats({
        tasksCompleted,
        tasksPending,
        teamMembers: (teamData.data?.length || 0) + 1, // +1 for project owner
        documents: documentsData.data?.length || 0,
        certificates: certificatesData.data?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching project stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'concept': return 'bg-blue-100 text-blue-800';
      case 'design': return 'bg-purple-100 text-purple-800';
      case 'pre_construction': return 'bg-orange-100 text-orange-800';
      case 'execution': return 'bg-green-100 text-green-800';
      case 'handover': return 'bg-gray-100 text-gray-800';
      case 'operations_maintenance': return 'bg-indigo-100 text-indigo-800';
      case 'renovation_demolition': return 'bg-red-100 text-red-800';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatProjectType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Project Details */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Project Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{project.location || 'Not specified'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Budget</p>
                    <p className="font-medium">
                      {project.budget ? `$${project.budget.toLocaleString()}` : 'Not set'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Project Type</p>
                    <p className="font-medium">{formatProjectType(project.project_type)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">
                      {project.start_date 
                        ? new Date(project.start_date).toLocaleDateString()
                        : 'Not set'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Expected Completion</p>
                    <p className="font-medium">
                      {project.expected_completion_date 
                        ? new Date(project.expected_completion_date).toLocaleDateString()
                        : 'Not set'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Current Phase</p>
                    <Badge variant="outline" className={getPhaseColor(project.current_phase)}>
                      {formatProjectType(project.current_phase)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {project.description && (
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-muted-foreground leading-relaxed">{project.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">{project.progress_percentage || 0}%</span>
              </div>
              <Progress value={project.progress_percentage || 0} className="h-3" />
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {loading ? '...' : stats.tasksPending}
                  </div>
                  <div className="text-xs text-muted-foreground">Tasks Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {loading ? '...' : stats.tasksCompleted}
                  </div>
                  <div className="text-xs text-muted-foreground">Tasks Complete</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {loading ? '...' : stats.teamMembers}
                  </div>
                  <div className="text-xs text-muted-foreground">Team Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {loading ? '...' : stats.documents}
                  </div>
                  <div className="text-xs text-muted-foreground">Documents</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar Actions */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Users className="h-4 w-4 mr-2" />
              Manage Team
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <FileText className="h-4 w-4 mr-2" />
              Upload Documents
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Meeting
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Reports
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Task completed</p>
                <p className="text-xs text-muted-foreground">Foundation inspection - 2h ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Document uploaded</p>
                <p className="text-xs text-muted-foreground">Building permit.pdf - 4h ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Team member added</p>
                <p className="text-xs text-muted-foreground">John Smith joined - 1d ago</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Milestones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Planning Complete</p>
                <p className="text-xs text-muted-foreground">Mar 15, 2024</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Design Phase</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Construction Start</p>
                <p className="text-xs text-muted-foreground">May 1, 2024</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectOverview;