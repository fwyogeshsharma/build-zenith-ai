import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Trash2, Brain, Users, FileText, Calendar, BarChart3, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import DashboardSidebar from '@/components/Dashboard/DashboardSidebar';
import ProjectOverview from '@/components/Project/ProjectOverview';
import ProjectLifecycle from '@/components/Project/ProjectLifecycle';
import ProjectTasks from '@/components/Project/ProjectTasks';
import ProjectTeam from '@/components/Project/ProjectTeam';
import ProjectDocuments from '@/components/Project/ProjectDocuments';
import ProjectSchedule from '@/components/Project/ProjectSchedule';
import ProjectAnalytics from '@/components/Project/ProjectAnalytics';
import { EditProjectDialog } from '@/components/Project/EditProjectDialog';
import CertificationManagement from '@/components/Project/CertificationManagement';

type Project = Database['public']['Tables']['projects']['Row'];

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [initialPhaseFilter, setInitialPhaseFilter] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchProject(id);
      
      // Check URL parameters for tab and phase filter
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab');
      const phase = urlParams.get('phase');
      
      if (tab) {
        setActiveTab(tab);
      }
      
      if (phase) {
        setInitialPhaseFilter(phase);
        setActiveTab('tasks'); // Switch to tasks tab when phase filter is applied
      }
    }
  }, [id]);

  const fetchProject = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error: any) {
      toast({
        title: "Error loading project",
        description: error.message,
        variant: "destructive",
      });
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'completed': return 'bg-primary text-primary-foreground';
      case 'on_hold': return 'bg-warning text-warning-foreground';
      case 'cancelled': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
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

  const handleDeleteProject = async () => {
    if (!project) return;
    
    try {
      // With CASCADE constraints, we only need to delete the project
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
      navigate('/projects');
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full">
        <DashboardSidebar />
        <div className="flex-1 p-8">
          <div className="text-center">Loading project...</div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen w-full">
        <DashboardSidebar />
        <div className="flex-1 p-8">
          <div className="text-center">Project not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <DashboardSidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
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
                <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
                <p className="text-muted-foreground mt-1">
                  {project.description || 'No description provided'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(project.status)}>
                {project.status}
              </Badge>
              <Badge className={getPhaseColor(project.current_phase)}>
                {project.current_phase.replace('_', ' ')}
              </Badge>
              
              {/* Quick Action Buttons */}
              <div className="flex items-center gap-2 ml-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Edit Project
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab("team")}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Manage Team
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Project</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{project.name}"? This will permanently delete the project and all associated data including tasks, documents, and team members. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive hover:bg-destructive/90">
                        Delete Project
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>

          {/* Project Details Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
              <TabsTrigger value="certifications">
                <Award className="h-4 w-4 mr-2" />
                Certifications
              </TabsTrigger>
              <TabsTrigger value="ai-insights">
                <Brain className="h-4 w-4 mr-2" />
                AI Insights
              </TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="team">
                <Users className="h-4 w-4 mr-2" />
                Team
              </TabsTrigger>
              <TabsTrigger value="documents">
                <FileText className="h-4 w-4 mr-2" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="schedule">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <ProjectOverview project={project} />
            </TabsContent>

            <TabsContent value="lifecycle">
              <ProjectLifecycle projectId={project.id} />
            </TabsContent>

            <TabsContent value="certifications">
              <CertificationManagement projectId={project.id} />
            </TabsContent>

            <TabsContent value="ai-insights">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">AI-powered insights and recommendations for your project will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks">
              <ProjectTasks projectId={project.id} initialPhaseFilter={initialPhaseFilter} />
            </TabsContent>

            <TabsContent value="team">
              <ProjectTeam projectId={project.id} />
            </TabsContent>

            <TabsContent value="documents">
              <ProjectDocuments projectId={project.id} />
            </TabsContent>

            <TabsContent value="schedule">
              <ProjectSchedule projectId={project.id} />
            </TabsContent>

            <TabsContent value="analytics">
              <ProjectAnalytics projectId={project.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Project Dialog */}
      {project && (
        <EditProjectDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          project={project}
          onProjectUpdated={(updatedProject) => {
            setProject(updatedProject);
            fetchProject(project.id); // Refresh the project data
          }}
        />
      )}
    </div>
  );
};

export default ProjectDetail;