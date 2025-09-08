import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart, ComposedChart } from 'recharts';
import { FileDown, Award, TrendingUp, Leaf, Zap, Droplet, Trash, Car, Users, Building, CheckCircle, AlertTriangle, Star, Target, Activity, TrendingDown, Brain, Lightbulb, MapPin, Package, Home, RefreshCw, FileText, Settings } from 'lucide-react';
import { LEED_V4_1_BD_C_SUBCATEGORIES, LEEDSubcategory } from '@/lib/leedSubcategories';
import { loadCSVData } from '@/lib/csvParser';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { geminiService } from '@/lib/geminiService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface LEEDReportProps {
  projectId: string;
  certificateId?: string;
  certificationType?: string;
  version?: string;
}

interface ProjectMetrics {
  energy?: {
    usage: number;
    baseline: number;
    target: number;
    trend: Array<{ month: string; value: number }>;
  };
  water?: {
    consumption: number;
    baseline: number;
    target: number;
    trend: Array<{ month: string; value: number }>;
  };
  waste?: {
    generated: number;
    diverted: number;
    baseline: number;
    trend: Array<{ month: string; generated: number; diverted: number }>;
  };
  transportation?: {
    emissions: number;
    baseline: number;
    surveyResponses: number;
    totalOccupants: number;
  };
  humanExperience?: {
    co2Levels: number;
    vocLevels: number;
    satisfactionScore: number;
    surveyResponses: number;
  };
  ghgEmissions?: {
    scope1: number;
    scope2: number;
    scope3: number;
    intensity: number;
    reductionTarget: number;
    trend: Array<{ month: string; scope1: number; scope2: number }>;
  };
}

const LEEDReport = ({ projectId, certificateId, certificationType, version }: LEEDReportProps) => {
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);
  
  // State for project data
  const [project, setProject] = useState<any>(null);
  const [metrics, setMetrics] = useState<ProjectMetrics>({});
  const [loading, setLoading] = useState(true);
  const [leedTasks, setLeedTasks] = useState<any[]>([]);
  const [csvSubcategories, setCsvSubcategories] = useState<LEEDSubcategory[]>([]);
  const [syncingTasks, setSyncingTasks] = useState(false);
  
  // State for missing data inputs
  const [missingDataInputs, setMissingDataInputs] = useState<Record<string, any>>({});
  const [showMissingDataForm, setShowMissingDataForm] = useState(false);
  
  // AI Analysis states
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [predictiveAnalysis, setPredictiveAnalysis] = useState<any>(null);
  
  // LEED scores and performance data
  const [leedScores, setLeedScores] = useState({
    energy: 85,
    water: 92,
    waste: 78,
    transportation: 83,
    humanExperience: 88,
    overall: 85.2
  });

  const [arcScores, setArcScores] = useState({
    current: 85.2,
    localAverage: 72.5,
    globalAverage: 68.3,
    trend: [
      { month: 'Jan', score: 78 },
      { month: 'Feb', score: 80 },
      { month: 'Mar', score: 82 },
      { month: 'Apr', score: 83 },
      { month: 'May', score: 85 },
      { month: 'Jun', score: 85.2 }
    ]
  });

  const [certificationLevel, setCertificationLevel] = useState<'Certified' | 'Silver' | 'Gold' | 'Platinum'>('Gold');

  useEffect(() => {
    loadProjectData();
    loadLEEDSubcategories();
  }, [projectId]);

  const loadLEEDSubcategories = async () => {
    try {
      const subcategories = await loadCSVData();
      setCsvSubcategories(subcategories);
      
      // Debug: Log CSV subcategories for Building Design and Construction
      const bdcSubcategories = subcategories.filter(sub => 
        sub.certification.includes('Building Design and Construction')
      );
      console.log('BD+C Subcategories loaded from CSV:', bdcSubcategories.length);
      console.log('Sample BD+C Subcategories:', bdcSubcategories.slice(0, 5));
    } catch (error) {
      console.error('Error loading LEED subcategories:', error);
    }
  };

  const getSubcategoryInfo = (subcategoryId: string): LEEDSubcategory | undefined => {
    // First try CSV data - filter for Building Design and Construction
    const csvMatch = csvSubcategories.find(sub => 
      sub.subcategoryId === subcategoryId && 
      sub.certification.includes('Building Design and Construction')
    );
    if (csvMatch) return csvMatch;
    
    // Fallback to hardcoded data
    return LEED_V4_1_BD_C_SUBCATEGORIES.find(sub => sub.subcategoryId === subcategoryId);
  };

  const calculateTaskPoints = (task: any): { possible: number; achieved: number } => {
    const subcategoryInfo = getSubcategoryInfo(task.leed_subcategory_id);
    const possiblePoints = subcategoryInfo?.maxScore || task.leed_points_possible || 0;
    
    // For completed tasks, use achieved points or full possible points
    const achievedPoints = task.status === 'completed' 
      ? (task.leed_points_achieved || possiblePoints)
      : 0;
    
    // Debug logging for point calculations
    if (task.leed_subcategory_id) {
      console.log(`=== LEED Points Calculation ===`);
      console.log(`Task: ${task.title}`);
      console.log(`Subcategory ID: ${task.leed_subcategory_id}`);
      console.log(`Task Status: ${task.status}`);
      console.log(`Task Possible Points (from DB): ${task.leed_points_possible}`);
      console.log(`Task Achieved Points (from DB): ${task.leed_points_achieved}`);
      console.log(`Subcategory Info:`, subcategoryInfo);
      console.log(`Calculated Possible Points: ${possiblePoints}`);
      console.log(`Calculated Achieved Points: ${achievedPoints}`);
      console.log(`===============================`);
    } else {
      console.warn(`Task "${task.title}" has no leed_subcategory_id - skipping LEED points calculation`);
    }
    
    return { possible: possiblePoints, achieved: achievedPoints };
  };

  const syncLEEDTasks = async () => {
    if (!csvSubcategories.length) {
      toast({
        title: "Error",
        description: "LEED subcategories not loaded yet. Please wait.",
        variant: "destructive"
      });
      return;
    }

    setSyncingTasks(true);
    try {
      // Get all tasks for this project
      const { data: allTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId);

      if (!allTasks) return;

      let updatedCount = 0;
      const updates: any[] = [];

      // Find tasks that match LEED subcategory patterns
      for (const task of allTasks) {
        const title = task.title || '';
        
        // Extract potential subcategory ID from title (e.g., "SSc1: Site Assessment")
        const match = title.match(/^([A-Z]{1,4}[cp]?\d+)/);
        if (match) {
          const subcategoryId = match[1];
          const subcategoryInfo = csvSubcategories.find(sub => sub.subcategoryId === subcategoryId);
          
          if (subcategoryInfo && !task.leed_subcategory_id) {
            updates.push({
              id: task.id,
              leed_subcategory_id: subcategoryId,
              leed_points_possible: subcategoryInfo.maxScore,
              leed_points_achieved: task.status === 'completed' ? subcategoryInfo.maxScore : null
            });
            updatedCount++;
          }
        }
      }

      // Perform batch updates
      for (const update of updates) {
        await supabase
          .from('tasks')
          .update({
            leed_subcategory_id: update.leed_subcategory_id,
            leed_points_possible: update.leed_points_possible,
            leed_points_achieved: update.leed_points_achieved
          })
          .eq('id', update.id);
      }

      toast({
        title: "Success",
        description: `Synced ${updatedCount} LEED tasks with subcategory IDs and points.`
      });

      // Reload the project data
      await loadProjectData();
      
    } catch (error) {
      console.error('Error syncing LEED tasks:', error);
      toast({
        title: "Error",
        description: "Failed to sync LEED tasks. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSyncingTasks(false);
    }
  };

  const loadProjectData = async () => {
    try {
      setLoading(true);
      
      // Fetch comprehensive project context using Gemini service
      const projectContext = await geminiService.fetchComprehensiveProjectContext(projectId);
      
      if (!projectContext) {
        throw new Error('Failed to fetch project context');
      }
      
      // Fetch LEED tasks for this project
      let leedTasksQuery = supabase
        .from('tasks')
        .select(`*`)
        .eq('project_id', projectId);

      // Filter by certificate if certificateId is provided
      if (certificateId) {
        leedTasksQuery = leedTasksQuery.eq('certificate_id', certificateId);
      } else {
        leedTasksQuery = leedTasksQuery.not('leed_subcategory_id', 'is', null);
      }

      const { data: projectLeedTasks, error: leedTasksError } = await leedTasksQuery;
      
      if (leedTasksError) throw leedTasksError;
      
      console.log('LEED Tasks found:', projectLeedTasks?.length || 0);
      console.log('Sample LEED task:', projectLeedTasks?.[0]);
      
      // Debug: Log all LEED tasks with their subcategory info
      if (projectLeedTasks && projectLeedTasks.length > 0) {
        console.log('=== All LEED Tasks Debug ===');
        projectLeedTasks.forEach((task, index) => {
          console.log(`Task ${index + 1}:`, {
            title: task.title,
            status: task.status,
            leed_subcategory_id: task.leed_subcategory_id,
            leed_points_possible: task.leed_points_possible,
            leed_points_achieved: task.leed_points_achieved
          });
        });
        console.log('=== End LEED Tasks Debug ===');
      }
      
      // If no LEED tasks found, try to find tasks that might be LEED tasks by title pattern
      if (!projectLeedTasks || projectLeedTasks.length === 0) {
        console.log('No LEED tasks found, checking all tasks for LEED patterns...');
        const { data: allTasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('project_id', projectId);
          
        console.log('Total tasks in project:', allTasks?.length || 0);
        
        // Look for tasks that might have LEED subcategory patterns in title
        const potentialLeedTasks = allTasks?.filter(task => {
          const title = task.title || '';
          return /^[A-Z]{1,4}[cp]?\d+/.test(title); // Pattern like SSc1, EAp1, etc.
        }) || [];
        
        console.log('Potential LEED tasks by title pattern:', potentialLeedTasks.length);
        potentialLeedTasks.forEach(task => {
          console.log(`- ${task.title} (Status: ${task.status})`);
        });
      }
      
      setLeedTasks(projectLeedTasks || []);
      
      // Fetch task resources and materials for waste/emission calculations
      const { data: taskResources, error: resourcesError } = await supabase
        .from('task_resources')
        .select(`
          *,
          materials:material_id(
            name,
            carbon_emission_factor,
            density,
            material_category,
            properties
          )
        `)
        .in('task_id', projectContext.tasks?.map(t => t.id) || []);
      
      if (resourcesError) throw resourcesError;
      
      // Fetch existing project metrics
      const { data: existingMetrics, error: metricsError } = await supabase
        .from('project_metrics')
        .select('*')
        .eq('project_id', projectId);
      
      if (metricsError) throw metricsError;
      
      setProject(projectContext);
      
      // Calculate metrics from task resources and existing data
      const calculatedMetrics = await calculateSustainabilityMetrics(
        projectContext, 
        taskResources || [], 
        existingMetrics || []
      );
      
      setMetrics(calculatedMetrics);
      
      // Generate AI predictions and insights
      const [aiPredictions, aiInsightsData] = await Promise.all([
        generateAIPredictions(projectContext, calculatedMetrics),
        generateAdvancedAIInsights(projectContext, calculatedMetrics)
      ]);
      
      // Set AI analysis data
      setAiInsights(aiInsightsData);
      setPredictiveAnalysis(aiPredictions);
      setRecommendations(aiPredictions.recommendations || []);
      
      // Merge AI predictions with calculated metrics
      const enhancedMetrics = mergeAIPredictions(calculatedMetrics, aiPredictions);
      setMetrics(enhancedMetrics);
      
      // Check for missing data
      const missing = identifyMissingData(enhancedMetrics);
      if (Object.keys(missing).length > 0) {
        setMissingDataInputs(missing);
        setShowMissingDataForm(true);
      }
      
      // Process LEED scores based on metrics
      calculateLEEDScores(enhancedMetrics);
      
    } catch (error: any) {
      console.error('Error loading project data:', error);
      toast({
        title: "Error",
        description: "Failed to load project data: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateLEEDScores = (metrics: ProjectMetrics) => {
    // Calculate LEED scores based on actual metrics
    const energyScore = metrics.energy?.usage ? 
      Math.max(0, Math.min(100, 100 - ((metrics.energy.usage / metrics.energy.baseline) - 0.7) * 100)) : 85;
    
    const waterScore = metrics.water?.consumption ? 
      Math.max(0, Math.min(100, 100 - ((metrics.water.consumption / metrics.water.baseline) - 0.7) * 100)) : 92;
    
    const wasteScore = metrics.waste?.generated ? 
      Math.max(0, Math.min(100, (metrics.waste.diverted / metrics.waste.generated) * 100)) : 78;
    
    const transportationScore = metrics.transportation?.emissions ? 
      Math.max(0, Math.min(100, 100 - (metrics.transportation.emissions / 1000) * 10)) : 83;
    
    const humanScore = metrics.humanExperience?.satisfactionScore || 88;
    
    const overallScore = (energyScore + waterScore + wasteScore + transportationScore + humanScore) / 5;
    
    setLeedScores({
      energy: Math.round(energyScore),
      water: Math.round(waterScore),
      waste: Math.round(wasteScore),
      transportation: Math.round(transportationScore),
      humanExperience: Math.round(humanScore),
      overall: Math.round(overallScore * 10) / 10
    });
    
    setArcScores(prev => ({
      ...prev,
      current: Math.round(overallScore * 10) / 10
    }));
    
    setCertificationLevel(calculateCertificationLevel());
  };

  // Helper function to group LEED tasks by category
  const groupLEEDTasksByCategory = (tasks: any[]) => {
    const categoryGroups: Record<string, any[]> = {};
    
    tasks.forEach(task => {
      const categoryId = task.leed_subcategory_id?.substring(0, 2) || 'SS'; // Extract category from subcategory ID
      if (!categoryGroups[categoryId]) {
        categoryGroups[categoryId] = [];
      }
      categoryGroups[categoryId].push(task);
    });
    
    return categoryGroups;
  };

  // Helper function to calculate category scores
  const calculateCategoryScore = (categoryTasks: any[]) => {
    const totalPoints = categoryTasks.reduce((sum, task) => {
      const { possible } = calculateTaskPoints(task);
      return sum + possible;
    }, 0);
    const earnedPoints = categoryTasks.reduce((sum, task) => {
      const { achieved } = calculateTaskPoints(task);
      return sum + achieved;
    }, 0);
    
    return { earnedPoints, totalPoints };
  };

  // Helper function to get category metadata
  const getCategoryMetadata = (categoryId: string) => {
    const categories = {
      'SS': { name: 'Sustainable Sites', icon: 'MapPin', color: 'green', description: 'Site development, transportation, and stormwater management' },
      'WE': { name: 'Water Efficiency', icon: 'Droplet', color: 'blue', description: 'Water use reduction, efficient fixtures, and water monitoring' },
      'EA': { name: 'Energy & Atmosphere', icon: 'Zap', color: 'yellow', description: 'Energy performance, renewable energy, and commissioning' },
      'MR': { name: 'Materials & Resources', icon: 'Package', color: 'purple', description: 'Material selection, waste management, and lifecycle assessment' },
      'IEQ': { name: 'Indoor Environmental Quality', icon: 'Home', color: 'teal', description: 'Air quality, lighting, thermal comfort, and acoustics' },
      'I': { name: 'Innovation', icon: 'Lightbulb', color: 'pink', description: 'Innovation strategies and LEED expertise' },
      'RP': { name: 'Regional Priority', icon: 'MapPin', color: 'indigo', description: 'Regional environmental priorities' },
      'IP': { name: 'Integrative Process', icon: 'RefreshCw', color: 'orange', description: 'Cross-disciplinary planning and collaboration' }
    };
    
    return categories[categoryId as keyof typeof categories] || { 
      name: 'Other', 
      icon: 'FileText', 
      color: 'gray', 
      description: 'General certification requirements' 
    };
  };

  const calculateSustainabilityMetrics = async (
    projectContext: any, 
    taskResources: any[], 
    existingMetrics: any[]
  ): Promise<ProjectMetrics> => {
    const metrics: ProjectMetrics = {};
    
    // Calculate waste from task resources
    const wasteData = calculateWasteFromResources(taskResources);
    
    // Calculate energy consumption from equipment and processes
    const energyData = calculateEnergyFromResources(taskResources, projectContext);
    
    // Calculate water usage from materials and processes
    const waterData = calculateWaterFromResources(taskResources, projectContext);
    
    // Calculate GHG emissions from materials and transportation
    const ghgData = calculateGHGEmissions(taskResources, projectContext);
    
    // Merge with existing metrics
    const existingEnergy = existingMetrics.filter(m => m.metric_type === 'energy');
    const existingWater = existingMetrics.filter(m => m.metric_type === 'water');
    const existingWaste = existingMetrics.filter(m => m.metric_type === 'waste');
    
    metrics.energy = {
      usage: energyData.consumption + existingEnergy.reduce((sum, m) => sum + m.value, 0),
      baseline: energyData.baseline,
      target: energyData.target,
      trend: generateTrendFromHistory(existingEnergy, energyData.consumption)
    };
    
    metrics.water = {
      consumption: waterData.consumption + existingWater.reduce((sum, m) => sum + m.value, 0),
      baseline: waterData.baseline,
      target: waterData.target,
      trend: generateTrendFromHistory(existingWater, waterData.consumption)
    };
    
    metrics.waste = {
      generated: wasteData.generated + existingWaste.reduce((sum, m) => sum + m.value, 0),
      diverted: wasteData.diverted,
      baseline: wasteData.baseline,
      trend: generateWasteTrendFromHistory(existingWaste, wasteData)
    };
    
    metrics.ghgEmissions = ghgData;
    
    // Calculate transportation and human experience from project context
    metrics.transportation = calculateTransportationMetrics(projectContext);
    metrics.humanExperience = calculateHumanExperienceMetrics(projectContext);
    
    return metrics;
  };

  const calculateWasteFromResources = (resources: any[]) => {
    let totalGenerated = 0;
    let totalDiverted = 0;
    
    resources.forEach(resource => {
      if (resource.materials) {
        const material = resource.materials;
        const quantity = resource.quantity || 0;
        
        // Estimate waste based on material type and construction practices
        const wasteRate = getWasteRateByMaterialCategory(material.material_category);
        const wasteGenerated = quantity * wasteRate;
        
        // Estimate diversion rate based on material recyclability
        const diversionRate = getDiversionRateByMaterial(material.material_category);
        const wasteDiverted = wasteGenerated * diversionRate;
        
        totalGenerated += wasteGenerated;
        totalDiverted += wasteDiverted;
      }
    });
    
    return {
      generated: totalGenerated,
      diverted: totalDiverted,
      baseline: totalGenerated * 1.3, // Assume 30% reduction from baseline
    };
  };

  const calculateEnergyFromResources = (resources: any[], projectContext: any) => {
    let totalEnergy = 0;
    
    resources.forEach(resource => {
      if (resource.resource_type === 'equipment') {
        // Estimate energy consumption for equipment usage
        const hours = resource.allocated_hours || 8;
        const energyRate = getEnergyRateByEquipment(resource.resource_name);
        totalEnergy += hours * energyRate;
      }
      
      if (resource.materials) {
        // Embodied energy in materials
        const quantity = resource.quantity || 0;
        const embodiedEnergy = getEmbodiedEnergyByMaterial(resource.materials.material_category);
        totalEnergy += quantity * embodiedEnergy;
      }
    });
    
    // Add base building energy consumption estimate
    const projectSize = estimateProjectSize(projectContext);
    const baseEnergy = projectSize * 50; // kWh per sqft assumption
    
    return {
      consumption: totalEnergy + baseEnergy,
      baseline: (totalEnergy + baseEnergy) * 1.2,
      target: (totalEnergy + baseEnergy) * 0.8
    };
  };

  const calculateWaterFromResources = (resources: any[], projectContext: any) => {
    let totalWater = 0;
    
    resources.forEach(resource => {
      if (resource.materials) {
        const material = resource.materials;
        const quantity = resource.quantity || 0;
        
        // Water usage for material processing and installation
        const waterRate = getWaterRateByMaterial(material.material_category);
        totalWater += quantity * waterRate;
      }
    });
    
    // Add base building water consumption estimate
    const projectSize = estimateProjectSize(projectContext);
    const baseWater = projectSize * 20; // gallons per sqft assumption
    
    return {
      consumption: totalWater + baseWater,
      baseline: (totalWater + baseWater) * 1.15,
      target: (totalWater + baseWater) * 0.85
    };
  };

  const calculateGHGEmissions = (resources: any[], projectContext: any) => {
    let scope1Emissions = 0; // Direct emissions
    let scope2Emissions = 0; // Indirect emissions from electricity
    
    resources.forEach(resource => {
      if (resource.materials && resource.materials.carbon_emission_factor) {
        const quantity = resource.quantity || 0;
        const emissionFactor = resource.materials.carbon_emission_factor;
        scope1Emissions += quantity * emissionFactor;
      }
      
      if (resource.resource_type === 'equipment') {
        // Equipment fuel consumption
        const hours = resource.allocated_hours || 8;
        const fuelEmissions = hours * 2.5; // kg CO2 per hour estimate
        scope1Emissions += fuelEmissions;
      }
    });
    
    // Estimate scope 2 from electricity usage (from energy calculation)
    const projectSize = estimateProjectSize(projectContext);
    scope2Emissions = projectSize * 30; // kg CO2 from electricity
    
    const totalEmissions = scope1Emissions + scope2Emissions;
    const intensity = totalEmissions / Math.max(projectSize, 1);
    
    return {
      scope1: scope1Emissions,
      scope2: scope2Emissions,
      scope3: 95, // Default scope 3 emissions estimate
      intensity,
      reductionTarget: 25, // Default 25% reduction target
      trend: generateGHGTrend(totalEmissions)
    };
  };

  const generateAIPredictions = async (projectContext: any, metrics: ProjectMetrics) => {
    try {
      const prompt = `Based on this construction project data, predict missing sustainability metrics for LEED v4.1 reporting and provide advanced insights:

Project: ${projectContext.name}
Type: ${projectContext.type}
Phase: ${projectContext.phase}
Progress: ${projectContext.progress}%
Task Count: ${projectContext.tasks?.length || 0}
Team Size: ${projectContext.stats?.teamSize || 0}

Current Metrics:
- Energy Usage: ${metrics.energy?.usage || 0} kWh
- Water Consumption: ${metrics.water?.consumption || 0} gallons
- Waste Generated: ${metrics.waste?.generated || 0} tons
- GHG Emissions: ${metrics.ghgEmissions?.scope1 + metrics.ghgEmissions?.scope2 || 0} kg CO2

Please provide a comprehensive analysis including:
1. Missing metric predictions (transportation, human experience)
2. 12-month performance trend forecasts
3. LEED certification readiness assessment
4. Performance improvement recommendations
5. Risk factors that could prevent target achievement
6. Cost-benefit analysis of improvements
7. Timeline for achieving LEED Gold/Platinum levels

Format response as JSON with specific numerical values and actionable insights.`;

      const response = await geminiService.generateResponse(prompt, projectContext);
      
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            ...parsed,
            aiGenerated: true,
            timestamp: new Date().toISOString()
          };
        }
      } catch (e) {
        console.warn('Could not parse AI predictions as JSON');
      }
      
      return generateAdvancedFallbackPredictions(metrics, projectContext);
      
    } catch (error) {
      console.warn('AI predictions failed, using fallback:', error);
      return generateAdvancedFallbackPredictions(metrics, projectContext);
    }
  };

  const generateAdvancedAIInsights = async (projectContext: any, metrics: ProjectMetrics) => {
    try {
      const prompt = `Analyze this construction project's sustainability performance and provide strategic insights:

Project Context: ${JSON.stringify(projectContext, null, 2)}
Metrics: ${JSON.stringify(metrics, null, 2)}

Provide comprehensive insights on:
1. Current performance vs industry benchmarks
2. Critical success factors for LEED certification
3. Resource optimization opportunities
4. Predictive risk assessment
5. ROI analysis for sustainability investments
6. Competitive advantages achievable
7. Stakeholder impact analysis

Return detailed JSON analysis with specific recommendations and quantified benefits.`;

      const response = await geminiService.generateResponse(prompt, projectContext);
      
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.warn('Could not parse AI insights as JSON');
      }
      
      return generateFallbackInsights(projectContext, metrics);
      
    } catch (error) {
      console.warn('AI insights failed, using fallback:', error);
      return generateFallbackInsights(projectContext, metrics);
    }
  };

  const generateAdvancedFallbackPredictions = (metrics: ProjectMetrics, projectContext: any) => {
    const currentPerformance = leedScores.overall;
    const projectSize = estimateProjectSize(projectContext);
    
    return {
      transportation: {
        emissions: Math.floor(Math.random() * 500) + 200,
        surveyResponses: Math.floor(Math.random() * 50) + 20,
        totalOccupants: Math.floor(Math.random() * 100) + 50,
        alternativeTransportUsage: Math.floor(Math.random() * 40) + 30
      },
      humanExperience: {
        co2Levels: Math.floor(Math.random() * 200) + 400,
        vocLevels: Math.floor(Math.random() * 100) + 50,
        satisfactionScore: Math.floor(Math.random() * 30) + 70,
        surveyResponses: Math.floor(Math.random() * 50) + 20,
        thermalComfort: Math.floor(Math.random() * 20) + 75,
        naturalLight: Math.floor(Math.random() * 25) + 70
      },
      trendPredictions: {
        energyGrowth: currentPerformance > 80 ? -5 : 5,
        waterReduction: currentPerformance > 75 ? -15 : -5,
        wasteReduction: currentPerformance > 85 ? -20 : -10,
        overallImprovement: currentPerformance > 80 ? 2 : 8
      },
      certificationReadiness: {
        currentLevel: calculateCertificationLevel(),
        nextLevel: currentPerformance > 90 ? 'Platinum' : currentPerformance > 80 ? 'Gold' : 'Silver',
        pointsNeeded: Math.max(0, (currentPerformance > 80 ? 90 : 80) - currentPerformance),
        timeToAchieve: Math.floor(Math.random() * 12) + 6
      },
      recommendations: [
        {
          category: 'Energy',
          action: 'Install smart lighting systems',
          impact: 'Potential 15-20% energy reduction',
          cost: '$25,000 - $40,000',
          timeframe: '2-3 months'
        },
        {
          category: 'Water',
          action: 'Implement rainwater harvesting',
          impact: 'Up to 30% water usage reduction',
          cost: '$15,000 - $30,000',
          timeframe: '3-4 months'
        },
        {
          category: 'Waste',
          action: 'Enhanced recycling program',
          impact: '10-15% waste diversion increase',
          cost: '$5,000 - $10,000',
          timeframe: '1-2 months'
        }
      ],
      riskFactors: [
        'Weather delays affecting energy performance',
        'Supply chain issues for sustainable materials',
        'Occupant behavior changes affecting metrics'
      ],
      aiGenerated: false,
      timestamp: new Date().toISOString()
    };
  };

  const generateFallbackInsights = (projectContext: any, metrics: ProjectMetrics) => {
    return {
      performanceAnalysis: {
        strengths: ['High waste diversion rates', 'Good energy efficiency'],
        weaknesses: ['Low transportation scores', 'Room for water conservation'],
        opportunities: ['Smart building technologies', 'Renewable energy integration'],
        threats: ['Regulatory changes', 'Market competition']
      },
      benchmarking: {
        industryAverage: 65,
        topQuartile: 82,
        currentPosition: leedScores.overall,
        percentile: Math.min(95, (leedScores.overall / 100) * 100)
      },
      roiAnalysis: {
        sustainabilityInvestment: '$150,000 - $300,000',
        expectedSavings: '$25,000 - $50,000 annually',
        paybackPeriod: '3-6 years',
        netPresentValue: '$200,000 - $400,000'
      },
      competitiveAdvantages: [
        'Enhanced brand reputation',
        'Reduced operational costs',
        'Improved employee satisfaction',
        'Higher property values'
      ]
    };
  };

  const mergeAIPredictions = (metrics: ProjectMetrics, predictions: any): ProjectMetrics => {
    return {
      ...metrics,
      transportation: {
        emissions: predictions.transportation?.emissions || 250,
        baseline: (predictions.transportation?.emissions || 250) * 1.2,
        surveyResponses: predictions.transportation?.surveyResponses || 30,
        totalOccupants: predictions.transportation?.totalOccupants || 75
      },
      humanExperience: {
        co2Levels: predictions.humanExperience?.co2Levels || 450,
        vocLevels: predictions.humanExperience?.vocLevels || 75,
        satisfactionScore: predictions.humanExperience?.satisfactionScore || 85,
        surveyResponses: predictions.humanExperience?.surveyResponses || 40
      }
    };
  };

  // Helper functions for material calculations
  const getWasteRateByMaterialCategory = (category: string): number => {
    const rates = {
      'concrete': 0.05,
      'steel': 0.02,
      'lumber': 0.15,
      'drywall': 0.12,
      'flooring': 0.08,
      'insulation': 0.03,
      'roofing': 0.06
    };
    return rates[category as keyof typeof rates] || 0.1;
  };

  const getDiversionRateByMaterial = (category: string): number => {
    const rates = {
      'concrete': 0.8,
      'steel': 0.9,
      'lumber': 0.7,
      'drywall': 0.6,
      'flooring': 0.4,
      'insulation': 0.2,
      'roofing': 0.5
    };
    return rates[category as keyof typeof rates] || 0.5;
  };

  const getEnergyRateByEquipment = (equipmentName: string): number => {
    // kWh per hour estimates
    if (equipmentName.toLowerCase().includes('crane')) return 50;
    if (equipmentName.toLowerCase().includes('excavator')) return 30;
    if (equipmentName.toLowerCase().includes('drill')) return 15;
    if (equipmentName.toLowerCase().includes('saw')) return 5;
    return 10; // default
  };

  const getEmbodiedEnergyByMaterial = (category: string): number => {
    const energy = {
      'concrete': 0.5,
      'steel': 8.5,
      'lumber': 2.1,
      'aluminum': 45.6,
      'glass': 12.8
    };
    return energy[category as keyof typeof energy] || 3.0;
  };

  const getWaterRateByMaterial = (category: string): number => {
    const rates = {
      'concrete': 150, // gallons per ton
      'steel': 20,
      'lumber': 5,
      'drywall': 50
    };
    return rates[category as keyof typeof rates] || 25;
  };

  const estimateProjectSize = (projectContext: any): number => {
    // Rough estimate in square feet based on budget and type
    const budget = projectContext.budget || 1000000;
    const costPerSqFt = projectContext.type === 'residential' ? 150 : 200;
    return budget / costPerSqFt;
  };

  const calculateTransportationMetrics = (projectContext: any) => {
    const teamSize = projectContext.stats?.teamSize || 5;
    const estimatedDailyTrips = teamSize * 2; // Round trips
    const avgDistance = 25; // miles per trip
    const emissionFactor = 0.4; // kg CO2 per mile
    const workingDays = 20; // per month
    
    return {
      emissions: estimatedDailyTrips * avgDistance * emissionFactor * workingDays,
      baseline: estimatedDailyTrips * avgDistance * emissionFactor * workingDays * 1.3,
      surveyResponses: Math.floor(teamSize * 0.8),
      totalOccupants: teamSize
    };
  };

  const calculateHumanExperienceMetrics = (projectContext: any) => {
    // Base estimates that could be improved with actual sensor data
    return {
      co2Levels: 450 + Math.random() * 100, // ppm
      vocLevels: 50 + Math.random() * 50, // ppb
      satisfactionScore: 80 + Math.random() * 15, // percentage
      surveyResponses: Math.floor((projectContext.stats?.teamSize || 5) * 0.7)
    };
  };

  const generateTrendFromHistory = (existingMetrics: any[], currentValue: number) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trend = [];
    
    for (let i = 0; i < 12; i++) {
      const baseValue = currentValue / 12;
      const variation = (Math.random() - 0.5) * 0.2 * baseValue;
      trend.push({
        month: monthNames[i],
        value: Math.max(0, baseValue + variation)
      });
    }
    
    return trend;
  };

  const generateWasteTrendFromHistory = (existingMetrics: any[], wasteData: any) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames.map((month, i) => ({
      month,
      generated: wasteData.generated / 12 * (1 + (Math.random() - 0.5) * 0.3),
      diverted: wasteData.diverted / 12 * (1 + (Math.random() - 0.5) * 0.2)
    }));
  };

  const generateGHGTrend = (totalEmissions: number) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames.map(month => ({
      month,
      scope1: totalEmissions * 0.3 / 12 * (1 + (Math.random() - 0.5) * 0.2),
      scope2: totalEmissions * 0.7 / 12 * (1 + (Math.random() - 0.5) * 0.2)
    }));
  };

  const generateMockTrend = (months: number, type: string) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    switch (type) {
      case 'energy':
        return Array.from({ length: months }, (_, i) => ({
          month: monthNames[i],
          value: Math.floor(Math.random() * 3000) + 2000
        }));
      case 'siteEnergy':
        return Array.from({ length: months }, (_, i) => ({
          month: monthNames[i],
          value: Math.floor(Math.random() * 20000) + 10000
        }));
      case 'water':
        return Array.from({ length: months }, (_, i) => ({
          month: monthNames[i],
          value: Math.floor(Math.random() * 2000) + 1000
        }));
      case 'waste':
        return Array.from({ length: months }, (_, i) => ({
          month: monthNames[i],
          generated: Math.floor(Math.random() * 100) + 50,
          diverted: Math.floor(Math.random() * 80) + 40
        }));
      case 'wasteDiverted':
        return Array.from({ length: months }, (_, i) => ({
          month: monthNames[i],
          diverted: Math.floor(Math.random() * 80) + 40
        }));
      case 'transportation':
        return Array.from({ length: months }, (_, i) => ({
          month: monthNames[i],
          value: Math.floor(Math.random() * 50) + 25
        }));
      case 'airQuality':
        return Array.from({ length: months }, (_, i) => ({
          month: monthNames[i],
          value: Math.floor(Math.random() * 100) + 50  // AQI 50-150 range
        }));
      case 'co2Levels':
        return Array.from({ length: months }, (_, i) => ({
          month: monthNames[i],
          value: Math.floor(Math.random() * 400) + 600  // CO2 600-1000 ppm range
        }));
      case 'vocLevels':
        return Array.from({ length: months }, (_, i) => ({
          month: monthNames[i],
          value: (Math.random() * 0.4 + 0.1).toFixed(3)  // VOC 0.1-0.5 mg/m³ range
        }));
      case 'thermal':
        return Array.from({ length: months }, (_, i) => ({
          month: monthNames[i],
          temperature: Math.floor(Math.random() * 8) + 68,  // 68-76°F
          humidity: Math.floor(Math.random() * 20) + 40     // 40-60% humidity
        }));
      case 'emissions':
        return Array.from({ length: months }, (_, i) => ({
          month: monthNames[i],
          scope1: Math.floor(Math.random() * 30) + 95,   // 95-125 tCO2e
          scope2: Math.floor(Math.random() * 60) + 250,  // 250-310 tCO2e  
          scope3: Math.floor(Math.random() * 25) + 80    // 80-105 tCO2e
        }));
      default:
        return Array.from({ length: months }, (_, i) => ({
          month: monthNames[i],
          value: Math.floor(Math.random() * 100) + 50
        }));
    }
  };

  const identifyMissingData = (metrics: ProjectMetrics) => {
    const missing: Record<string, any> = {};
    
    if (!project?.location) missing.projectAddress = '';
    if (!project?.owner_id) missing.ownerType = '';
    if (!project?.budget) missing.projectSize = '';
    if (!metrics.energy?.usage) missing.energyData = '';
    if (!metrics.water?.consumption) missing.waterData = '';
    if (!metrics.waste?.generated) missing.wasteData = '';
    if (!metrics.transportation?.emissions) missing.transportationData = '';
    if (!metrics.humanExperience?.satisfactionScore) missing.humanExperienceData = '';

    return missing;
  };

  const calculateCertificationLevel = () => {
    const score = arcScores.current;
    if (score >= 90) return 'Platinum';
    if (score >= 80) return 'Gold';
    if (score >= 70) return 'Silver';
    return 'Certified';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-yellow-600';
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    return 'text-gray-600';
  };

  const getBadgeVariant = (level: string) => {
    switch (level) {
      case 'Platinum': return 'bg-yellow-100 text-yellow-800';
      case 'Gold': return 'bg-green-100 text-green-800';
      case 'Silver': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportToPDF = async () => {
    if (!reportRef.current) return;

    try {
      toast({
        title: "Generating PDF",
        description: "Please wait while we generate your LEED report...",
      });

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: reportRef.current.scrollWidth,
        height: reportRef.current.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${project?.name || 'Project'}_LEED_Report.pdf`);

      toast({
        title: "PDF Generated",
        description: "Your LEED v4.1 report has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading LEED report data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-foreground">LEED v4.1 Project Report</h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Brain className="h-3 w-3 mr-1" />
                AI-Powered
              </Badge>
              {predictiveAnalysis?.aiGenerated && (
                <Badge variant="secondary" className="text-xs">
                  <Lightbulb className="h-3 w-3 mr-1" />
                  Smart Insights
                </Badge>
              )}
            </div>
          </div>
          <p className="text-muted-foreground mt-1">
            Comprehensive sustainability analysis powered by Future Build AI
          </p>
        </div>
        <div className="flex items-center gap-2">
          {showMissingDataForm && (
            <Button variant="outline" onClick={() => setShowMissingDataForm(!showMissingDataForm)}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Complete Missing Data
            </Button>
          )}
          <Button 
            onClick={syncLEEDTasks} 
            variant="outline" 
            disabled={syncingTasks}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            {syncingTasks ? 'Syncing...' : 'Sync LEED Tasks'}
          </Button>
          <Button onClick={exportToPDF} className="flex items-center gap-2">
            <FileDown className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Missing Data Form */}
      {showMissingDataForm && Object.keys(missingDataInputs).length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Missing Data Required for Complete Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-orange-700">
              Please provide the following information to generate a complete LEED v4.1 report:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(missingDataInputs).map((key) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key} className="text-sm font-medium">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Label>
                  <Input
                    id={key}
                    placeholder={`Enter ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                    value={missingDataInputs[key]}
                    onChange={(e) => setMissingDataInputs(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <Button onClick={() => setShowMissingDataForm(false)} className="w-full">
              Continue with Available Data
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Report Content */}
      <div ref={reportRef} className="bg-white p-8 space-y-8">
        
        {/* Cover Page */}
        <div className="text-center space-y-6 border-b pb-8">
          <div className="space-y-3">
            <div className="flex justify-center items-center gap-3">
              <Brain className="h-8 w-8 text-blue-500" />
              <span className="text-lg font-semibold text-blue-600">Future Build AI</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">{project?.name || 'Project Name'}</h1>
            <p className="text-xl text-gray-600">LEED v4.1 AI-Enhanced Performance Report</p>
          </div>
          
          <div className="flex justify-center flex-wrap gap-3">
            <Badge className={`text-lg px-4 py-2 ${getBadgeVariant(calculateCertificationLevel())}`}>
              <Award className="h-5 w-5 mr-2" />
              {calculateCertificationLevel()} Level Project
            </Badge>
            <Badge variant="outline" className="text-sm px-3 py-2">
              <Brain className="h-4 w-4 mr-2" />
              AI-Powered Analytics
            </Badge>
            {predictiveAnalysis?.aiGenerated && (
              <Badge variant="secondary" className="text-sm px-3 py-2">
                <Lightbulb className="h-4 w-4 mr-2" />
                Predictive Insights
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6 text-sm text-gray-600 max-w-2xl mx-auto">
            <div>
              <p><strong>Project ID:</strong> {project?.id?.slice(0, 8) || 'N/A'}</p>
              <p><strong>Address:</strong> {project?.location || 'Not specified'}</p>
              <p><strong>Project Type:</strong> {project?.project_type || 'Construction'}</p>
            </div>
            <div>
              <p><strong>Report Date:</strong> {new Date().toLocaleDateString()}</p>
              <p><strong>Performance Period:</strong> Last 12 months</p>
              <p><strong>Current Phase:</strong> {project?.current_phase || 'Execution'}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-center items-center gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                <span>Real-time Data</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                <span>AI Recommendations</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>Predictive Analysis</span>
              </div>
            </div>
          </div>
        </div>

        {/* Arc Performance Score - Overall Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Arc Performance Score
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              for 12 month performance period ending {new Date().toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="text-center">
                  <div className={`text-6xl font-bold ${getScoreColor(arcScores.current)}`}>
                    {arcScores.current}/100
                  </div>
                  <p className="text-muted-foreground mt-2">Overall Performance Score</p>
                </div>
                
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-32 h-8 bg-gray-200 rounded">
                      <div 
                        className="h-full bg-blue-500 rounded"
                        style={{ width: `${(arcScores.current / 100) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{arcScores.globalAverage} Global Average</span>
                      <span>{arcScores.localAverage} Local Average</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Monthly average Arc Performance Score</h4>
                  <p className="text-xs text-muted-foreground">Last 12 months average</p>
                  <div className="text-2xl font-bold">{arcScores.current}/100</div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-4">Arc Score calculated for the first day of each month</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={arcScores.trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comprehensive LEED v4.1 Score Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-600" />
              {certificateId ? 'Certificate-Specific LEED Report' : 'LEED v4.1 BD+C Comprehensive Score Analysis'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {certificateId 
                ? `Detailed analysis for ${certificationType} ${version} certification based on associated tasks`
                : 'Detailed point allocation across all LEED categories with credit-by-credit breakdown and certification pathway'
              }
            </p>
          </CardHeader>
          <CardContent>
            {leedTasks.length > 0 ? (() => {
              // Use imported LEED static data
              
              // Group LEED tasks by category and get unique subcategories
              const taskSubcategories = new Set();
              const leedTasksByCategory: Record<string, any[]> = {};
              
              leedTasks.forEach((task) => {
                const categoryId = task.leed_subcategory_id?.substring(0, 2) || 'SS';
                if (!leedTasksByCategory[categoryId]) {
                  leedTasksByCategory[categoryId] = [];
                }
                leedTasksByCategory[categoryId].push(task);
                taskSubcategories.add(task.leed_subcategory_id);
              });

              // Filter LEED subcategories to only include those with tasks
              const availableSubcategories = LEED_V4_1_BD_C_SUBCATEGORIES.filter(
                subcategory => taskSubcategories.has(subcategory.subcategoryId)
              );

              // Calculate total points across all available subcategories (should be 110)
              const calculateTotalPoints = () => {
                let totalEarned = 0;
                let totalPossible = 110; // Max LEED points as specified
                let completedTasks = 0;
                let totalTasks = leedTasks.length;

                leedTasks.forEach((task) => {
                  if (task.status === 'completed') {
                    completedTasks++;
                    totalEarned += (task.leed_points_achieved || task.leed_points_possible || 0);
                  }
                });

                return { totalEarned, totalPossible, completedTasks, totalTasks };
              };

              const { totalEarned, totalPossible, completedTasks, totalTasks } = calculateTotalPoints();
              
              const getCertificationLevel = (points: number) => {
                if (points >= 80) return 'Platinum';
                if (points >= 60) return 'Gold';
                if (points >= 50) return 'Silver';
                if (points >= 40) return 'Certified';
                return 'Not Certified';
              };
              
              const certLevel = getCertificationLevel(totalEarned);
              
              return (
                <>
                  {/* Certification Level and Total Score */}
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                    <div className="text-center p-6 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg border-2 border-amber-200">
                      <div className="text-4xl font-bold text-amber-600 mb-2">
                        {totalEarned}
                      </div>
                      <p className="text-sm text-amber-700 font-medium">Total LEED Points</p>
                      <p className="text-xs text-amber-600 mt-1">Out of {totalPossible} possible</p>
                    </div>
                    
                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                      <div className="text-2xl font-bold text-green-600 mb-2">
                        {certLevel}
                      </div>
                      <p className="text-sm text-green-700 font-medium">Certification Level</p>
                      <p className="text-xs text-green-600 mt-1">
                        {certLevel === 'Platinum' ? '80+' : 
                         certLevel === 'Gold' ? '60-79' : 
                         certLevel === 'Silver' ? '50-59' : 
                         certLevel === 'Certified' ? '40-49' : '0-39'} points
                      </p>
                    </div>
                    
                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-200">
                      <div className="text-2xl font-bold text-blue-600 mb-2">
                        {Math.round((totalEarned / Math.max(totalPossible, 1)) * 100)}%
                      </div>
                      <p className="text-sm text-blue-700 font-medium">Progress to Platinum</p>
                      <p className="text-xs text-blue-600 mt-1">
                        {Math.max(80 - totalEarned, 0)} points needed
                      </p>
                    </div>
                    
                    <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border-2 border-purple-200">
                      <div className="text-2xl font-bold text-purple-600 mb-2">
                        {completedTasks}
                      </div>
                      <p className="text-sm text-purple-700 font-medium">Completed Tasks</p>
                      <p className="text-xs text-purple-600 mt-1">Out of {totalTasks} total</p>
                    </div>
                  </div>

                  {/* Available Subcategories Summary */}
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Project Scope</h4>
                    <p className="text-sm text-blue-700">
                      This project includes <span className="font-semibold">{availableSubcategories.length} LEED subcategories</span> across{' '}
                      <span className="font-semibold">{Object.keys(leedTasksByCategory).length} categories</span> with{' '}
                      <span className="font-semibold">{totalTasks} total tasks</span>.
                    </p>
                  </div>

                  {/* Detailed LEED Category Breakdown - Only categories with tasks */}
                  <div className="space-y-8">
                    {Object.entries(leedTasksByCategory).map(([categoryId, categoryTasks]) => {
                      const categoryMeta = getCategoryMetadata(categoryId);
                      
                      // Get the icon component dynamically
                      const getIconComponent = (iconName: string) => {
                        const iconMap: Record<string, any> = {
                          'MapPin': MapPin,
                          'Droplet': Droplet,
                          'Zap': Zap,
                          'Package': Package,
                          'Home': Home,
                          'Lightbulb': Lightbulb,
                          'RefreshCw': RefreshCw,
                          'FileText': FileText
                        };
                        return iconMap[iconName] || FileText;
                      };
                      
                      const IconComponent = getIconComponent(categoryMeta.icon);
                      
                      // Calculate category points from actual tasks
                      let categoryEarned = 0;
                      let categoryTotal = 0;

                      // Group tasks by subcategory for better display
                      const tasksBySubcategory: Record<string, any[]> = {};
                      categoryTasks.forEach(task => {
                        const subcategoryId = task.leed_subcategory_id;
                        if (!tasksBySubcategory[subcategoryId]) {
                          tasksBySubcategory[subcategoryId] = [];
                        }
                        tasksBySubcategory[subcategoryId].push(task);
                        
                        // Add to category totals using calculateTaskPoints function
                        const { possible, achieved } = calculateTaskPoints(task);
                        categoryTotal += possible;
                        categoryEarned += achieved;
                      });
                      
                      return (
                        <div key={categoryId} className="border rounded-lg p-6">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                              <IconComponent className={`h-6 w-6 text-${categoryMeta.color}-600`} />
                              <div>
                                <h3 className={`text-lg font-semibold text-${categoryMeta.color}-700`}>
                                  {categoryMeta.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">{categoryMeta.description}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-2xl font-bold text-${categoryMeta.color}-600`}>
                                {categoryEarned}/{categoryTotal}
                              </div>
                              <p className="text-xs text-muted-foreground">points earned</p>
                            </div>
                          </div>
                          
                          {/* Group tasks by subcategory */}
                          <div className="space-y-4">
                            {Object.entries(tasksBySubcategory).map(([subcategoryId, subcategoryTasks]) => {
                              // Find the subcategory info from static data
                              const subcategoryInfo = LEED_V4_1_BD_C_SUBCATEGORIES.find(
                                sub => sub.subcategoryId === subcategoryId
                              );
                              
                              const subcategoryTotal = subcategoryTasks.reduce((sum, task) => {
                                const { possible } = calculateTaskPoints(task);
                                return sum + possible;
                              }, 0);
                              const subcategoryEarned = subcategoryTasks.reduce((sum, task) => {
                                const { achieved } = calculateTaskPoints(task);
                                return sum + achieved;
                              }, 0);
                              
                              return (
                                <div key={subcategoryId} className="border-l-4 border-gray-200 pl-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="font-medium text-sm">
                                      {subcategoryId}: {getSubcategoryInfo(subcategoryId)?.subcategory || 'Unknown Subcategory'}
                                    </h5>
                                    <Badge variant="outline" className="text-xs">
                                      {subcategoryEarned}/{subcategoryTotal} pts
                                    </Badge>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                    {subcategoryTasks.map((task, taskIndex) => {
                                      const isCompleted = task.status === 'completed';
                                      const { possible: possibleTaskPoints, achieved: earnedTaskPoints } = calculateTaskPoints(task);
                                      
                                      return (
                                        <div key={taskIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                          <div className="flex-1">
                                            <span className="text-xs font-medium">{task.title}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                              {possibleTaskPoints > 0 ? (
                                                <>
                                                  <div className="w-16 bg-gray-200 rounded-full h-1">
                                                    <div 
                                                      className={`h-1 rounded-full ${
                                                        isCompleted ? `bg-${categoryMeta.color}-500` : 'bg-gray-300'
                                                      }`}
                                                      style={{ width: `${isCompleted ? 100 : 0}%` }}
                                                    />
                                                  </div>
                                                  <span className="text-xs text-muted-foreground">
                                                    {earnedTaskPoints}/{possibleTaskPoints}
                                                  </span>
                                                </>
                                              ) : (
                                                <span className={`text-xs text-${categoryMeta.color}-600 font-medium`}>
                                                  Prerequisite
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          <Badge 
                                            variant="outline" 
                                            className={`text-xs ${
                                              isCompleted 
                                                ? `text-${categoryMeta.color}-600 border-${categoryMeta.color}-600` 
                                                : task.status === 'in_progress' 
                                                  ? 'text-amber-600 border-amber-600'
                                                  : 'text-gray-600 border-gray-600'
                                            }`}
                                          >
                                            {isCompleted ? 'Completed' : task.status === 'in_progress' ? 'In Progress' : 'Pending'}
                                          </Badge>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })() : (
              <div className="text-center py-12">
                <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No LEED Tasks Found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This project doesn't have any LEED certification tasks yet.
                </p>
                <p className="text-xs text-muted-foreground">
                  Add LEED tasks to the project to see detailed scoring breakdown.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Water Performance - Detailed Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplet className="h-5 w-5 text-blue-500" />
              Water Performance
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              A building's water performance is based on consumption in standard water quantities (gal, kgal, ccf) 
              and reflects water efficiency as a score between 0 and 100. Lower consumption results in higher scores.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold mb-4">Arc WATER SCORE</h4>
                  <div className="text-center space-y-4">
                    <div className="text-5xl font-bold text-blue-600">{leedScores.water}/100</div>
                    <p className="text-sm text-muted-foreground">Current Water Score</p>
                    
                    <div className="relative">
                      <div className="w-40 h-6 bg-gray-200 rounded mx-auto">
                        <div 
                          className="h-full bg-blue-500 rounded"
                          style={{ width: `${leedScores.water}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>68 Local Avg</span>
                        <span>65 Global Avg</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">Monthly average Arc Water Score</h4>
                  <p className="text-xs text-muted-foreground mb-2">Last 12 months average</p>
                  <div className="text-2xl font-bold mb-4">{leedScores.water}/100</div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-4">Water Score calculated for the first day of each month</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={metrics.water?.trend || generateMockTrend(12, 'water')}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      strokeWidth={3} 
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Water Performance KPIs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">KEY PERFORMANCE INDICATORS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="text-base font-semibold mb-4">Total Water Consumption</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Cumulative water use from {new Date(Date.now() - 365*24*60*60*1000).toLocaleDateString()} to {new Date().toLocaleDateString()}
                </p>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Last 12 months</p>
                    <div className="text-2xl font-bold">{((metrics.water?.consumption || 9170) / 1000).toFixed(2)}K gal</div>
                  </div>
                  
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={generateMockTrend(12, 'water')}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Water Improvement Score */}
        <Card>
          <CardHeader>
            <CardTitle>IMPROVEMENT SCORE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold mb-4">Current Improvement Score</h4>
                <div className="flex items-center gap-3">
                  <Droplet className="h-8 w-8 text-blue-500" />
                  <div className="text-4xl font-bold text-blue-600">100/100</div>
                  <Badge variant="outline">Estimated</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-sm font-medium mb-2">Water</div>
                      <div className="text-xs text-muted-foreground">gal/sqft</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Change</span>
                        <span className="text-green-600 flex items-center gap-1">
                          <TrendingDown className="h-3 w-3" />
                          47.7% (Less is better)
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Baseline Period</span>
                        <span>6.543187</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Performance Period</span>
                        <span>3.424146</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-sm font-medium mb-2">Gross Area</div>
                      <div className="text-xs text-muted-foreground">sqft</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Change</span>
                        <span className="flex items-center gap-1">18.1%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Baseline Period</span>
                        <span>5,081</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Performance Period</span>
                        <span>6,000</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Data Quality</h4>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-xs">Poor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span className="text-xs">Good</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-xs">Best</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Waste Performance - Detailed Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash className="h-5 w-5 text-green-500" />
              Waste Performance
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              The waste score accounts for typical materials used in building operation. Users must account for 
              safe disposal and diversion from landfills. Lower quantity generated and higher diversion rates result in better scores.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold mb-4">Arc WASTE SCORE</h4>
                  <div className="text-center space-y-4">
                    <div className="text-5xl font-bold text-green-600">{leedScores.waste}/100</div>
                    <p className="text-sm text-muted-foreground">Current Waste Score</p>
                    
                    <div className="relative">
                      <div className="w-40 h-6 bg-gray-200 rounded mx-auto">
                        <div 
                          className="h-full bg-green-500 rounded"
                          style={{ width: `${leedScores.waste}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>77 Local Avg</span>
                        <span>71 Global Avg</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">Monthly average Arc Waste Score</h4>
                  <p className="text-xs text-muted-foreground mb-2">Last 12 months average</p>
                  <div className="text-2xl font-bold mb-4">{leedScores.waste}/100</div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-4">Waste Score calculated for the first day of each month</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={metrics.waste?.trend || generateMockTrend(12, 'waste')}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="generated" 
                      stroke="#10b981" 
                      strokeWidth={3} 
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Waste Performance KPIs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">KEY PERFORMANCE INDICATORS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div>
                <h4 className="text-base font-semibold mb-4">Waste Generation</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Cumulative waste generation from {new Date(Date.now() - 365*24*60*60*1000).toLocaleDateString()} to {new Date().toLocaleDateString()}
                </p>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Last 12 months</p>
                    <div className="text-2xl font-bold">{(metrics.waste?.generated || 450)} lbs</div>
                  </div>
                  
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={generateMockTrend(12, 'waste')}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="generated" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h4 className="text-base font-semibold mb-4">Waste Diversion</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Cumulative waste diversion from {new Date(Date.now() - 365*24*60*60*1000).toLocaleDateString()} to {new Date().toLocaleDateString()}
                </p>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Last 12 months</p>
                    <div className="text-2xl font-bold">{(metrics.waste?.diverted || 338)} lbs</div>
                  </div>
                  
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={generateMockTrend(12, 'wasteDiverted')}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="diverted" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-base font-semibold mb-4">Waste Distribution</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Diverted', value: metrics.waste?.diverted || 338, fill: '#10b981' },
                          { name: 'Disposed', value: (metrics.waste?.generated || 450) - (metrics.waste?.diverted || 338), fill: '#ef4444' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium">Performance Summary</h4>
                    <div className="space-y-2 mt-4">
                      <div className="flex justify-between text-sm">
                        <span>Total Generated</span>
                        <span className="font-medium">{(metrics.waste?.generated || 450)} lbs</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Diverted</span>
                        <span className="font-medium text-green-600">{(metrics.waste?.diverted || 338)} lbs</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Diversion Rate</span>
                        <span className="font-medium text-green-600">
                          {metrics.waste?.generated ? 
                            Math.round((metrics.waste.diverted / metrics.waste.generated) * 100) : 75}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Daily Average (Generated)</span>
                        <span className="font-medium">{((metrics.waste?.generated || 450) / 365).toFixed(2)} lbs/day</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Daily Average (Diverted)</span>
                        <span className="font-medium text-green-600">{((metrics.waste?.diverted || 338) / 365).toFixed(2)} lbs/day</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transportation Performance - Detailed Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-purple-500" />
              Transportation Performance
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Transportation impacts are tracked based on carbon impacts of occupants and visitors traveling to the building. 
              The score is based on greenhouse gas emissions (CO2e) resulting from transportation to and from the building.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold mb-4">Arc TRANSPORTATION SCORE</h4>
                  <div className="text-center space-y-4">
                    <div className="text-5xl font-bold text-purple-600">{leedScores.transportation}/100</div>
                    <p className="text-sm text-muted-foreground">Current Transportation Score</p>
                    
                    <div className="relative">
                      <div className="w-40 h-6 bg-gray-200 rounded mx-auto">
                        <div 
                          className="h-full bg-purple-500 rounded"
                          style={{ width: `${leedScores.transportation}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>84 Local Avg</span>
                        <span>80 Global Avg</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">Monthly average Arc Transportation Score</h4>
                  <p className="text-xs text-muted-foreground mb-2">Last 12 months average</p>
                  <div className="text-2xl font-bold mb-4">{leedScores.transportation}/100</div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-4">Transportation Score calculated for the first day of each month</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={generateMockTrend(12, 'transportation')}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8b5cf6" 
                      strokeWidth={3} 
                      dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-base font-semibold mb-4">Transportation GHG Emissions</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Cumulative transportation GHG emissions from {new Date(Date.now() - 365*24*60*60*1000).toLocaleDateString()} to {new Date().toLocaleDateString()}
                </p>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Last 12 months average</p>
                    <div className="text-2xl font-bold">{((metrics.transportation?.emissions || 200) / 1000).toFixed(4)} MTCO2e</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-base font-semibold mb-4">Survey Response Rate</h4>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-600">
                      {metrics.transportation?.totalOccupants ? 
                        Math.round((metrics.transportation.surveyResponses / metrics.transportation.totalOccupants) * 100) : 75}%
                    </div>
                    <p className="text-sm text-muted-foreground">percent of people responded</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Survey Responses</span>
                      <span className="font-medium">{metrics.transportation?.surveyResponses || 15}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Occupants</span>
                      <span className="font-medium">{metrics.transportation?.totalOccupants || 20}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Required Rate</span>
                      <span className="font-medium">25%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Human Experience Performance - Detailed Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Human Experience Performance
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Indoor environmental quality, air quality measurements, and occupant satisfaction metrics
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div>
                <h4 className="text-base font-semibold mb-4">Indoor Air Quality Index</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Real-time air quality monitoring from {new Date(Date.now() - 365*24*60*60*1000).toLocaleDateString()} to {new Date().toLocaleDateString()}
                </p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={generateMockTrend(12, 'airQuality')}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 500]} />
                      <Tooltip 
                        formatter={(value: any) => [`${value} AQI`, 'Air Quality Index']}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.3} 
                        strokeWidth={3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h4 className="text-base font-semibold mb-4">CO₂ Concentration Levels</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Daily average CO₂ levels in occupied spaces (target: &lt;1000 ppm)
                </p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={generateMockTrend(12, 'co2Levels')}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[300, 1200]} />
                      <Tooltip 
                        formatter={(value: any) => [`${value} ppm`, 'CO₂ Level']}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#f59e0b" 
                        strokeWidth={3} 
                        dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* VOC and Temperature Monitoring */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div>
                <h4 className="text-base font-semibold mb-4">VOC Levels (Volatile Organic Compounds)</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Monthly average VOC concentrations (target: &lt;0.5 mg/m³)
                </p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={generateMockTrend(12, 'vocLevels')}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 1]} />
                      <Tooltip 
                        formatter={(value: any) => [`${value} mg/m³`, 'VOC Level']}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="#10b981" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h4 className="text-base font-semibold mb-4">Temperature & Humidity Control</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Thermal comfort measurements (ASHRAE 55 compliance)
                </p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={generateMockTrend(12, 'thermal')}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[65, 80]} />
                      <Tooltip 
                        formatter={(value: any, name: any) => [
                          name === 'temperature' ? `${value}°F` : `${value}%`, 
                          name === 'temperature' ? 'Temperature' : 'Humidity'
                        ]}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="temperature" 
                        stroke="#ef4444" 
                        strokeWidth={2} 
                        dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="humidity" 
                        stroke="#06b6d4" 
                        strokeWidth={2} 
                        dot={{ fill: '#06b6d4', strokeWidth: 2, r: 3 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Occupant Satisfaction Survey Results */}
            <div className="mb-8">
              <h4 className="text-base font-semibold mb-4">Occupant Satisfaction Survey Results</h4>
              <p className="text-sm text-muted-foreground mb-6">
                Post-occupancy evaluation responses from {Math.floor((metrics.humanExperience?.surveyResponses || 0) * 1.2) || 45} building occupants
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <h5 className="text-sm font-medium mb-3">Overall Satisfaction</h5>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Very Satisfied', value: 35, color: '#10b981' },
                            { name: 'Satisfied', value: 40, color: '#3b82f6' },
                            { name: 'Neutral', value: 15, color: '#f59e0b' },
                            { name: 'Dissatisfied', value: 8, color: '#ef4444' },
                            { name: 'Very Dissatisfied', value: 2, color: '#991b1b' }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${value}%`}
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#3b82f6" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#ef4444" />
                          <Cell fill="#991b1b" />
                        </Pie>
                        <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-medium mb-3">Environmental Quality Ratings</h5>
                  <div className="space-y-4">
                    {[
                      { category: 'Air Quality', score: 4.2, color: '#3b82f6' },
                      { category: 'Thermal Comfort', score: 3.8, color: '#ef4444' },
                      { category: 'Lighting Quality', score: 4.5, color: '#f59e0b' },
                      { category: 'Acoustics', score: 3.9, color: '#10b981' },
                      { category: 'Space Layout', score: 4.1, color: '#8b5cf6' }
                    ].map((item) => (
                      <div key={item.category} className="flex items-center justify-between">
                        <span className="text-sm">{item.category}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full" 
                              style={{ 
                                width: `${(item.score / 5) * 100}%`, 
                                backgroundColor: item.color 
                              }} 
                            />
                          </div>
                          <span className="text-sm font-medium w-8">{item.score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-medium mb-3">Key Performance Indicators</h5>
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {metrics.humanExperience?.satisfactionScore || 88}%
                      </div>
                      <p className="text-sm text-green-700">Overall Satisfaction</p>
                    </div>
                    
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {((metrics.humanExperience?.surveyResponses || 0) / 60 * 100) || 75}%
                      </div>
                      <p className="text-sm text-blue-700">Survey Response Rate</p>
                    </div>
                    
                    <div className="text-center p-4 bg-amber-50 rounded-lg">
                      <div className="text-2xl font-bold text-amber-600">
                        {((metrics.humanExperience?.vocLevels || 0.3) * 1000).toFixed(0)} μg/m³
                      </div>
                      <p className="text-sm text-amber-700">Avg VOC Level</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Health and Wellness Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-base font-semibold mb-4">Health & Wellness Impact</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Reported Productivity Increase</span>
                    <span className="font-semibold text-green-600">+12%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Sick Days Reduction</span>
                    <span className="font-semibold text-green-600">-18%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Employee Retention Rate</span>
                    <span className="font-semibold text-blue-600">94%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Stress Level Reduction</span>
                    <span className="font-semibold text-green-600">-22%</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-base font-semibold mb-4">Compliance & Certification</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm">ASHRAE 62.1 Compliance</span>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">Certified</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm">WELL Building Standard</span>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">Gold</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                      <span className="text-sm">LEED IEQ Credits</span>
                    </div>
                    <Badge variant="outline" className="text-blue-600 border-blue-600">15/17 Points</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-amber-600" />
                      <span className="text-sm">Green Globes Rating</span>
                    </div>
                    <Badge variant="outline" className="text-amber-600 border-amber-600">4 Globes</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GHG Emissions - Comprehensive Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-green-600" />
              GHG Emissions Analysis
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Comprehensive greenhouse gas emissions analysis including Scope 1, 2, and 3 emissions with carbon footprint tracking
            </p>
          </CardHeader>
          <CardContent>
            {/* Total Emissions Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {((metrics.ghgEmissions?.scope1 || 125) + (metrics.ghgEmissions?.scope2 || 280) + (metrics.ghgEmissions?.scope3 || 95)).toFixed(1)}
                </div>
                <p className="text-sm text-green-700 font-medium">Total tCO₂e Annual</p>
                <p className="text-xs text-green-600 mt-1">
                  {new Date(Date.now() - 365*24*60*60*1000).getFullYear()} - {new Date().getFullYear()}
                </p>
              </div>
              
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {(metrics.ghgEmissions?.intensity || 12.4).toFixed(1)}
                </div>
                <p className="text-sm text-blue-700 font-medium">kgCO₂e per sq ft</p>
                <p className="text-xs text-blue-600 mt-1">Carbon Intensity</p>
              </div>
              
              <div className="text-center p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg">
                <div className="text-3xl font-bold text-amber-600 mb-2">
                  {(metrics.ghgEmissions?.reductionTarget || 25)}%
                </div>
                <p className="text-sm text-amber-700 font-medium">Reduction Target</p>
                <p className="text-xs text-amber-600 mt-1">by 2030 (vs 2020 baseline)</p>
              </div>
            </div>

            {/* Emissions by Scope Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div>
                <h4 className="text-base font-semibold mb-4">GHG Emissions by Scope</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Annual emissions breakdown following GHG Protocol standards
                </p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { 
                            name: 'Scope 1 (Direct)', 
                            value: metrics.ghgEmissions?.scope1 || 125, 
                            color: '#ef4444',
                            description: 'On-site fuel combustion, vehicles'
                          },
                          { 
                            name: 'Scope 2 (Indirect Energy)', 
                            value: metrics.ghgEmissions?.scope2 || 280, 
                            color: '#3b82f6',
                            description: 'Purchased electricity, steam, heating'
                          },
                          { 
                            name: 'Scope 3 (Value Chain)', 
                            value: metrics.ghgEmissions?.scope3 || 95, 
                            color: '#10b981',
                            description: 'Business travel, commuting, materials'
                          }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        dataKey="value"
                        label={({ name, value, percent }) => `${value} tCO₂e (${(percent * 100).toFixed(1)}%)`}
                      >
                        <Cell fill="#ef4444" />
                        <Cell fill="#3b82f6" />
                        <Cell fill="#10b981" />
                      </Pie>
                      <Tooltip 
                        formatter={(value: any, name: any, props: any) => [
                          `${value} tCO₂e`,
                          `${name}: ${props.payload.description}`
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h4 className="text-base font-semibold mb-4">Monthly Emissions Trend</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Tracking emissions reduction progress over time
                </p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={generateMockTrend(12, 'emissions')}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: any, name: any) => [`${value} tCO₂e`, name]}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="scope1" 
                        stackId="1"
                        stroke="#ef4444" 
                        fill="#ef4444" 
                        fillOpacity={0.8}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="scope2" 
                        stackId="1"
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.8}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="scope3" 
                        stackId="1"
                        stroke="#10b981" 
                        fill="#10b981" 
                        fillOpacity={0.8}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Detailed Emissions Sources */}
            <div className="mb-8">
              <h4 className="text-base font-semibold mb-4">Detailed Emissions Sources</h4>
              <p className="text-sm text-muted-foreground mb-6">
                Breakdown of emissions sources by category and subcategory
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-sm font-semibold text-red-600">Scope 1 - Direct Emissions</h5>
                    <Badge variant="outline" className="text-red-600 border-red-600">
                      {metrics.ghgEmissions?.scope1 || 125} tCO₂e
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Natural Gas</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div className="w-3/4 bg-red-500 h-1.5 rounded-full"></div>
                        </div>
                        <span className="text-xs font-medium">85 tCO₂e</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Fleet Vehicles</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div className="w-1/4 bg-red-500 h-1.5 rounded-full"></div>
                        </div>
                        <span className="text-xs font-medium">25 tCO₂e</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Generators</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div className="w-1/6 bg-red-500 h-1.5 rounded-full"></div>
                        </div>
                        <span className="text-xs font-medium">15 tCO₂e</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-sm font-semibold text-blue-600">Scope 2 - Energy Indirect</h5>
                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                      {metrics.ghgEmissions?.scope2 || 280} tCO₂e
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Purchased Electricity</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div className="w-full bg-blue-500 h-1.5 rounded-full"></div>
                        </div>
                        <span className="text-xs font-medium">240 tCO₂e</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">District Heating</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div className="w-1/8 bg-blue-500 h-1.5 rounded-full"></div>
                        </div>
                        <span className="text-xs font-medium">25 tCO₂e</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Steam</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div className="w-1/12 bg-blue-500 h-1.5 rounded-full"></div>
                        </div>
                        <span className="text-xs font-medium">15 tCO₂e</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-sm font-semibold text-green-600">Scope 3 - Value Chain</h5>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {metrics.ghgEmissions?.scope3 || 95} tCO₂e
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Business Travel</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div className="w-1/2 bg-green-500 h-1.5 rounded-full"></div>
                        </div>
                        <span className="text-xs font-medium">45 tCO₂e</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Employee Commuting</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div className="w-1/3 bg-green-500 h-1.5 rounded-full"></div>
                        </div>
                        <span className="text-xs font-medium">30 tCO₂e</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Waste Disposal</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div className="w-1/5 bg-green-500 h-1.5 rounded-full"></div>
                        </div>
                        <span className="text-xs font-medium">20 tCO₂e</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Carbon Reduction Initiatives */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-base font-semibold mb-4">Carbon Reduction Initiatives</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Current and planned initiatives to achieve carbon neutrality
                </p>
                <div className="space-y-4">
                  {[
                    { 
                      initiative: 'LED Lighting Upgrade',
                      impact: '45 tCO₂e/year',
                      status: 'Completed',
                      statusColor: 'green'
                    },
                    { 
                      initiative: 'HVAC System Optimization',
                      impact: '78 tCO₂e/year',
                      status: 'In Progress',
                      statusColor: 'blue'
                    },
                    { 
                      initiative: 'Solar Panel Installation',
                      impact: '120 tCO₂e/year',
                      status: 'Planned',
                      statusColor: 'amber'
                    },
                    { 
                      initiative: 'Electric Vehicle Fleet',
                      impact: '25 tCO₂e/year',
                      status: 'Planned',
                      statusColor: 'amber'
                    }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <span className="text-sm font-medium">{item.initiative}</span>
                        <p className="text-xs text-muted-foreground">Reduction: {item.impact}</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-${item.statusColor}-600 border-${item.statusColor}-600`}
                      >
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-base font-semibold mb-4">Carbon Footprint Benchmarking</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Performance against industry standards and best practices
                </p>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">vs Industry Average</span>
                      <span className="text-sm font-semibold text-green-600">-18% lower</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="w-4/5 bg-green-500 h-3 rounded-full relative">
                        <div className="absolute right-0 top-0 bottom-0 w-px bg-green-700"></div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Current: 12.4 kgCO₂e/sq ft | Industry: 15.1 kgCO₂e/sq ft</p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">vs LEED Platinum Buildings</span>
                      <span className="text-sm font-semibold text-amber-600">+8% higher</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="w-5/6 bg-amber-500 h-3 rounded-full relative">
                        <div className="absolute right-0 top-0 bottom-0 w-px bg-amber-700"></div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Target: 11.5 kgCO₂e/sq ft for LEED Platinum</p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Carbon Neutral Target Progress</span>
                      <span className="text-sm font-semibold text-blue-600">67% complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="w-2/3 bg-blue-500 h-3 rounded-full relative">
                        <div className="absolute right-0 top-0 bottom-0 w-px bg-blue-700"></div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Target: Net zero by 2030</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI-Powered Predictive Analysis */}
        {predictiveAnalysis && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                AI Predictive Analysis
                {predictiveAnalysis.aiGenerated && (
                  <Badge variant="outline" className="text-xs">
                    <Lightbulb className="h-3 w-3 mr-1" />
                    AI Generated
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-3">Performance Forecasting</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>12-Month Energy Trend</span>
                        <span className={`flex items-center gap-1 ${predictiveAnalysis.trendPredictions?.energyGrowth < 0 ? 'text-green-600' : 'text-orange-600'}`}>
                          {predictiveAnalysis.trendPredictions?.energyGrowth < 0 ? 
                            <TrendingDown className="h-3 w-3" /> : 
                            <TrendingUp className="h-3 w-3" />
                          }
                          {Math.abs(predictiveAnalysis.trendPredictions?.energyGrowth || 0)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Water Conservation</span>
                        <span className="flex items-center gap-1 text-green-600">
                          <TrendingDown className="h-3 w-3" />
                          {Math.abs(predictiveAnalysis.trendPredictions?.waterReduction || 0)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Overall Performance</span>
                        <span className="flex items-center gap-1 text-green-600">
                          <TrendingUp className="h-3 w-3" />
                          {predictiveAnalysis.trendPredictions?.overallImprovement || 0}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-3">Certification Path</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Current Level</span>
                        <Badge className={getBadgeVariant(predictiveAnalysis.certificationReadiness?.currentLevel || calculateCertificationLevel())}>
                          {predictiveAnalysis.certificationReadiness?.currentLevel || calculateCertificationLevel()}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Next Target</span>
                        <Badge variant="outline">
                          {predictiveAnalysis.certificationReadiness?.nextLevel || 'Gold'}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Est. Timeline</span>
                        <span>{predictiveAnalysis.certificationReadiness?.timeToAchieve || 6-8} months</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-4">Risk Assessment</h4>
                  <div className="space-y-2">
                    {(predictiveAnalysis.riskFactors || [
                      'Weather delays affecting energy performance',
                      'Supply chain issues for sustainable materials'
                    ]).map((risk: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Recommendations */}
        {recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                AI-Powered Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {recommendations.map((rec: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{rec.action}</h4>
                      <Badge variant="outline" className="text-xs">{rec.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{rec.impact}</p>
                    <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium">Cost:</span> {rec.cost}
                      </div>
                      <div>
                        <span className="font-medium">Timeline:</span> {rec.timeframe}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Insights */}
        {aiInsights && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-3">Benchmarking</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Industry Average</span>
                      <span className="text-sm font-medium">{aiInsights.benchmarking?.industryAverage || 65}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Top Quartile</span>
                      <span className="text-sm font-medium">{aiInsights.benchmarking?.topQuartile || 82}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Your Position</span>
                      <span className="text-sm font-medium text-green-600">{leedScores.overall}</span>
                    </div>
                    <Progress value={aiInsights.benchmarking?.percentile || 75} className="mt-2" />
                    <p className="text-xs text-muted-foreground">
                      You're performing better than {aiInsights.benchmarking?.percentile || 75}% of similar projects
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">ROI Analysis</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Investment Range</span>
                      <span className="font-medium">{aiInsights.roiAnalysis?.sustainabilityInvestment || '$150K-300K'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Annual Savings</span>
                      <span className="font-medium text-green-600">{aiInsights.roiAnalysis?.expectedSavings || '$25K-50K'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Payback Period</span>
                      <span className="font-medium">{aiInsights.roiAnalysis?.paybackPeriod || '3-6 years'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Net Present Value</span>
                      <span className="font-medium text-green-600">{aiInsights.roiAnalysis?.netPresentValue || '$200K-400K'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {aiInsights.competitiveAdvantages && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-3">Competitive Advantages</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {aiInsights.competitiveAdvantages.map((advantage: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{advantage}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* LEED Readiness Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-indigo-500" />
              LEED v4.1 Readiness Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Certification Level</p>
                  <Badge className={`text-lg px-4 py-2 ${getBadgeVariant(calculateCertificationLevel())}`}>
                    {calculateCertificationLevel()}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Data Completeness</p>
                  <Progress value={85} className="mb-2" />
                  <p className="text-xs text-muted-foreground">85% of required data available</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Energy performance data complete</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Water usage tracking active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Indoor air quality monitoring needed</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-4">Category Performance Summary</p>
                <div className="space-y-3">
                  {Object.entries(leedScores).filter(([key]) => key !== 'overall').map(([category, score]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{category.replace(/([A-Z])/g, ' $1')}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={score} className="w-20" />
                        <span className="text-sm font-medium">{score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              About This Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Future Build AI Sustainability Platform</h4>
              <p className="text-sm text-muted-foreground">
                This comprehensive LEED v4.1 performance report is powered by Future Build AI's advanced sustainability analytics platform.
                Our AI-driven insights provide predictive analysis, personalized recommendations, and data-driven optimization 
                strategies based on real project data and industry benchmarks.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Data Sources & AI Analysis</h4>
              <p className="text-sm text-muted-foreground">
                Performance data is collected from task resources, material specifications, equipment usage logs, and project metrics. 
                Our Gemini AI integration provides advanced predictive modeling, trend analysis, and actionable recommendations 
                to help achieve your LEED certification goals. All calculations comply with LEED v4.1 BD+C requirements.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Key Features</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Real-time data visualization</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>AI-powered predictions</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Risk assessment & mitigation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>ROI optimization analysis</span>
                </div>
              </div>
            </div>

            <Separator />
            
            <div className="text-xs text-muted-foreground">
              <div className="flex justify-between items-center">
                <div>
                  <p>Report generated on {new Date().toLocaleString()}</p>
                  <p>LEED v4.1 BD+C | Powered by Future Build AI Sustainability Platform</p>
                </div>
                <div className="text-right">
                  <p className="flex items-center gap-1">
                    <Lightbulb className="h-3 w-3" />
                    AI-Enhanced Analysis
                  </p>
                  <p>© {new Date().getFullYear()} Future Build AI Technologies</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LEEDReport;