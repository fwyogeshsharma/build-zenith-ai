import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Bot, TrendingUp, AlertTriangle, Lightbulb, ChevronRight, Send, Loader2, Award, Calendar, Target, CheckCircle2, Circle, Clock, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { getProjectTemplate } from '@/lib/projectTemplates';
import { geminiService, type ProjectContext } from '@/lib/geminiService';

interface AIInsight {
  id: string;
  type: 'optimization' | 'warning' | 'recommendation' | 'certification' | 'phase_guidance';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  projectId: string;
  projectName: string;
  category?: 'schedule' | 'budget' | 'quality' | 'sustainability' | 'compliance' | 'resources';
  actionable?: boolean;
  dueDate?: string;
  relatedPhase?: string;
  certificationInfo?: {
    type: string;
    progress: number;
    requirements: string[];
  };
}

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  projectContext?: {
    projectId: string;
    projectName: string;
    phase: string;
    progress: number;
  };
}

type ProjectData = {
  id: string;
  name: string;
  status: string;
  current_phase: string;
  progress_percentage: number;
  expected_completion_date: string;
  project_type: Database['public']['Enums']['project_type'];
  budget?: number;
  location?: string;
  certifications?: any[];
  tasks?: any[];
  team_members?: any[];
};

interface ProjectSpecificAIInsightsProps {
  recentProjects: Array<ProjectData>;
  selectedProjectId?: string;
}

const ProjectSpecificAIInsights = ({ recentProjects, selectedProjectId }: ProjectSpecificAIInsightsProps) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{
    id: '1',
    content: 'Hello! I\'m your AI project assistant. I can help you with insights, recommendations, and answer questions about your construction projects. What would you like to know?',
    isUser: false,
    timestamp: new Date()
  }]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [projectDetails, setProjectDetails] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedProjectId) {
      const project = recentProjects.find(p => p.id === selectedProjectId);
      if (project) {
        setSelectedProject(project);
        fetchProjectDetails(project.id);
      }
    } else if (recentProjects.length > 0) {
      setSelectedProject(recentProjects[0]);
      fetchProjectDetails(recentProjects[0].id);
    }
  }, [selectedProjectId, recentProjects]);

  useEffect(() => {
    if (selectedProject) {
      generateProjectSpecificInsights();
      // Update Gemini context when project changes
      const projectContext: ProjectContext = {
        id: selectedProject.id,
        name: selectedProject.name,
        type: selectedProject.project_type,
        phase: selectedProject.current_phase,
        progress: selectedProject.progress_percentage,
        budget: selectedProject.budget,
        expectedCompletion: selectedProject.expected_completion_date,
        certifications: projectDetails?.certifications || [],
        tasks: projectDetails?.tasks || [],
        teamMembers: projectDetails?.teamMembers || []
      };
      geminiService.updateProjectContext(projectContext);
    }
  }, [selectedProject, projectDetails]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    // Test Gemini API connection on component mount
    const testGeminiConnection = async () => {
      const isConnected = await geminiService.testConnection();
      if (isConnected) {
        console.log('🎉 Gemini AI is ready!');
      } else {
        console.log('⚠️ Gemini AI unavailable - will use fallback responses');
      }
    };
    
    testGeminiConnection();
  }, []);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchProjectDetails = async (projectId: string) => {
    try {
      const [certificationsResult, tasksResult, teamResult] = await Promise.all([
        supabase.from('certifications').select('*').eq('project_id', projectId),
        supabase.from('tasks').select('*').eq('project_id', projectId).limit(10),
        supabase.from('project_team_members').select(`
          *,
          profiles:user_id(*)
        `).eq('project_id', projectId)
      ]);

      setProjectDetails({
        certifications: certificationsResult.data || [],
        tasks: tasksResult.data || [],
        teamMembers: teamResult.data || []
      });
    } catch (error) {
      console.error('Error fetching project details:', error);
    }
  };

  const generateProjectSpecificInsights = () => {
    if (!selectedProject) return;
    
    const generatedInsights: AIInsight[] = [];
    const project = selectedProject;
    const template = getProjectTemplate(project.project_type);
    const certifications = projectDetails?.certifications || [];
    const tasks = projectDetails?.tasks || [];
    
    // Phase-specific guidance
    const currentPhaseTemplate = template.phases.find(p => p.phase === project.current_phase);
    if (currentPhaseTemplate) {
      generatedInsights.push({
        id: `phase-guidance-${project.id}`,
        type: 'phase_guidance',
        title: `${project.current_phase.charAt(0).toUpperCase() + project.current_phase.slice(1)} Phase Guidance`,
        description: `Key focus areas for ${project.project_type.replace('_', ' ')} projects in ${project.current_phase} phase: ${template.ai_focus.slice(0, 2).join(', ')}`,
        impact: 'high',
        projectId: project.id,
        projectName: project.name,
        category: 'quality',
        relatedPhase: project.current_phase,
        actionable: true
      });
    }

    // Certification insights
    if (certifications.length > 0) {
      certifications.forEach(cert => {
        if (cert.current_status === 'in_progress' && cert.progress_percentage < 60) {
          generatedInsights.push({
            id: `cert-${cert.id}`,
            type: 'certification',
            title: `${cert.type.toUpperCase()} Certification Progress`,
            description: `${cert.type.toUpperCase()} ${cert.target_level || ''} certification is ${cert.progress_percentage}% complete. Focus on missing requirements to stay on track.`,
            impact: 'high',
            projectId: project.id,
            projectName: project.name,
            category: 'compliance',
            certificationInfo: {
              type: cert.type,
              progress: cert.progress_percentage || 0,
              requirements: Object.keys(cert.requirements || {})
            }
          });
        }
      });
    }

    // Schedule risk analysis
    if (project.expected_completion_date) {
      const daysUntilDeadline = Math.ceil(
        (new Date(project.expected_completion_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysUntilDeadline < 30 && project.progress_percentage < 80) {
        generatedInsights.push({
          id: `schedule-${project.id}`,
          type: 'warning',
          title: 'Critical Schedule Risk',
          description: `Project is ${80 - project.progress_percentage}% behind target with only ${daysUntilDeadline} days remaining. Immediate action required.`,
          impact: 'high',
          projectId: project.id,
          projectName: project.name,
          category: 'schedule',
          dueDate: project.expected_completion_date,
          actionable: true
        });
      } else if (daysUntilDeadline < 60 && project.progress_percentage < 70) {
        generatedInsights.push({
          id: `schedule-warning-${project.id}`,
          type: 'warning',
          title: 'Schedule Monitoring Required',
          description: `Project progress (${project.progress_percentage}%) needs acceleration to meet deadline in ${daysUntilDeadline} days.`,
          impact: 'medium',
          projectId: project.id,
          projectName: project.name,
          category: 'schedule'
        });
      }
    }

    // Sustainability recommendations based on project type and phase
    if (['sustainable_green', 'new_construction', 'mixed_use'].includes(project.project_type) && 
        ['concept', 'design'].includes(project.current_phase)) {
      generatedInsights.push({
        id: `sustainability-${project.id}`,
        type: 'recommendation',
        title: 'Green Building Certification Opportunity',
        description: `Perfect timing to integrate ${template.certifications.map(c => c.type.toUpperCase()).join(' or ')} certification. Early integration reduces costs by 15-20%.`,
        impact: 'medium',
        projectId: project.id,
        projectName: project.name,
        category: 'sustainability',
        actionable: true
      });
    }

    // Quality & compliance recommendations
    if (project.current_phase === 'execution' && tasks.length > 0) {
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const totalTasks = tasks.length;
      const taskCompletionRate = (completedTasks / totalTasks) * 100;
      
      if (taskCompletionRate < project.progress_percentage - 10) {
        generatedInsights.push({
          id: `quality-${project.id}`,
          type: 'warning',
          title: 'Task Completion Lag',
          description: `Task completion rate (${taskCompletionRate.toFixed(1)}%) is lagging behind project progress (${project.progress_percentage}%). Review task dependencies.`,
          impact: 'medium',
          projectId: project.id,
          projectName: project.name,
          category: 'quality'
        });
      }
    }

    // Budget optimization (placeholder - would integrate with real budget data)
    if (project.budget && project.progress_percentage > 25) {
      generatedInsights.push({
        id: `budget-${project.id}`,
        type: 'optimization',
        title: 'Budget Performance Review',
        description: `At ${project.progress_percentage}% completion, review budget allocation vs actual spend. Consider reallocating contingency funds.`,
        impact: 'medium',
        projectId: project.id,
        projectName: project.name,
        category: 'budget'
      });
    }

    // Add fallback general recommendations if no specific insights
    if (generatedInsights.length === 0) {
      generatedInsights.push({
        id: 'general-1',
        type: 'recommendation',
        title: 'Project Health Check',
        description: 'Your project appears to be on track. Consider scheduling regular stakeholder reviews and progress assessments.',
        impact: 'low',
        projectId: project.id,
        projectName: project.name,
        category: 'quality'
      });
    }

    // Sort by impact and limit to top insights
    const sortedInsights = generatedInsights
      .sort((a, b) => {
        const impactOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        return impactOrder[b.impact] - impactOrder[a.impact];
      })
      .slice(0, 5);

    setInsights(sortedInsights);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'optimization':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'recommendation':
        return <Lightbulb className="h-4 w-4 text-blue-600" />;
      case 'certification':
        return <Award className="h-4 w-4 text-purple-600" />;
      case 'phase_guidance':
        return <Target className="h-4 w-4 text-orange-600" />;
      default:
        return <Bot className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'schedule':
        return <Calendar className="h-3 w-3" />;
      case 'budget':
        return <TrendingUp className="h-3 w-3" />;
      case 'quality':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'sustainability':
        return <Star className="h-3 w-3" />;
      case 'compliance':
        return <Award className="h-3 w-3" />;
      case 'resources':
        return <Circle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    if (!selectedProject) {
      return "Please select a project first so I can provide more specific assistance.";
    }

    try {
      // Fetch comprehensive project context from APIs
      console.log('🔍 Fetching comprehensive project context...');
      const comprehensiveContext = await geminiService.fetchComprehensiveProjectContext(selectedProject.id);
      
      if (!comprehensiveContext) {
        console.log('⚠️ Could not fetch comprehensive context, using basic context');
        // Fallback to basic project context if comprehensive fetch fails
        const basicContext: ProjectContext = {
          id: selectedProject.id,
          name: selectedProject.name,
          type: selectedProject.project_type,
          phase: selectedProject.current_phase,
          progress: selectedProject.progress_percentage,
          budget: selectedProject.budget,
          expectedCompletion: selectedProject.expected_completion_date,
          location: selectedProject.location,
          // description: selectedProject.description, // Commented out as it doesn't exist on ProjectData
          status: selectedProject.status,
          certifications: projectDetails?.certifications || [],
          tasks: projectDetails?.tasks || [],
          teamMembers: projectDetails?.teamMembers || []
        };
        
        const response = await geminiService.generateResponse(userMessage, basicContext);
        return response;
      }

      console.log('✅ Using comprehensive project context with real data');
      // Use comprehensive context with all project data
      const response = await geminiService.generateResponse(userMessage, comprehensiveContext);
      return response;
      
    } catch (error) {
      console.error('❌ Error generating AI response:', error);
      
      // Enhanced fallback with more context-aware responses
      const template = getProjectTemplate(selectedProject.project_type);
      const message = userMessage.toLowerCase();
      
      if (message.includes('certification')) {
        const certTypes = template.certifications.map(c => c.type.toUpperCase()).join(', ') || 'LEED, BREEAM';
        const existingCerts = projectDetails?.certifications?.length || 0;
        return `For your **${selectedProject.name}** (${selectedProject.project_type.replace('_', ' ')}) project in the **${selectedProject.current_phase}** phase:

**Certification Recommendations:**
- Target certifications: ${certTypes}
- Current certifications: ${existingCerts} ${existingCerts === 1 ? 'certification' : 'certifications'} tracked
- At ${selectedProject.progress_percentage}% progress, this is ${selectedProject.progress_percentage < 30 ? 'an excellent time to integrate' : selectedProject.progress_percentage < 70 ? 'still a good time to implement' : 'late but still possible to add'} certification requirements

**Next Steps:**
1. Review certification requirements early to reduce costs by 15-20%
2. Integrate sustainable material selection now
3. Begin documentation and compliance tracking
4. Schedule certification consultant review

Would you like specific guidance on any of these certifications?`;
      }
      
      if (message.includes('schedule') || message.includes('timeline')) {
        const tasksCount = projectDetails?.tasks?.length || 0;
        return `**${selectedProject.name}** Schedule Analysis:

**Current Status:**
- Project progress: ${selectedProject.progress_percentage}%
- Current phase: ${selectedProject.current_phase.replace('_', ' ')}
- Tasks tracked: ${tasksCount} tasks
- Focus areas: ${template.ai_focus.slice(0, 3).join(', ')}

**Schedule Recommendations:**
1. **Critical Path Review**: Identify bottleneck activities in ${selectedProject.current_phase} phase
2. **Parallel Processing**: Run non-dependent tasks simultaneously
3. **Weekly Progress Reviews**: Track milestones against targets
4. **Early Warning System**: Flag potential delays before they impact completion

${selectedProject.expected_completion_date ? `Target completion: ${new Date(selectedProject.expected_completion_date).toLocaleDateString()}` : 'Set completion date for better tracking'}

Need specific scheduling help for any particular phase or task?`;
      }
      
      if (message.includes('team') || message.includes('resource')) {
        const teamSize = projectDetails?.teamMembers?.length || 0;
        return `**${selectedProject.name}** Team & Resource Analysis:

**Current Team:**
- Team size: ${teamSize} ${teamSize === 1 ? 'member' : 'members'}
- Project phase: ${selectedProject.current_phase.replace('_', ' ')}
- Key roles needed: ${template.emphasis.slice(0, 2).join(', ')}

**Resource Recommendations:**
1. Ensure ${template.emphasis.join(' and ')} expertise for ${selectedProject.project_type.replace('_', ' ')} projects
2. Consider team training on ${template.ai_focus.slice(0, 2).join(' and ')}
3. Plan resource allocation for upcoming phases
4. Review team capacity vs. project requirements

What specific team or resource challenges can I help you address?`;
      }
      
      return `I'm here to help with your **${selectedProject.name}** project! 

**Current Context:**
- Project: ${selectedProject.project_type.replace('_', ' ')} 
- Phase: ${selectedProject.current_phase.replace('_', ' ')}
- Progress: ${selectedProject.progress_percentage}%

**I can assist with:**
• **Certification Planning** - LEED, BREEAM, WELL, and other standards
• **Schedule Optimization** - Critical path analysis and timeline management  
• **Budget Management** - Cost control and value engineering
• **Quality Assurance** - Standards compliance and inspection planning
• **Risk Management** - Identifying and mitigating project risks
• **Team Coordination** - Resource allocation and communication

What specific aspect would you like to explore for the **${selectedProject.current_phase.replace('_', ' ')}** phase?`;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date(),
      projectContext: selectedProject ? {
        projectId: selectedProject.id,
        projectName: selectedProject.name,
        phase: selectedProject.current_phase,
        progress: selectedProject.progress_percentage
      } : undefined
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      const aiResponse = await generateAIResponse(userMessage.content);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        isUser: false,
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'I apologize, but I\'m experiencing some technical difficulties. Please try again in a moment.',
        isUser: false,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInsightClick = (insight: AIInsight) => {
    if (insight.projectId) {
      window.location.href = `/projects/${insight.projectId}`;
    }
  };

  const handleInsightChat = (insight: AIInsight) => {
    const contextMessage = `Tell me more about: ${insight.title} - ${insight.description}`;
    setInputMessage(contextMessage);
  };

  return (
    <div className="h-[600px] w-full">
      <ResizablePanelGroup direction="horizontal" className="rounded-lg border">
        {/* AI Chat Panel */}
        <ResizablePanel defaultSize={45} minSize={30}>
          <Card className="h-full border-0 rounded-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="bg-primary/20 p-2 rounded-lg">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                AI Assistant
                {selectedProject && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedProject.name}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(100%-80px)] p-4 gap-3">
              {/* Chat Messages */}
              <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] p-3 rounded-lg text-sm ${
                          message.isUser
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {message.isUser ? (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        ) : (
                          <div 
                            className="ai-message-content prose prose-sm max-w-none prose-headings:mt-3 prose-headings:mb-2 prose-p:mb-2 prose-li:mb-1 prose-strong:text-foreground" 
                            dangerouslySetInnerHTML={{ __html: message.content }}
                          />
                        )}
                        <p className={`text-xs mt-1 opacity-70 ${
                          message.isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted p-3 rounded-lg text-sm flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>AI is thinking...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>
              
              {/* Input Area */}
              <div className="flex gap-2">
                <Input
                  placeholder={`Ask about ${selectedProject?.name || 'your project'}...`}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* Insights Panel */}
        <ResizablePanel defaultSize={55} minSize={40}>
          <Card className="h-full border-0 rounded-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="bg-blue-500/20 p-2 rounded-lg">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                </div>
                Smart Insights
                {selectedProject && (
                  <Badge variant="outline" className="text-xs">
                    {selectedProject.current_phase.charAt(0).toUpperCase() + selectedProject.current_phase.slice(1)}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ScrollArea className="h-[calc(100%-40px)]">
                {selectedProject ? (
                  <div className="space-y-4">
                    {/* Project Context */}
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <h3 className="font-medium text-sm mb-2">{selectedProject.name}</h3>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {selectedProject.current_phase.replace('_', ' ')}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {selectedProject.progress_percentage}%
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {selectedProject.project_type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Insights List */}
                    {insights.length > 0 ? (
                      insights.map((insight) => (
                        <div
                          key={insight.id}
                          className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {getInsightIcon(insight.type)}
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-sm font-medium leading-tight">{insight.title}</h4>
                                <Badge className={`text-xs shrink-0 ${getImpactColor(insight.impact)}`}>
                                  {insight.impact.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {insight.description}
                              </p>
                              
                              {/* Metadata */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {insight.category && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      {getCategoryIcon(insight.category)}
                                      <span>{insight.category}</span>
                                    </div>
                                  )}
                                  {insight.actionable && (
                                    <Badge variant="outline" className="text-xs">
                                      Actionable
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => handleInsightChat(insight)}
                                  >
                                    <Bot className="h-3 w-3 mr-1" />
                                    Ask AI
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2"
                                    onClick={() => handleInsightClick(insight)}
                                  >
                                    <ChevronRight className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Certification Progress */}
                              {insight.certificationInfo && (
                                <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium">{insight.certificationInfo.type.toUpperCase()} Progress</span>
                                    <span>{insight.certificationInfo.progress}%</span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-1.5">
                                    <div
                                      className="bg-primary h-1.5 rounded-full transition-all duration-500"
                                      style={{ width: `${insight.certificationInfo.progress}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No insights available</p>
                        <p className="text-xs">Select a project to see AI recommendations</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Select a project to view insights</p>
                    <p className="text-xs">AI will provide project-specific recommendations</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default ProjectSpecificAIInsights;