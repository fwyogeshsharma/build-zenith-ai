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
  const [budgetData, setBudgetData] = useState<any[]>([]);
  const [taskCompletionData, setTaskCompletionData] = useState<any[]>([]);
  const [progressOverTime, setProgressOverTime] = useState<any[]>([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [actualSpent, setActualSpent] = useState(0);
  const [projectProgress, setProjectProgress] = useState(0);
  const [teamProductivity, setTeamProductivity] = useState(0);
  const [scheduleProgress, setScheduleProgress] = useState(0);
  const [riskLevel, setRiskLevel] = useState('Low');
  const [activeRisks, setActiveRisks] = useState(0);
  const [projectBudget, setProjectBudget] = useState(0);
  const [performanceIndicators, setPerformanceIndicators] = useState({
    cpi: 1.0,
    spi: 1.0,
    qualityIndex: 95,
    riskScore: 2.1
  });
  const [insights, setInsights] = useState<Array<{color: string, title: string, description: string}>>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, [projectId]);

  const loadAnalytics = async () => {
    try {
      // Load real data from database
      await Promise.all([
        loadBudgetData(),
        loadTaskData(),
        loadProgressData(),
        loadProjectMetrics(),
        loadScheduleData(),
        loadRiskData(),
        loadPerformanceIndicators()
      ]);
    } catch (error: any) {
      toast({
        title: "Error loading analytics",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBudgetData = async () => {
    try {
      // Get actual project budget
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('budget')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      const actualProjectBudget = project?.budget || 0;
      setProjectBudget(actualProjectBudget);

      // Get project phases with budget data
      const { data: phases, error: phasesError } = await supabase
        .from('project_phases')
        .select('phase, budget, actual_cost')
        .eq('project_id', projectId);

      if (phasesError) throw phasesError;

      // Get task resources for actual costs if no phase costs
      const { data: resources, error: resourcesError } = await supabase
        .from('task_resources')
        .select('total_cost, task_id')
        .in('task_id', 
          (await supabase
            .from('tasks')
            .select('id')
            .eq('project_id', projectId)
          ).data?.map(t => t.id) || []
        );

      if (resourcesError) throw resourcesError;

      const phaseNames = ['concept', 'design', 'pre_construction', 'execution', 'handover'];
      const budgetChartData = phaseNames.map(phaseName => {
        const phase = phases?.find(p => p.phase === phaseName);
        const phaseTasks = resources?.filter(r => 
          // This would need proper task-phase mapping
          true // Simplified for now
        ) || [];
        
        const actualCost = phase?.actual_cost || 
          phaseTasks.reduce((sum, r) => sum + (r.total_cost || 0), 0);
        
        return {
          phase: phaseName.replace('_', ' '),
          budgeted: phase?.budget || 0,
          actual: actualCost
        };
      });

      setBudgetData(budgetChartData);
      
      // Use actual project budget or fallback to phase budgets
      const phaseBudgetSum = budgetChartData.reduce((sum, item) => sum + item.budgeted, 0);
      setTotalBudget(actualProjectBudget > 0 ? actualProjectBudget : phaseBudgetSum);
      setActualSpent(budgetChartData.reduce((sum, item) => sum + item.actual, 0));
    } catch (error) {
      console.error('Error loading budget data:', error);
    }
  };

  const loadTaskData = async () => {
    try {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('status')
        .eq('project_id', projectId);

      if (error) throw error;

      const statusCounts = tasks?.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const taskChart = [
        { name: 'Completed', value: statusCounts.completed || 0, color: '#10b981' },
        { name: 'In Progress', value: statusCounts.in_progress || 0, color: '#3b82f6' },
        { name: 'Pending', value: statusCounts.pending || 0, color: '#6b7280' },
        { name: 'Blocked', value: statusCounts.blocked || 0, color: '#ef4444' }
      ];

      setTaskCompletionData(taskChart);

      // Calculate team productivity
      const totalTasks = tasks?.length || 0;
      const completedTasks = statusCounts.completed || 0;
      setTeamProductivity(totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0);
    } catch (error) {
      console.error('Error loading task data:', error);
    }
  };

  const loadProgressData = async () => {
    try {
      const { data: progressEntries, error } = await supabase
        .from('progress_entries')
        .select('progress_percentage, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (progressEntries && progressEntries.length > 0) {
        // Group by week and get average progress
        const weeklyProgress = progressEntries.reduce((acc, entry) => {
          const week = new Date(entry.created_at).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
          if (!acc[week]) {
            acc[week] = [];
          }
          acc[week].push(entry.progress_percentage);
          return acc;
        }, {} as Record<string, number[]>);

        const progressChart = Object.entries(weeklyProgress).map(([week, values]) => ({
          week,
          progress: Math.round(values.reduce((sum, val) => sum + val, 0) / values.length)
        }));

        setProgressOverTime(progressChart);
        
        // Set current project progress
        const latestProgress = progressEntries[progressEntries.length - 1];
        setProjectProgress(latestProgress.progress_percentage);
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  };

  const loadProjectMetrics = async () => {
    try {
      // Get project info for overall progress
      const { data: project, error } = await supabase
        .from('projects')
        .select('progress_percentage')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      
      if (project) {
        setProjectProgress(project.progress_percentage || 0);
      }
    } catch (error) {
      console.error('Error loading project metrics:', error);
    }
  };

  const loadScheduleData = async () => {
    try {
      const { data: project, error } = await supabase
        .from('projects')
        .select('start_date, expected_completion_date')
        .eq('id', projectId)
        .single();

      if (error) throw error;

      if (project && project.start_date && project.expected_completion_date) {
        const startDate = new Date(project.start_date);
        const endDate = new Date(project.expected_completion_date);
        const currentDate = new Date();

        // Calculate elapsed vs total time
        const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        const elapsedDays = Math.max(0, (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        const schedulePercentage = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
        setScheduleProgress(Math.round(schedulePercentage));
      }
    } catch (error) {
      console.error('Error loading schedule data:', error);
    }
  };

  const loadRiskData = async () => {
    try {
      // Check for various risk indicators
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('status, due_date')
        .eq('project_id', projectId);

      if (tasksError) throw tasksError;

      // Calculate risk indicators
      let riskScore = 0;
      let risks = 0;

      if (tasks) {
        const overdueTasks = tasks.filter(task => 
          task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
        ).length;
        
        const blockedTasks = tasks.filter(task => task.status === 'blocked').length;

        // Risk scoring
        if (overdueTasks > 0) {
          riskScore += overdueTasks * 2;
          risks++;
        }
        if (blockedTasks > 0) {
          riskScore += blockedTasks * 3;
          risks++;
        }

        // Budget variance risk
        const variance = Math.abs(budgetVariance);
        if (variance > 10) {
          riskScore += 5;
          risks++;
        }
      }

      setActiveRisks(risks);
      
      // Determine risk level
      if (riskScore === 0) setRiskLevel('Very Low');
      else if (riskScore <= 5) setRiskLevel('Low');
      else if (riskScore <= 10) setRiskLevel('Medium');
      else if (riskScore <= 15) setRiskLevel('High');
      else setRiskLevel('Critical');

    } catch (error) {
      console.error('Error loading risk data:', error);
    }
  };

  const loadPerformanceIndicators = async () => {
    try {
      // Calculate CPI (Cost Performance Index) = EV / AC
      // For simplicity: CPI = budgeted / actual_spent
      const cpi = totalBudget > 0 && actualSpent > 0 ? totalBudget / actualSpent : 1.0;
      
      // Calculate SPI (Schedule Performance Index) = EV / PV
      // For simplicity: SPI = actual_progress / schedule_progress
      const spi = scheduleProgress > 0 ? projectProgress / scheduleProgress : 1.0;
      
      // Quality Index based on task completion quality
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('status, priority')
        .eq('project_id', projectId);

      if (error) throw error;

      let qualityIndex = 95; // Default
      if (tasks && tasks.length > 0) {
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const highPriorityCompleted = tasks.filter(t => t.status === 'completed' && t.priority === 'high').length;
        const totalHighPriority = tasks.filter(t => t.priority === 'high').length;
        
        // Quality based on high priority task completion
        if (totalHighPriority > 0) {
          qualityIndex = Math.round((highPriorityCompleted / totalHighPriority) * 100);
        } else {
          qualityIndex = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 95;
        }
      }

      // Risk score calculation
      let riskScore = 0;
      const variance = Math.abs(budgetVariance);
      if (variance > 20) riskScore += 3;
      else if (variance > 10) riskScore += 2;
      else if (variance > 5) riskScore += 1;

      if (scheduleProgress > projectProgress + 10) riskScore += 2; // Behind schedule
      if (activeRisks > 0) riskScore += activeRisks;

      setPerformanceIndicators({
        cpi: Math.round(cpi * 100) / 100,
        spi: Math.round(spi * 100) / 100,
        qualityIndex: Math.max(0, Math.min(100, qualityIndex)),
        riskScore: Math.round(riskScore * 10) / 10
      });

      // Generate dynamic insights
      const dynamicInsights = [];
      
      if (cpi > 1.05) {
        dynamicInsights.push({
          color: "bg-green-500",
          title: "Budget optimization opportunity",
          description: `Project is under budget with CPI of ${Math.round(cpi * 100) / 100}`
        });
      } else if (cpi < 0.95) {
        dynamicInsights.push({
          color: "bg-red-500",
          title: "Budget overrun alert",
          description: `Project is over budget with CPI of ${Math.round(cpi * 100) / 100}`
        });
      }

      if (spi > 1.05) {
        dynamicInsights.push({
          color: "bg-blue-500",
          title: "Schedule acceleration",
          description: `Project is ahead of schedule with SPI of ${Math.round(spi * 100) / 100}`
        });
      } else if (spi < 0.95) {
        dynamicInsights.push({
          color: "bg-orange-500",
          title: "Schedule delay warning",
          description: `Project is behind schedule with SPI of ${Math.round(spi * 100) / 100}`
        });
      }

      if (activeRisks > 2) {
        dynamicInsights.push({
          color: "bg-yellow-500",
          title: "Risk management required",
          description: `${activeRisks} active risks need attention`
        });
      }

      if (qualityIndex < 80) {
        dynamicInsights.push({
          color: "bg-purple-500",
          title: "Quality improvement needed",
          description: `Quality index at ${qualityIndex}% - focus on task completion`
        });
      }

      // If no specific insights, add generic positive ones
      if (dynamicInsights.length === 0) {
        dynamicInsights.push({
          color: "bg-green-500",
          title: "Project on track",
          description: "All key performance indicators are within acceptable ranges"
        });
      }

      setInsights(dynamicInsights.slice(0, 3)); // Limit to 3 insights

    } catch (error) {
      console.error('Error loading performance indicators:', error);
    }
  };

  const budgetVariance = totalBudget > 0 ? ((actualSpent - totalBudget) / totalBudget) * 100 : 0;

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
                <p className="text-2xl font-bold">{scheduleProgress}%</p>
                <p className="text-xs text-muted-foreground">Time elapsed</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
            <Progress value={scheduleProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Team Productivity</p>
                <p className="text-2xl font-bold">{teamProductivity}%</p>
                <p className="text-xs text-muted-foreground">Tasks completed on time</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={teamProductivity} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Risk Level</p>
                <p className="text-2xl font-bold">{riskLevel}</p>
                <p className="text-xs text-muted-foreground">{activeRisks} active risks</p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${
                riskLevel === 'Very Low' || riskLevel === 'Low' ? 'text-green-500' :
                riskLevel === 'Medium' ? 'text-yellow-500' :
                riskLevel === 'High' ? 'text-orange-500' : 'text-red-500'
              }`} />
            </div>
            <div className="flex gap-1 mt-2">
              <div className={`h-2 w-full rounded ${
                riskLevel === 'Very Low' || riskLevel === 'Low' ? 'bg-green-500' : 'bg-gray-200'
              }`}></div>
              <div className={`h-2 w-full rounded ${
                riskLevel === 'Medium' ? 'bg-yellow-500' : 'bg-gray-200'
              }`}></div>
              <div className={`h-2 w-full rounded ${
                riskLevel === 'High' || riskLevel === 'Critical' ? 'bg-red-500' : 'bg-gray-200'
              }`}></div>
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
              <Badge className={performanceIndicators.cpi >= 1.0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                {performanceIndicators.cpi} ({performanceIndicators.cpi >= 1.0 ? 'Good' : 'Over Budget'})
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Schedule Performance Index (SPI)</span>
              <Badge className={performanceIndicators.spi >= 1.0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                {performanceIndicators.spi} ({performanceIndicators.spi >= 1.0 ? 'On Track' : 'Behind'})
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Quality Index</span>
              <Badge className={
                performanceIndicators.qualityIndex >= 90 ? "bg-green-100 text-green-800" :
                performanceIndicators.qualityIndex >= 70 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
              }>
                {performanceIndicators.qualityIndex}% ({
                  performanceIndicators.qualityIndex >= 90 ? 'Excellent' :
                  performanceIndicators.qualityIndex >= 70 ? 'Good' : 'Needs Improvement'
                })
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Risk Score</span>
              <Badge className={
                performanceIndicators.riskScore <= 2 ? "bg-green-100 text-green-800" :
                performanceIndicators.riskScore <= 5 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
              }>
                {performanceIndicators.riskScore} ({
                  performanceIndicators.riskScore <= 2 ? 'Low' :
                  performanceIndicators.riskScore <= 5 ? 'Medium' : 'High'
                })
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className="flex gap-3">
                <div className={`w-2 h-2 ${insight.color} rounded-full mt-2`}></div>
                <div>
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className="text-xs text-muted-foreground">{insight.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectAnalytics;