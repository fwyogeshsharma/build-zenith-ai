import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import DashboardSidebar from '@/components/Dashboard/DashboardSidebar';
import StatCard from '@/components/Dashboard/StatCard';
import ProjectCard from '@/components/Dashboard/ProjectCard';
import AIInsightsCard from '@/components/Dashboard/AIInsightsCard';
import RecentActivity from '@/components/Dashboard/RecentActivity';
import { 
  Building2, 
  TrendingUp, 
  Users, 
  Calendar,
  Plus,
  Target,
  Award,
  BarChart3,
  CheckCircle,
  Clock,
  Bot,
  Search,
  Filter,
  Leaf
} from 'lucide-react';
import CertificationTracker from '@/components/Project/CertificationTracker';
import { Input } from '@/components/ui/input';

interface Project {
  id: string;
  name: string;
  description: string;
  project_type: string;
  status: string;
  current_phase: string;
  location: string;
  budget: number;
  progress_percentage: number;
  expected_completion_date: string;
  created_at: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: 'Active Projects',
      value: projects.filter(p => p.status === 'active').length,
      description: 'Currently in progress',
      icon: Building2,
      trend: { value: 12, isPositive: true }
    },
    {
      title: 'Avg Progress',
      value: `${Math.round(projects.reduce((acc, p) => acc + p.progress_percentage, 0) / projects.length || 0)}%`,
      description: 'Across all projects',
      icon: TrendingUp,
      trend: { value: 8, isPositive: true }
    },
    {
      title: 'Team Members',
      value: 24,
      description: 'Active contributors',
      icon: Users,
      trend: { value: 3, isPositive: true }
    },
    {
      title: 'On Schedule',
      value: projects.filter(p => new Date(p.expected_completion_date) > new Date()).length,
      description: 'Projects on track',
      icon: Calendar,
      trend: { value: 5, isPositive: false }
    }
  ];

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome back, {user?.email?.split('@')[0]}! 👋
              </h1>
              <p className="text-muted-foreground">
                Here's what's happening with your construction projects today.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Bot className="mr-2 h-4 w-4" />
                AI Assistant
              </Button>
              <Button size="sm" className="bg-construction hover:bg-construction-dark">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <StatCard
                key={index}
                title={stat.title}
                value={stat.value}
                description={stat.description}
                icon={stat.icon}
                trend={stat.trend}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Projects Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Recent Projects</h2>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search projects..."
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-card rounded-lg p-6 animate-pulse">
                      <div className="h-4 bg-muted rounded mb-4"></div>
                      <div className="h-3 bg-muted rounded mb-2"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onViewDetails={(id) => console.log('View project:', id)}
                      onEdit={(id) => console.log('Edit project:', id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-gradient-card border-0 rounded-lg p-8 text-center shadow-medium">
                  <div className="bg-sustainability/20 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                    <Leaf className="h-8 w-8 text-sustainability" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No Projects Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Get started by creating your first construction project.
                  </p>
                  <Button className="bg-construction hover:bg-construction-dark">
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Project
                  </Button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <AIInsightsCard />
              <RecentActivity />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;