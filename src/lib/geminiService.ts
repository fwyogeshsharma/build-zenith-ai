interface GeminiConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
}

interface ProjectContext {
  id: string;
  name: string;
  type: string;
  phase: string;
  progress: number;
  budget?: number;
  expectedCompletion?: string;
  location?: string;
  description?: string;
  status?: string;
  startDate?: string;
  
  // Enhanced context data
  certifications?: any[];
  tasks?: any[];
  teamMembers?: any[];
  documents?: any[];
  projectPhases?: any[];
  projectMetrics?: any[];
  progressEntries?: any[];
  recentActivities?: any[];
  
  // Computed insights
  stats?: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    teamSize: number;
    documentsCount: number;
    certificationsCount: number;
    activeCertifications: number;
    completedCertifications: number;
    averageTaskProgress: number;
    budgetUtilization: number;
    scheduleHealth: 'on_track' | 'at_risk' | 'delayed';
    phaseCompletionRate: number;
  };
}

interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface GeminiRequest {
  contents: GeminiMessage[];
  generationConfig?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
  };
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[];
    };
  }[];
}

class GeminiService {
  private config: GeminiConfig;
  private conversationHistory: GeminiMessage[] = [];

  constructor() {
    this.config = {
      apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
      model: 'gemini-1.5-flash-latest',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta'
    };
  }

  async fetchComprehensiveProjectContext(projectId: string): Promise<ProjectContext | null> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      console.log('🔍 Fetching comprehensive project context for:', projectId);
      
      // Fetch all project-related data in parallel
      const [
        projectResult,
        tasksResult,
        certificationsResult,
        teamMembersResult,
        documentsResult,
        projectPhasesResult,
        projectMetricsResult,
        progressEntriesResult,
        activitiesResult
      ] = await Promise.all([
        // Basic project info
        supabase.from('projects').select('*').eq('id', projectId).single(),
        
        // Tasks with comprehensive details
        supabase.from('tasks').select(`
          *,
          certificate:certificate_id(type, target_level, current_status)
        `).eq('project_id', projectId),
        
        // Certifications with requirements
        supabase.from('certifications').select(`
          *,
          certificate_requirements(*)
        `).eq('project_id', projectId),
        
        // Team members with profiles
        supabase.from('project_team_members').select(`
          *,
          profiles:user_id(first_name, last_name, company, role, avatar_url)
        `).eq('project_id', projectId),
        
        // Documents
        supabase.from('documents').select('*').eq('project_id', projectId),
        
        // Project phases
        supabase.from('project_phases').select('*').eq('project_id', projectId),
        
        // Project metrics
        supabase.from('project_metrics').select('*').eq('project_id', projectId),
        
        // Progress entries
        supabase.from('progress_entries').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(10),
        
        // Recent activities
        supabase.from('activities').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(10)
      ]);

      if (projectResult.error || !projectResult.data) {
        console.error('❌ Failed to fetch project:', projectResult.error);
        return null;
      }

      const project = projectResult.data;
      const tasks = tasksResult.data || [];
      const certifications = certificationsResult.data || [];
      const teamMembers = teamMembersResult.data || [];
      const documents = documentsResult.data || [];
      const phases = projectPhasesResult.data || [];
      const metrics = projectMetricsResult.data || [];
      const progressEntries = progressEntriesResult.data || [];
      const activities = activitiesResult.data || [];

      // Calculate comprehensive stats
      const now = new Date();
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const pendingTasks = tasks.filter(t => t.status === 'pending').length;
      const overdueTasks = tasks.filter(t => 
        t.due_date && new Date(t.due_date) < now && t.status !== 'completed'
      ).length;
      
      const activeCertifications = certifications.filter(c => c.current_status === 'in_progress').length;
      const completedCertifications = certifications.filter(c => c.current_status === 'achieved').length;
      
      const averageTaskProgress = tasks.length > 0 
        ? tasks.reduce((sum, t) => sum + (t.progress_percentage || 0), 0) / tasks.length 
        : 0;

      const budgetUtilization = phases.length > 0 
        ? phases.reduce((sum, p) => sum + (p.actual_cost || 0), 0) / phases.reduce((sum, p) => sum + (p.budget || 1), 1) * 100
        : 0;

      let scheduleHealth: 'on_track' | 'at_risk' | 'delayed' = 'on_track';
      if (project.expected_completion_date) {
        const daysUntilDeadline = Math.ceil(
          (new Date(project.expected_completion_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        const progressRatio = project.progress_percentage / 100;
        const timeRatio = daysUntilDeadline < 0 ? 1 : (1 - daysUntilDeadline / 365); // Rough calculation
        
        if (progressRatio < timeRatio - 0.2) {
          scheduleHealth = 'delayed';
        } else if (progressRatio < timeRatio - 0.1) {
          scheduleHealth = 'at_risk';
        }
      }

      const phaseCompletionRate = phases.length > 0 
        ? phases.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / phases.length 
        : project.progress_percentage;

      const comprehensiveContext: ProjectContext = {
        id: project.id,
        name: project.name,
        type: project.project_type,
        phase: project.current_phase,
        progress: project.progress_percentage || 0,
        budget: project.budget,
        expectedCompletion: project.expected_completion_date,
        location: project.location,
        description: project.description,
        status: project.status,
        startDate: project.start_date,
        
        // Enhanced data
        certifications,
        tasks,
        teamMembers,
        documents,
        projectPhases: phases,
        projectMetrics: metrics,
        progressEntries,
        recentActivities: activities,
        
        // Computed stats
        stats: {
          totalTasks: tasks.length,
          completedTasks,
          pendingTasks,
          overdueTasks,
          teamSize: teamMembers.length,
          documentsCount: documents.length,
          certificationsCount: certifications.length,
          activeCertifications,
          completedCertifications,
          averageTaskProgress,
          budgetUtilization,
          scheduleHealth,
          phaseCompletionRate
        }
      };

      console.log('✅ Comprehensive project context fetched:', {
        projectName: project.name,
        tasksCount: tasks.length,
        certificationsCount: certifications.length,
        teamSize: teamMembers.length,
        documentsCount: documents.length
      });

      return comprehensiveContext;
    } catch (error) {
      console.error('❌ Error fetching comprehensive project context:', error);
      return null;
    }
  }

  private buildSystemPrompt(projectContext?: ProjectContext): string {
    const basePrompt = `You are an AI assistant specialized in construction project management and engineering. You provide expert advice on:

    - Project planning and scheduling
    - Building certifications (LEED, BREEAM, IGBC, WELL, etc.)
    - Construction phases and methodologies  
    - Budget optimization and cost management
    - Quality control and compliance
    - Sustainability and green building practices
    - Team coordination and resource allocation
    - Risk management and mitigation strategies

    Guidelines:
    - Provide specific, actionable advice based on real project data
    - Reference industry standards and best practices
    - Consider actual project constraints, timelines, and current status
    - Suggest concrete next steps that address current project needs
    - Be concise but comprehensive, focusing on high-impact recommendations
    - Use technical terms appropriately but explain when needed
    - Highlight urgent issues and opportunities based on project data
    
    Response Format Requirements:
    - ALWAYS provide responses in structured, pointwise format
    - Use **bold** for section headings and key terms
    - Use numbered lists for sequential actions/steps
    - Use bullet points for related items and recommendations
    - Structure ALL responses with clear sections like:
      * "**Urgent Issues & Immediate Actions:**"
      * "**Current Status Analysis:**"
      * "**Opportunities:**"
      * "**Next Steps (Timeline):**"
      * "**Key Recommendations:**"
    - Each point should be concise and actionable
    - Use "**Actionable Step:**" to highlight specific actions with deadlines
    - Use "**Week X-Y:**" format for timeline items
    - Break down complex information into digestible bullet points
    - Avoid long paragraphs - use lists and structured points instead
    - Always organize information hierarchically with main points and sub-points`;

    if (projectContext) {
      let contextPrompt = `${basePrompt}

## CURRENT PROJECT CONTEXT

### Project Overview
- **Project**: ${projectContext.name}${projectContext.description ? ` - ${projectContext.description}` : ''}
- **Type**: ${projectContext.type.replace('_', ' ')}
- **Current Phase**: ${projectContext.phase.replace('_', ' ')}
- **Status**: ${projectContext.status || 'active'}
- **Overall Progress**: ${projectContext.progress}%${projectContext.location ? `
- **Location**: ${projectContext.location}` : ''}${projectContext.budget ? `
- **Budget**: $${projectContext.budget.toLocaleString()}` : ''}${projectContext.startDate ? `
- **Start Date**: ${new Date(projectContext.startDate).toLocaleDateString()}` : ''}${projectContext.expectedCompletion ? `
- **Expected Completion**: ${new Date(projectContext.expectedCompletion).toLocaleDateString()}` : ''}`;

      if (projectContext.stats) {
        const stats = projectContext.stats;
        contextPrompt += `

### Project Statistics
- **Tasks**: ${stats.totalTasks} total (${stats.completedTasks} completed, ${stats.pendingTasks} pending${stats.overdueTasks > 0 ? `, ${stats.overdueTasks} overdue` : ''})
- **Team Size**: ${stats.teamSize} members
- **Certifications**: ${stats.certificationsCount} total (${stats.activeCertifications} in progress, ${stats.completedCertifications} achieved)
- **Documents**: ${stats.documentsCount} files
- **Schedule Health**: ${stats.scheduleHealth.replace('_', ' ')}${stats.averageTaskProgress > 0 ? `
- **Average Task Progress**: ${stats.averageTaskProgress.toFixed(1)}%` : ''}${stats.budgetUtilization > 0 ? `
- **Budget Utilization**: ${stats.budgetUtilization.toFixed(1)}%` : ''}
- **Phase Completion Rate**: ${stats.phaseCompletionRate.toFixed(1)}%`;
      }

      if (projectContext.certifications && projectContext.certifications.length > 0) {
        contextPrompt += `

### Active Certifications`;
        projectContext.certifications.forEach(cert => {
          contextPrompt += `
- **${cert.type.toUpperCase()}** ${cert.target_level ? `(${cert.target_level})` : ''}: ${cert.current_status}${cert.progress_percentage ? ` - ${cert.progress_percentage}% complete` : ''}${cert.expected_date ? ` (target: ${new Date(cert.expected_date).toLocaleDateString()})` : ''}`;
        });
      }

      if (projectContext.tasks && projectContext.tasks.length > 0) {
        const urgentTasks = projectContext.tasks.filter(t => 
          t.due_date && new Date(t.due_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && t.status !== 'completed'
        ).slice(0, 5);
        
        if (urgentTasks.length > 0) {
          contextPrompt += `

### Urgent Tasks (Due Within 7 Days)`;
          urgentTasks.forEach(task => {
            contextPrompt += `
- **${task.title}**: ${task.status} (Due: ${new Date(task.due_date).toLocaleDateString()})${task.progress_percentage ? ` - ${task.progress_percentage}% complete` : ''}`;
          });
        }

        const currentPhaseTasks = projectContext.tasks.filter(t => t.phase === projectContext.phase && t.status !== 'completed').slice(0, 5);
        if (currentPhaseTasks.length > 0) {
          contextPrompt += `

### Current Phase (${projectContext.phase.replace('_', ' ')}) Active Tasks`;
          currentPhaseTasks.forEach(task => {
            contextPrompt += `
- **${task.title}**: ${task.status}${task.progress_percentage ? ` - ${task.progress_percentage}% complete` : ''}${task.assigned_to ? ` (Assigned to: ${task.assigned_to})` : ''}`;
          });
        }
      }

      if (projectContext.teamMembers && projectContext.teamMembers.length > 0) {
        const roles = [...new Set(projectContext.teamMembers.map(tm => tm.role))];
        contextPrompt += `

### Team Composition
- **Roles**: ${roles.join(', ')}`;
      }

      if (projectContext.recentActivities && projectContext.recentActivities.length > 0) {
        contextPrompt += `

### Recent Project Activity`;
        projectContext.recentActivities.slice(0, 3).forEach(activity => {
          contextPrompt += `
- **${activity.activity_type}**: ${activity.title} (${new Date(activity.created_at).toLocaleDateString()})`;
        });
      }

      contextPrompt += `

## INSTRUCTIONS
Focus your responses on this specific project context. When providing advice:
1. Reference actual project data and current status
2. Address specific project challenges based on the data above
3. Provide actionable recommendations considering the current phase and progress
4. Highlight any urgent issues or opportunities you identify
5. Consider the project type, team composition, and certification goals
6. Be specific about timelines and next steps based on current project state`;

      return contextPrompt;
    }

    return basePrompt;
  }

  private buildRequestPayload(userMessage: string, projectContext?: ProjectContext): GeminiRequest {
    // Add system context as the first message if this is the start of conversation
    if (this.conversationHistory.length === 0) {
      this.conversationHistory.push({
        role: 'model',
        parts: [{ text: this.buildSystemPrompt(projectContext) }]
      });
    }

    // Add user message
    const userGeminiMessage: GeminiMessage = {
      role: 'user',
      parts: [{ text: userMessage }]
    };

    const requestPayload: GeminiRequest = {
      contents: [...this.conversationHistory, userGeminiMessage],
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1000
      }
    };

    return requestPayload;
  }

  async generateResponse(userMessage: string, projectContext?: ProjectContext): Promise<string> {
    if (!this.config.apiKey) {
      console.error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY environment variable.');
      return this.getFallbackResponse(userMessage, projectContext);
    }

    console.log('🤖 Gemini API Request initiated with API key:', this.config.apiKey.substring(0, 10) + '...');

    try {
      const requestPayload = this.buildRequestPayload(userMessage, projectContext);
      
      console.log('📤 Sending request to Gemini API:', {
        url: `${this.config.baseUrl}/models/${this.config.model}:generateContent`,
        payload: { 
          contents: requestPayload.contents.length + ' messages',
          config: requestPayload.generationConfig
        }
      });

      const response = await fetch(
        `${this.config.baseUrl}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestPayload)
        }
      );

      console.log('📥 Gemini API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Gemini API Error Response:', errorData);
        throw new Error(`Gemini API request failed: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data: GeminiResponse = await response.json();
      console.log('✅ Gemini API Success - Response received');
      
      if (!data.candidates || data.candidates.length === 0) {
        console.error('❌ No candidates in Gemini response:', data);
        throw new Error('No response generated by Gemini');
      }

      const aiResponse = data.candidates[0].content.parts[0].text;
      console.log('🎯 AI Response generated successfully, length:', aiResponse.length);

      // Update conversation history
      this.conversationHistory.push({
        role: 'user',
        parts: [{ text: userMessage }]
      });
      
      this.conversationHistory.push({
        role: 'model',
        parts: [{ text: aiResponse }]
      });

      // Keep conversation history manageable (last 10 exchanges)
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = [
          this.conversationHistory[0], // Keep system prompt
          ...this.conversationHistory.slice(-18) // Keep last 18 messages (9 exchanges)
        ];
      }

      // Format the response for better HTML rendering
      const formattedResponse = this.formatResponseToHTML(aiResponse);
      return formattedResponse;
    } catch (error) {
      console.error('❌ Gemini API Error:', error);
      console.log('🔄 Falling back to template-based responses');
      
      // Fallback to basic responses if API fails
      const fallbackResponse = this.getFallbackResponse(userMessage, projectContext);
      return this.formatResponseToHTML(fallbackResponse);
    }
  }

  private formatResponseToHTML(text: string): string {
    let formatted = text;

    // Convert **bold** to <strong> tags
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>');

    // Convert *italic* to <em> tags  
    formatted = formatted.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em class="italic">$1</em>');

    // Convert headers with ## to <h3> tags
    formatted = formatted.replace(/^## (.*$)/gim, '<h3 class="text-lg font-bold text-foreground mt-6 mb-3 border-b border-border pb-1">$1</h3>');

    // Convert headers with ### to <h4> tags
    formatted = formatted.replace(/^### (.*$)/gim, '<h4 class="text-base font-semibold text-foreground mt-4 mb-2">$1</h4>');

    // Handle specific sections with better styling
    formatted = formatted.replace(/\*\*Urgent Issues & Immediate Actions:\*\*/g, 
      '<div class="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-400 p-4 mb-4 rounded-r-lg"><h3 class="text-lg font-bold text-red-800 dark:text-red-200 mb-3 flex items-center gap-2"><span class="text-xl">🚨</span>Urgent Issues & Immediate Actions</h3>');
    
    formatted = formatted.replace(/\*\*Current Status Analysis:\*\*/g, 
      '</div><div class="bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-400 p-4 mb-4 rounded-r-lg"><h3 class="text-lg font-bold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2"><span class="text-xl">📊</span>Current Status Analysis</h3>');
    
    formatted = formatted.replace(/\*\*Opportunities:\*\*/g, 
      '</div><div class="bg-green-50 dark:bg-green-950/30 border-l-4 border-green-400 p-4 mb-4 rounded-r-lg"><h3 class="text-lg font-bold text-green-800 dark:text-green-200 mb-3 flex items-center gap-2"><span class="text-xl">💡</span>Opportunities</h3>');
    
    formatted = formatted.replace(/\*\*Next Steps \(Timeline\):\*\*/g, 
      '</div><div class="bg-purple-50 dark:bg-purple-950/30 border-l-4 border-purple-400 p-4 mb-4 rounded-r-lg"><h3 class="text-lg font-bold text-purple-800 dark:text-purple-200 mb-3 flex items-center gap-2"><span class="text-xl">📅</span>Next Steps (Timeline)</h3>');
    
    formatted = formatted.replace(/\*\*Key Recommendations:\*\*/g, 
      '</div><div class="bg-yellow-50 dark:bg-yellow-950/30 border-l-4 border-yellow-400 p-4 mb-4 rounded-r-lg"><h3 class="text-lg font-bold text-yellow-800 dark:text-yellow-200 mb-3 flex items-center gap-2"><span class="text-xl">⭐</span>Key Recommendations</h3>');

    // Convert numbered lists with enhanced styling for better pointwise display
    formatted = formatted.replace(/^\d+\.\s+(.*)$/gim, '<li class="mb-3 pl-2 py-1 border-l-2 border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 rounded-r px-3 text-sm">$1</li>');
    formatted = formatted.replace(/(<li class="mb-3 pl-2 py-1 border-l-2 border-gray-200 dark:border-gray-700 bg-gray-50\/50 dark:bg-gray-800\/30 rounded-r px-3 text-sm">.*<\/li>\s*)+/gs, '<ol class="list-decimal list-inside space-y-1 mb-4 pl-2">$&</ol>');

    // Convert bullet points with enhanced styling for better pointwise display
    formatted = formatted.replace(/^[•*-]\s+(.*)$/gim, '<li class="mb-2 pl-2 py-1 border-l-2 border-blue-200 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-800/20 rounded-r px-3 text-sm flex items-start gap-2"><span class="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span><span>$1</span></li>');
    formatted = formatted.replace(/(<li class="mb-2 pl-2 py-1 border-l-2 border-blue-200 dark:border-blue-700 bg-blue-50\/50 dark:bg-blue-800\/20 rounded-r px-3 text-sm flex items-start gap-2">.*<\/li>\s*(?:\n|$))+/gs, '<ul class="space-y-1 mb-4">$&</ul>');

    // Handle "Actionable Step:" with special formatting
    formatted = formatted.replace(/\*\*Actionable Step:\*\*/g, 
      '<div class="bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg p-3 mb-2"><strong class="inline-flex items-center gap-2 text-orange-700 dark:text-orange-300 font-semibold text-sm"><span class="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0"></span>Actionable Step:</strong><span class="ml-5 text-sm">');

    // Close actionable step divs (look for the next strong element or end of line)
    formatted = formatted.replace(/(<div class="bg-orange-100[^>]*>.*?<\/strong><span class="ml-5 text-sm">)(.*?)(?=<strong|$)/gs, '$1$2</span></div>');

    // Handle "Week X-Y:" timeline items
    formatted = formatted.replace(/\*\*Week (\d+(?:-\d+)?):\*\*/g, 
      '<div class="bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-2"><strong class="inline-flex items-center gap-2 text-blue-700 dark:text-blue-300 font-semibold text-sm"><span class="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></span>Week $1:</strong><span class="ml-5 text-sm">');

    // Close week timeline divs
    formatted = formatted.replace(/(<div class="bg-blue-100[^>]*>.*?<\/strong><span class="ml-5 text-sm">)(.*?)(?=<strong|<div class="bg-|$)/gs, '$1$2</span></div>');

    // Convert paragraphs
    const lines = formatted.split('\n');
    let inList = false;
    let inSpecialSection = false;
    
    formatted = lines.map((line, index) => {
      const trimmed = line.trim();
      
      // Check if we're entering or leaving special sections
      if (trimmed.includes('border-l-4')) {
        inSpecialSection = true;
        return line;
      }
      if (trimmed === '</div>' && inSpecialSection) {
        inSpecialSection = false;
        return line;
      }
      
      // Skip HTML tags and empty lines
      if (trimmed.startsWith('<') || trimmed === '') {
        inList = trimmed.includes('<ol') || trimmed.includes('<ul');
        return line;
      }
      
      // Don't wrap content that's already in lists or special sections
      if (inList || inSpecialSection) {
        return line;
      }
      
      // Regular paragraph
      return `<p class="mb-3 leading-relaxed text-sm">${trimmed}</p>`;
    }).join('\n');

    // Close any open special sections
    if (formatted.includes('border-l-4') && !formatted.endsWith('</div>')) {
      formatted += '</div>';
    }

    // Clean up extra spaces and line breaks
    formatted = formatted.replace(/\n\s*\n/g, '\n').trim();

    // Add container div with better styling
    formatted = `<div class="ai-response space-y-2 text-sm">${formatted}</div>`;

    return formatted;
  }

  private getFallbackResponse(userMessage: string, projectContext?: ProjectContext): string {
    const message = userMessage.toLowerCase();
    const projectType = projectContext?.type?.replace('_', ' ') || 'construction';
    const currentPhase = projectContext?.phase?.replace('_', ' ') || 'planning';
    
    if (message.includes('certification') || message.includes('leed') || message.includes('breeam')) {
      return `For ${projectType} projects in the ${currentPhase} phase, I recommend focusing on green building certifications. Key steps include:

1. **Early Integration**: Start certification planning now to reduce costs by 15-20%
2. **Energy Modeling**: Conduct detailed energy simulations
3. **Material Selection**: Choose sustainable, low-emission materials
4. **Documentation**: Begin gathering required compliance documents
5. **Team Training**: Ensure your team understands certification requirements

Would you like specific guidance on any of these areas?`;
    }
    
    if (message.includes('schedule') || message.includes('timeline') || message.includes('delay')) {
      return `For effective schedule management in ${currentPhase} phase of your ${projectType} project:

1. **Critical Path Analysis**: Identify bottleneck activities
2. **Parallel Processing**: Run non-dependent tasks simultaneously  
3. **Buffer Management**: Build in 10-15% schedule contingency
4. **Weekly Reviews**: Track progress against milestones
5. **Early Warning System**: Flag delays before they impact deadlines

Current progress at ${projectContext?.progress}% suggests ${projectContext?.progress < 50 ? 'accelerated planning needed' : 'good momentum - maintain focus'}.`;
    }
    
    if (message.includes('budget') || message.includes('cost') || message.includes('money')) {
      return `Budget optimization strategies for ${currentPhase} phase:

1. **Cost Tracking**: Monitor actual vs planned expenses weekly
2. **Value Engineering**: Review specifications for cost-effective alternatives
3. **Bulk Procurement**: Negotiate better rates for materials
4. **Waste Reduction**: Implement lean construction practices
5. **Contingency Management**: Reserve 10-15% for unforeseen costs

For ${projectType} projects, typical cost distribution: Design (15-20%), Construction (65-70%), Contingency (10-15%).`;
    }
    
    if (message.includes('quality') || message.includes('inspection') || message.includes('standard')) {
      return `Quality assurance for ${currentPhase} phase should include:

1. **Quality Plan**: Establish clear standards and checkpoints
2. **Regular Inspections**: Schedule frequent quality reviews
3. **Documentation**: Maintain detailed records of all work
4. **Training**: Ensure team understands quality requirements
5. **Corrective Actions**: Address issues immediately when found

Focus on prevention rather than correction to maintain schedule and budget.`;
    }
    
    return `I'm here to help with your ${projectContext?.name || projectType + ' project'}. As a construction project management AI, I can assist with:

• **Certification Planning** - LEED, BREEAM, WELL, and other standards
• **Schedule Optimization** - Critical path analysis and timeline management  
• **Budget Management** - Cost control and value engineering
• **Quality Assurance** - Standards compliance and inspection planning
• **Risk Management** - Identifying and mitigating project risks
• **Team Coordination** - Resource allocation and communication

What specific aspect would you like to explore? Feel free to ask about any challenges you're facing in the ${currentPhase} phase.`;
  }

  clearConversation(): void {
    this.conversationHistory = [];
  }

  getConversationLength(): number {
    return this.conversationHistory.length;
  }

  updateProjectContext(projectContext: ProjectContext): void {
    // Update the system prompt with new project context
    if (this.conversationHistory.length > 0) {
      this.conversationHistory[0] = {
        role: 'model',
        parts: [{ text: this.buildSystemPrompt(projectContext) }]
      };
    }
  }

  async testConnection(): Promise<boolean> {
    console.log('🧪 Testing Gemini API connection...');
    
    if (!this.config.apiKey) {
      console.error('❌ No API key configured');
      return false;
    }

    try {
      const testPayload = {
        contents: [{
          role: 'user' as const,
          parts: [{ text: 'Hello, can you confirm you are working?' }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 50
        }
      };

      const response = await fetch(
        `${this.config.baseUrl}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testPayload)
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Gemini API connection successful!');
        console.log('📝 Test response:', data.candidates?.[0]?.content?.parts?.[0]?.text || 'No text response');
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API connection failed:', response.status, errorData);
        return false;
      }
    } catch (error) {
      console.error('❌ API connection test error:', error);
      return false;
    }
  }
}

export const geminiService = new GeminiService();
export type { ProjectContext };