import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DashboardSidebar from '@/components/Dashboard/DashboardSidebar';
import { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching projects",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  if (loading) {
    return (
      <div className="flex min-h-screen w-full">
        <DashboardSidebar />
        <div className="flex-1 p-8">
          <div className="text-center">Loading projects...</div>
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
            <div>
              <h1 className="text-3xl font-bold text-foreground">Projects</h1>
              <p className="text-muted-foreground mt-1">
                Manage and track your construction projects
              </p>
            </div>
            <Button 
              onClick={() => navigate('/projects/new')}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Projects Grid/List */}
          {filteredProjects.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-muted-foreground">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'No projects match your filters.' 
                    : 'No projects yet. Create your first project to get started.'
                  }
                </div>
                {!searchQuery && statusFilter === 'all' && (
                  <Button 
                    className="mt-4"
                    onClick={() => navigate('/projects/new')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Project
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
            }>
              {filteredProjects.map((project) => (
                <Card 
                  key={project.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-1">
                        {project.name}
                      </CardTitle>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Phase:</span>
                        <Badge variant="outline" className={getPhaseColor(project.current_phase)}>
                          {project.current_phase}
                        </Badge>
                      </div>
                      
                      {project.budget && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Budget:</span>
                          <span className="font-medium">
                            ${project.budget.toLocaleString()}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress:</span>
                        <span className="font-medium">{project.progress_percentage || 0}%</span>
                      </div>
                      
                      {project.location && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Location:</span>
                          <span className="text-right line-clamp-1 max-w-32">
                            {project.location}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Projects;