import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, Plus, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type ProjectPhase = Database['public']['Tables']['project_phases']['Row'];

interface ProjectScheduleProps {
  projectId: string;
}

const ProjectSchedule = ({ projectId }: ProjectScheduleProps) => {
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProjectPhases();
  }, [projectId]);

  const fetchProjectPhases = async () => {
    try {
      const { data, error } = await supabase
        .from('project_phases')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // If no phases exist, create default ones
      if (!data || data.length === 0) {
        await createDefaultPhases();
      } else {
        setPhases(data);
      }
    } catch (error: any) {
      toast({
        title: "Error loading schedule",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultPhases = async () => {
    const defaultPhases = [
      { phase: 'concept' as const, status: 'active' as const, progress_percentage: 80 },
      { phase: 'design' as const, status: 'planning' as const, progress_percentage: 0 },
      { phase: 'pre_construction' as const, status: 'planning' as const, progress_percentage: 0 },
      { phase: 'execution' as const, status: 'planning' as const, progress_percentage: 0 },
      { phase: 'handover' as const, status: 'planning' as const, progress_percentage: 0 },
      { phase: 'operations_maintenance' as const, status: 'planning' as const, progress_percentage: 0 }
    ];

    try {
      const { data, error } = await supabase
        .from('project_phases')
        .insert(
          defaultPhases.map(phase => ({
            project_id: projectId,
            ...phase
          }))
        )
        .select();

      if (error) throw error;
      setPhases(data || []);
    } catch (error: any) {
      toast({
        title: "Error creating default phases",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updatePhaseStatus = async (phaseId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('project_phases')
        .update({ status: status as any })
        .eq('id', phaseId);

      if (error) throw error;

      setPhases(phases.map(phase => 
        phase.id === phaseId ? { ...phase, status: status as any } : phase
      ));

      toast({
        title: "Phase updated",
        description: `Phase status changed to ${status}`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating phase",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'active': return <Play className="h-4 w-4 text-blue-600" />;
      case 'on_hold': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPhaseTitle = (phase: string) => {
    const titles: { [key: string]: string } = {
      concept: 'Concept & Planning',
      design: 'Design Development',
      pre_construction: 'Pre-Construction',
      execution: 'Construction Execution',
      handover: 'Project Handover',
      operations_maintenance: 'Operations & Maintenance'
    };
    return titles[phase] || phase;
  };

  const getPhaseDescription = (phase: string) => {
    const descriptions: { [key: string]: string } = {
      concept: 'Initial project planning, feasibility studies, and conceptual design',
      design: 'Detailed architectural and engineering design development',
      pre_construction: 'Permits, contracts, and construction preparation',
      execution: 'Active construction and building phase',
      handover: 'Final inspections, documentation, and project delivery',
      operations_maintenance: 'Ongoing maintenance and facility management'
    };
    return descriptions[phase] || 'Phase description not available';
  };

  const calculateOverallProgress = () => {
    if (phases.length === 0) return 0;
    const totalProgress = phases.reduce((sum, phase) => sum + (phase.progress_percentage || 0), 0);
    return Math.round(totalProgress / phases.length);
  };

  if (loading) {
    return <div className="text-center p-8">Loading project schedule...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Project Timeline Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Overall Project Progress</span>
              <span className="text-sm text-muted-foreground">{calculateOverallProgress()}%</span>
            </div>
            <Progress value={calculateOverallProgress()} className="h-3" />
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {phases.filter(p => p.status === 'completed').length}
                </div>
                <div className="text-xs text-muted-foreground">Completed Phases</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {phases.filter(p => p.status === 'active').length}
                </div>
                <div className="text-xs text-muted-foreground">Active Phases</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {phases.filter(p => p.status === 'planning').length}
                </div>
                <div className="text-xs text-muted-foreground">Upcoming Phases</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Timeline */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Project Phases</h3>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Phase
          </Button>
        </div>

        <div className="space-y-4">
          {phases.map((phase, index) => (
            <Card key={phase.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(phase.status)}
                      <h4 className="text-lg font-semibold">{getPhaseTitle(phase.phase)}</h4>
                      <Badge variant="outline" className={getStatusColor(phase.status)}>
                        {phase.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {getPhaseDescription(phase.phase)}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Start Date</p>
                        <p className="text-sm font-medium">
                          {phase.start_date 
                            ? new Date(phase.start_date).toLocaleDateString()
                            : 'Not scheduled'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">End Date</p>
                        <p className="text-sm font-medium">
                          {phase.end_date 
                            ? new Date(phase.end_date).toLocaleDateString()
                            : 'Not scheduled'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Budget</p>
                        <p className="text-sm font-medium">
                          {phase.budget 
                            ? `$${phase.budget.toLocaleString()}`
                            : 'Not set'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium">Progress</span>
                        <span className="text-xs text-muted-foreground">
                          {phase.progress_percentage || 0}%
                        </span>
                      </div>
                      <Progress value={phase.progress_percentage || 0} className="h-2" />
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    {phase.status === 'planning' && (
                      <Button
                        size="sm"
                        onClick={() => updatePhaseStatus(phase.id, 'active')}
                      >
                        Start Phase
                      </Button>
                    )}
                    {phase.status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updatePhaseStatus(phase.id, 'completed')}
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Milestones Section */}
      <Card>
        <CardHeader>
          <CardTitle>Key Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="font-medium">Project Kickoff</p>
                <p className="text-sm text-muted-foreground">Initial planning phase completed</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Completed</Badge>
            </div>
            
            <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium">Design Approval</p>
                <p className="text-sm text-muted-foreground">Final design review and approval</p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
            </div>
            
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <Clock className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <p className="font-medium text-muted-foreground">Construction Start</p>
                <p className="text-sm text-muted-foreground">Begin construction phase</p>
              </div>
              <Badge variant="secondary">Upcoming</Badge>
            </div>
            
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <Clock className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <p className="font-medium text-muted-foreground">Project Completion</p>
                <p className="text-sm text-muted-foreground">Final handover and documentation</p>
              </div>
              <Badge variant="secondary">Upcoming</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectSchedule;