import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Lightbulb, 
  PenTool, 
  Hammer, 
  Construction, 
  CheckCircle, 
  Settings, 
  Recycle,
  FileText,
  Users,
  Calendar,
  TrendingUp,
  Shield,
  Award,
  Bot,
  Zap,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CertificationManagement from './CertificationManagement';
import { PhaseProgressDialog } from '../Progress/PhaseProgressDialog';

interface ProjectLifecycleProps {
  projectId: string;
}

const lifecycleStages = [
  {
    id: 'concept',
    name: 'Concept & Initiation',
    icon: Lightbulb,
    color: 'bg-blue-500',
    inputs: ['Project need', 'Site details', 'Initial budget'],
    aiTools: ['Market forecasting', 'Land evaluation', 'ROI simulation', 'Zoning compliance checks'],
    deliverables: ['Feasibility report', 'Preliminary approvals'],
    certifications: ['Initial compliance review']
  },
  {
    id: 'design',
    name: 'Planning & Design',
    icon: PenTool,
    color: 'bg-purple-500',
    inputs: ['Architect plans', 'BIM/CAD models'],
    aiTools: ['Generative design', 'BIM clash detection', 'Energy simulation', 'Auto-code checks', 'Auto-fill permits'],
    deliverables: ['Master plan', 'Schedule', 'Design approval', 'Green certification readiness (LEED, IGBC, BREEAM)'],
    certifications: ['LEED preparation', 'BREEAM compliance', 'IGBC documentation']
  },
  {
    id: 'pre_construction',
    name: 'Pre-Construction',
    icon: Hammer,
    color: 'bg-orange-500',
    inputs: ['Contractor bids', 'Insurance', 'Procurement list'],
    aiTools: ['Contract review (NLP)', 'Vendor selection optimization', 'Risk prediction', 'Automated permit submission'],
    deliverables: ['Final contracts', 'Procurement plan', 'Site readiness'],
    certifications: ['ISO 9001 preparation', 'Safety compliance setup']
  },
  {
    id: 'execution',
    name: 'Construction (Execution)',
    icon: Construction,
    color: 'bg-green-500',
    inputs: ['Project schedule', 'Site workforce', 'Material flow'],
    aiTools: ['Predictive scheduling (4D BIM)', 'Drones + CV for progress tracking', 'Robotics for automation', 'AI safety monitoring'],
    deliverables: ['Daily logs', 'Dashboards', 'Safety compliance reports', 'Interim certifications (ISO, OSHA)'],
    certifications: ['ISO 45001', 'OSHA compliance', 'Quality control certifications']
  },
  {
    id: 'handover',
    name: 'Commissioning & Handover',
    icon: CheckCircle,
    color: 'bg-gray-500',
    inputs: ['Completed works', 'Inspections'],
    aiTools: ['Automated QA/QC (BIM vs as-built)', 'Defect detection apps', 'Handover doc automation', 'Occupancy certificate checks'],
    deliverables: ['As-built drawings', 'Warranties', 'Occupancy certificate', 'LEED/BREEAM certification packs'],
    certifications: ['LEED certification', 'BREEAM certification', 'Energy Star rating']
  },
  {
    id: 'operations_maintenance',
    name: 'Operation & Maintenance (O&M)',
    icon: Settings,
    color: 'bg-indigo-500',
    inputs: ['Facility data', 'IoT sensors'],
    aiTools: ['Digital twin (7D BIM)', 'Predictive maintenance', 'Smart energy management', 'Compliance alerts (ISO, Energy Star)'],
    deliverables: ['Maintenance logs', 'Compliance reports', 'Tenant comfort dashboards'],
    certifications: ['ISO 50001', 'Energy Star maintenance', 'WELL certification']
  },
  {
    id: 'renovation_demolition',
    name: 'Renovation / Demolition (End of Life)',
    icon: Recycle,
    color: 'bg-red-500',
    inputs: ['Building age', 'Structural integrity', 'Cost analysis'],
    aiTools: ['Lifecycle cost analysis', 'Demolition permits automation', 'Material recovery optimization', 'Circular economy tracking'],
    deliverables: ['Renovation vs. demolition decision', 'Recycling certification', 'Sustainability proof'],
    certifications: ['Circular economy certification', 'Material recovery documentation']
  }
];

const certificationTypes = [
  { category: 'Green/Sustainability', items: ['LEED', 'BREEAM', 'IGBC', 'GRIHA', 'WELL', 'LBC'] },
  { category: 'Quality & Safety', items: ['ISO 9001', 'ISO 45001', 'OHSAS'] },
  { category: 'Energy & Efficiency', items: ['Energy Star', 'Green Globes', 'EDGE'] },
  { category: 'Infrastructure', items: ['SITES', 'Fitwel'] }
];

const ProjectLifecycle = ({ projectId }: ProjectLifecycleProps) => {
  const [currentPhase, setCurrentPhase] = useState('concept');
  const [phaseProgress, setPhaseProgress] = useState<Record<string, number>>({});
  const [activeCertifications, setActiveCertifications] = useState<any[]>([]);
  const [progressingPhase, setProgressingPhase] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchProjectPhase();
    fetchCertifications();
    fetchPhaseProgress();
  }, [projectId]);

  const fetchProjectPhase = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('current_phase, progress_percentage')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      if (data) {
        setCurrentPhase(data.current_phase);
        // Set progress for current phase
        setPhaseProgress(prev => ({
          ...prev,
          [data.current_phase]: data.progress_percentage || 0
        }));
      }
    } catch (error: any) {
      console.error('Error fetching project phase:', error);
    }
  };

  const fetchPhaseProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('project_phases')
        .select('phase, progress_percentage')
        .eq('project_id', projectId);

      if (error) throw error;
      
      const progressMap: Record<string, number> = {};
      data?.forEach(phase => {
        progressMap[phase.phase] = phase.progress_percentage || 0;
      });
      
      setPhaseProgress(progressMap);
    } catch (error: any) {
      console.error('Error fetching phase progress:', error);
    }
  };

  const fetchCertifications = async () => {
    try {
      const { data, error } = await supabase
        .from('certifications')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;
      setActiveCertifications(data || []);
    } catch (error: any) {
      console.error('Error fetching certifications:', error);
    }
  };

  const getCurrentStageIndex = () => {
    return lifecycleStages.findIndex(stage => stage.id === currentPhase);
  };

  const isStageCompleted = (stageIndex: number) => {
    return stageIndex < getCurrentStageIndex();
  };

  const isCurrentStage = (stageIndex: number) => {
    return stageIndex === getCurrentStageIndex();
  };

  const StageCard = ({ stage, index }: { stage: any; index: number }) => {
    const Icon = stage.icon;
    const isCompleted = isStageCompleted(index);
    const isCurrent = isCurrentStage(index);
    const progress = phaseProgress[stage.id] || 0;

    const handlePhaseClick = () => {
      // Navigate to project detail with tasks tab and phase filter
      const currentUrl = new URL(window.location.href);
      const projectId = currentUrl.pathname.split('/')[2]; // Assuming URL format /project/:id
      window.location.href = `/project/${projectId}?tab=tasks&phase=${stage.id}`;
    };

    return (
      <Card 
        className={`transition-all duration-200 cursor-pointer hover:shadow-md ${
          isCurrent ? 'ring-2 ring-primary shadow-lg' : 
          isCompleted ? 'bg-muted/30' : 'opacity-75'
        }`}
        onClick={handlePhaseClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stage.color} text-white`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{stage.name}</CardTitle>
                {isCurrent && (
                  <Badge variant="default" className="mt-1">
                    Current Phase
                  </Badge>
                )}
                {isCompleted && (
                  <Badge variant="secondary" className="mt-1">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
            </div>
            {isCurrent && (
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{progress}%</div>
                <div className="text-sm text-muted-foreground">Progress</div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setProgressingPhase({ id: stage.id, name: stage.name, progress_percentage: progress })}
                  className="mt-2"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Update Progress
                </Button>
              </div>
            )}
          </div>
          {isCurrent && (
            <Progress value={progress} className="mt-2" />
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div>
            <h4 className="flex items-center gap-2 font-semibold text-sm mb-2">
              <FileText className="h-4 w-4" />
              Inputs
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {stage.inputs.map((input: string, idx: number) => (
                <li key={idx} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                  {input}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="flex items-center gap-2 font-semibold text-sm mb-2">
              <Bot className="h-4 w-4" />
              AI Tools
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {stage.aiTools.map((tool: string, idx: number) => (
                <li key={idx} className="flex items-center gap-2">
                  <Zap className="h-3 w-3 text-blue-500" />
                  {tool}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="flex items-center gap-2 font-semibold text-sm mb-2">
              <TrendingUp className="h-4 w-4" />
              Deliverables
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {stage.deliverables.map((deliverable: string, idx: number) => (
                <li key={idx} className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  {deliverable}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="flex items-center gap-2 font-semibold text-sm mb-2">
              <Award className="h-4 w-4" />
              Certifications
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {stage.certifications.map((cert: string, idx: number) => (
                <li key={idx} className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-amber-500" />
                  {cert}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Lifecycle Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Project Lifecycle Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            {lifecycleStages.map((stage, index) => {
              const Icon = stage.icon;
              const isCompleted = isStageCompleted(index);
              const isCurrent = isCurrentStage(index);
              
              return (
                <div key={stage.id} className="flex flex-col items-center">
                  <div className={`p-3 rounded-full ${
                    isCurrent ? 'bg-primary text-primary-foreground' :
                    isCompleted ? 'bg-green-500 text-white' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-xs mt-2 text-center max-w-16">
                    {stage.name.split(' ')[0]}
                  </div>
                  {index < lifecycleStages.length - 1 && (
                    <div className={`h-0.5 w-12 mt-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-muted'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="stages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stages">Lifecycle Stages</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="stages" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {lifecycleStages.map((stage, index) => (
              <StageCard key={stage.id} stage={stage} index={index} />
            ))}
          </div>
        </TabsContent>


        <TabsContent value="ai-insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI-Powered Project Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-4 w-4 text-blue-600" />
                      <h4 className="font-semibold text-blue-800">Progress Prediction</h4>
                    </div>
                    <p className="text-sm text-blue-700">
                      Based on current progress, project completion is estimated for June 2024
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <h4 className="font-semibold text-green-800">Cost Optimization</h4>
                    </div>
                    <p className="text-sm text-green-700">
                      Potential 12% cost savings identified through optimized material sourcing
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <h4 className="font-semibold text-amber-800">Risk Assessment</h4>
                    </div>
                    <p className="text-sm text-amber-700">
                      Weather conditions may impact construction timeline in Phase 4
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">AI Recommendations for Current Phase</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <Bot className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Optimize BIM Clash Detection</p>
                      <p className="text-sm text-muted-foreground">
                        Run automated clash detection to identify potential conflicts before construction phase
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <Bot className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Energy Simulation Analysis</p>
                      <p className="text-sm text-muted-foreground">
                        Conduct energy performance simulation to ensure LEED certification requirements
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Phase Progress Dialog */}
      {progressingPhase && (
        <PhaseProgressDialog
          projectId={projectId}
          phase={progressingPhase}
          open={!!progressingPhase}
          onOpenChange={(open) => !open && setProgressingPhase(null)}
          onProgressUpdated={() => {
            fetchProjectPhase();
            fetchPhaseProgress();
          }}
        />
      )}
    </div>
  );
};

export default ProjectLifecycle;