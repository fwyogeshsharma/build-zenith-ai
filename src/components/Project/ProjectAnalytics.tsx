import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Clock, Users, Target, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProjectAnalyticsProps {
  projectId: string;
}

const ProjectAnalytics = ({ projectId }: ProjectAnalyticsProps) => {
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Mock data for visualization - in a real app, this would come from your database
  const budgetData = [
    { phase: 'Concept', budgeted: 50000, actual: 48000 },
    { phase: 'Design', budgeted: 120000, actual: 125000 },
    { phase: 'Pre-Construction', budgeted: 80000, actual: 75000 },
    { phase: 'Execution', budgeted: 500000, actual: 520000 },
    { phase: 'Handover', budgeted: 30000, actual: 0 }
  ];

  const taskCompletionData = [
    { name: 'Completed', value: 45, color: '#10b981' },
    { name: 'In Progress', value: 23, color: '#3b82f6' },
    { name: 'Pending', value: 18, color: '#6b7280' },
    { name: 'Blocked', value: 4, color: '#ef4444' }
  ];

  const progressOverTime = [
    { week: 'Week 1', progress: 5 },
    { week: 'Week 2', progress: 12 },
    { week: 'Week 3', progress: 18 },
    { week: 'Week 4', progress: 25 },
    { week: 'Week 5', progress: 32 },
    { week: 'Week 6', progress: 38 },
    { week: 'Week 7', progress: 45 },
    { week: 'Week 8', progress: 52 }
  ];

  useEffect(() => {
    // Simulate loading analytics data
    const loadAnalytics = async () => {
      try {
        // In a real app, you would fetch analytics data from your database
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
      } catch (error: any) {
        toast({
          title: "Error loading analytics",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    loadAnalytics();
  }, [projectId]);

  const totalBudget = budgetData.reduce((sum, item) => sum + item.budgeted, 0);
  const actualSpent = budgetData.reduce((sum, item) => sum + item.actual, 0);
  const budgetVariance = ((actualSpent - totalBudget) / totalBudget) * 100;

  if (loading) {
    return <div className="text-center p-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Budget Status</p>
                <p className="text-2xl font-bold">
                  ${actualSpent.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  of ${totalBudget.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {budgetVariance > 0 ? (
                  <TrendingUp className="h-4 w-4 text-red-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-green-500" />
                )}
                <span className={`text-sm font-medium ${budgetVariance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {Math.abs(budgetVariance).toFixed(1)}%
                </span>
              </div>
            </div>
            <Progress value={(actualSpent / totalBudget) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Schedule Progress</p>
                <p className="text-2xl font-bold">52%</p>
                <p className="text-xs text-muted-foreground">8 weeks elapsed</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
            <Progress value={52} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Team Productivity</p>
                <p className="text-2xl font-bold">87%</p>
                <p className="text-xs text-muted-foreground">Tasks completed on time</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={87} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Risk Level</p>
                <p className="text-2xl font-bold">Low</p>
                <p className="text-xs text-muted-foreground">3 active risks</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="flex gap-1 mt-2">
              <div className="h-2 w-full bg-green-500 rounded"></div>
              <div className="h-2 w-full bg-gray-200 rounded"></div>
              <div className="h-2 w-full bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Budget vs Actual Spending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="phase" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                <Bar dataKey="budgeted" fill="#3b82f6" name="Budgeted" />
                <Bar dataKey="actual" fill="#10b981" name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Task Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Task Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={taskCompletionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {taskCompletionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {taskCompletionData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={progressOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip formatter={(value: number) => `${value}%`} />
              <Line 
                type="monotone" 
                dataKey="progress" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Indicators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Cost Performance Index (CPI)</span>
              <Badge className="bg-green-100 text-green-800">0.98 (Good)</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Schedule Performance Index (SPI)</span>
              <Badge className="bg-blue-100 text-blue-800">1.05 (Ahead)</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Quality Index</span>
              <Badge className="bg-green-100 text-green-800">95% (Excellent)</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Risk Score</span>
              <Badge className="bg-yellow-100 text-yellow-800">2.1 (Low)</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium">Budget optimization opportunity</p>
                <p className="text-xs text-muted-foreground">
                  Design phase completed under budget by $5,000
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium">Schedule acceleration</p>
                <p className="text-xs text-muted-foreground">
                  Pre-construction phase ahead of schedule by 3 days
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium">Resource allocation alert</p>
                <p className="text-xs text-muted-foreground">
                  Consider redistributing team members for execution phase
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectAnalytics;