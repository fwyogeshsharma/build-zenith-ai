import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, TrendingUp, AlertTriangle, Lightbulb, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AIInsight {
  id: string;
  type: 'optimization' | 'warning' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  projectId: string;
  projectName: string;
}

interface ProjectSpecificAIInsightsProps {
  recentProjects: Array<{
    id: string;
    name: string;
    status: string;
    current_phase: string;
    progress_percentage: number;
    expected_completion_date: string;
  }>;
}

const ProjectSpecificAIInsights = ({ recentProjects }: ProjectSpecificAIInsightsProps) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);

  useEffect(() => {
    generateProjectSpecificInsights();
  }, [recentProjects]);

  const generateProjectSpecificInsights = () => {
    const generatedInsights: AIInsight[] = [];

    recentProjects.forEach((project) => {
      // Check for schedule risks
      if (project.expected_completion_date) {
        const daysUntilDeadline = Math.ceil(
          (new Date(project.expected_completion_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysUntilDeadline < 30 && project.progress_percentage < 80) {
          generatedInsights.push({
            id: `schedule-${project.id}`,
            type: 'warning',
            title: 'Schedule Risk Detected',
            description: `${project.name} is ${80 - project.progress_percentage}% behind target progress with ${daysUntilDeadline} days remaining.`,
            impact: 'high',
            projectId: project.id,
            projectName: project.name
          });
        }
      }

      // Progress optimization suggestions
      if (project.progress_percentage < 25 && project.current_phase === 'concept') {
        generatedInsights.push({
          id: `progress-${project.id}`,
          type: 'recommendation',
          title: 'Accelerate Design Phase',
          description: `Consider parallel design activities to speed up ${project.name} progression.`,
          impact: 'medium',
          projectId: project.id,
          projectName: project.name
        });
      }

      // Sustainability recommendations for eligible projects
      if (project.current_phase === 'design' && project.progress_percentage < 50) {
        generatedInsights.push({
          id: `sustainability-${project.id}`,
          type: 'recommendation',
          title: 'Green Building Opportunity',
          description: `${project.name} is in early design phase - perfect time to integrate sustainable materials and LEED certification requirements.`,
          impact: 'medium',
          projectId: project.id,
          projectName: project.name
        });
      }

      // Resource optimization for active projects
      if (project.status === 'active' && project.progress_percentage > 50) {
        generatedInsights.push({
          id: `resource-${project.id}`,
          type: 'optimization',
          title: 'Resource Reallocation',
          description: `${project.name} approaching completion phase. Consider reallocating specialized teams to other active projects.`,
          impact: 'low',
          projectId: project.id,
          projectName: project.name
        });
      }
    });

    // Add some general insights if no specific ones
    if (generatedInsights.length === 0) {
      generatedInsights.push({
        id: 'general-1',
        type: 'recommendation',
        title: 'Project Template Optimization',
        description: 'Create standardized project templates to reduce setup time for future projects.',
        impact: 'medium',
        projectId: '',
        projectName: 'General Recommendation'
      });
    }

    setInsights(generatedInsights.slice(0, 3)); // Show max 3 insights
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'optimization':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'recommendation':
        return <Lightbulb className="h-4 w-4 text-primary" />;
      default:
        return <Bot className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-destructive text-destructive-foreground';
      case 'medium':
        return 'bg-warning text-warning-foreground';
      case 'low':
        return 'bg-success text-success-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const handleInsightClick = (insight: AIInsight) => {
    if (insight.projectId) {
      window.location.href = `/projects/${insight.projectId}`;
    }
  };

  return (
    <Card className="bg-gradient-card border-0 shadow-medium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="bg-primary/20 p-2 rounded-lg">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          AI Project Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.length > 0 ? (
          insights.map((insight) => (
            <div
              key={insight.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group cursor-pointer"
              onClick={() => handleInsightClick(insight)}
            >
              <div className="mt-0.5">
                {getInsightIcon(insight.type)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">{insight.title}</h4>
                  <Badge className={`text-xs ${getImpactColor(insight.impact)}`}>
                    {insight.impact.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {insight.description}
                </p>
                {insight.projectId && (
                  <p className="text-xs text-primary font-medium">
                    {insight.projectName}
                  </p>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No active insights available</p>
            <p className="text-xs">AI insights will appear as your projects progress</p>
          </div>
        )}
        
        <Button variant="outline" className="w-full">
          <Bot className="mr-2 h-4 w-4" />
          View All AI Insights
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProjectSpecificAIInsights;