import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, TrendingUp, AlertTriangle, Lightbulb, ChevronRight } from 'lucide-react';

interface AIInsight {
  id: string;
  type: 'optimization' | 'warning' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  projectId?: string;
  projectName?: string;
}

const mockInsights: AIInsight[] = [
  {
    id: '1',
    type: 'warning',
    title: 'Weather Risk Alert',
    description: 'Heavy rain forecasted next week may impact outdoor construction activities.',
    impact: 'high',
    projectId: '1',
    projectName: 'Downtown Office Complex'
  },
  {
    id: '2',
    type: 'optimization',
    title: 'Resource Optimization',
    description: 'Reallocating crane usage can reduce costs by 15% across active projects.',
    impact: 'medium',
  },
  {
    id: '3',
    type: 'recommendation',
    title: 'LEED Certification Opportunity',
    description: 'Adding solar panels would qualify for LEED Gold certification.',
    impact: 'medium',
    projectId: '2',
    projectName: 'Green Residential Complex'
  },
];

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

const AIInsightsCard = () => {
  return (
    <Card className="bg-gradient-card border-0 shadow-medium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="bg-primary/20 p-2 rounded-lg">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockInsights.map((insight) => (
          <div
            key={insight.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group cursor-pointer"
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
              {insight.projectName && (
                <p className="text-xs text-primary font-medium">
                  {insight.projectName}
                </p>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
        ))}
        
        <Button variant="outline" className="w-full">
          <Bot className="mr-2 h-4 w-4" />
          View All Insights
        </Button>
      </CardContent>
    </Card>
  );
};

export default AIInsightsCard;