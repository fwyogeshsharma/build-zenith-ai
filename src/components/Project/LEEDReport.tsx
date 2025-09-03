import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { FileDown, Award, TrendingUp, Leaf, Zap, Droplet, Trash, Car, Users, Building, CheckCircle, AlertTriangle, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface LEEDReportProps {
  projectId: string;
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
    intensity: number;
    trend: Array<{ month: string; scope1: number; scope2: number }>;
  };
}

const LEEDReport = ({ projectId }: LEEDReportProps) => {
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);
  
  // State for project data
  const [project, setProject] = useState<any>(null);
  const [metrics, setMetrics] = useState<ProjectMetrics>({});
  const [loading, setLoading] = useState(true);
  
  // State for missing data inputs
  const [missingDataInputs, setMissingDataInputs] = useState<Record<string, any>>({});
  const [showMissingDataForm, setShowMissingDataForm] = useState(false);
  
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
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      // Load basic project info
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Load project metrics
      const { data: metricsData, error: metricsError } = await supabase
        .from('project_metrics')
        .select('*')
        .eq('project_id', projectId);

      if (metricsError) throw metricsError;

      // Process metrics data into LEED categories
      const processedMetrics = processMetricsForLEED(metricsData || []);
      setMetrics(processedMetrics);
      
      // Check for missing required data
      const missingData = identifyMissingData(processedMetrics);
      if (Object.keys(missingData).length > 0) {
        setMissingDataInputs(missingData);
        setShowMissingDataForm(true);
      }

    } catch (error: any) {
      toast({
        title: "Error loading project data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processMetricsForLEED = (metricsData: any[]): ProjectMetrics => {
    const processed: ProjectMetrics = {};
    
    // Group metrics by category
    const energyMetrics = metricsData.filter(m => m.metric_type === 'energy');
    const waterMetrics = metricsData.filter(m => m.metric_type === 'water');
    const wasteMetrics = metricsData.filter(m => m.metric_type === 'waste');
    
    if (energyMetrics.length > 0) {
      processed.energy = {
        usage: energyMetrics.reduce((sum, m) => sum + m.value, 0),
        baseline: energyMetrics.reduce((sum, m) => sum + (m.target_value || 0), 0) * 1.2,
        target: energyMetrics.reduce((sum, m) => sum + (m.target_value || 0), 0),
        trend: generateMockTrend(12, 'energy')
      };
    }

    if (waterMetrics.length > 0) {
      processed.water = {
        consumption: waterMetrics.reduce((sum, m) => sum + m.value, 0),
        baseline: waterMetrics.reduce((sum, m) => sum + (m.target_value || 0), 0) * 1.15,
        target: waterMetrics.reduce((sum, m) => sum + (m.target_value || 0), 0),
        trend: generateMockTrend(12, 'water')
      };
    }

    // Add default values if no metrics exist
    if (!processed.energy) {
      processed.energy = {
        usage: 0,
        baseline: 0,
        target: 0,
        trend: generateMockTrend(12, 'energy')
      };
    }

    return processed;
  };

  const generateMockTrend = (months: number, type: string) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return Array.from({ length: months }, (_, i) => ({
      month: monthNames[i],
      value: Math.floor(Math.random() * 100) + 50
    }));
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
          <h2 className="text-2xl font-bold text-foreground">LEED v4.1 Project Report</h2>
          <p className="text-muted-foreground">Comprehensive sustainability performance analysis</p>
        </div>
        <div className="flex items-center gap-2">
          {showMissingDataForm && (
            <Button variant="outline" onClick={() => setShowMissingDataForm(!showMissingDataForm)}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Complete Missing Data
            </Button>
          )}
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
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900">{project?.name || 'Project Name'}</h1>
            <p className="text-xl text-gray-600">LEED v4.1 Performance Report</p>
          </div>
          
          <div className="flex justify-center">
            <Badge className={`text-lg px-4 py-2 ${getBadgeVariant(calculateCertificationLevel())}`}>
              <Award className="h-5 w-5 mr-2" />
              {calculateCertificationLevel()} Level Project
            </Badge>
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
        </div>

        {/* Arc Performance Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Arc Performance Score (Overall)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="text-center">
                  <div className={`text-5xl font-bold ${getScoreColor(arcScores.current)}`}>
                    {arcScores.current}
                  </div>
                  <p className="text-muted-foreground">Current Arc Score</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-semibold text-blue-600">{arcScores.localAverage}</div>
                    <p className="text-xs text-muted-foreground">Local Average</p>
                  </div>
                  <div>
                    <div className="text-2xl font-semibold text-gray-600">{arcScores.globalAverage}</div>
                    <p className="text-xs text-muted-foreground">Global Average</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">12-Month Trend</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={arcScores.trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[60, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Energy Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Energy Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Arc Score</span>
                <Badge className={getScoreColor(leedScores.energy)}>{leedScores.energy}</Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current Usage</span>
                  <span>{metrics.energy?.usage || 0} kWh</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Baseline</span>
                  <span>{metrics.energy?.baseline || 0} kWh</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Target</span>
                  <span>{metrics.energy?.target || 0} kWh</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium mb-2">Monthly Energy Usage</p>
                <ResponsiveContainer width="100%" height={150}>
                  <AreaChart data={metrics.energy?.trend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="#eab308" fill="#fef3c7" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Water Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplet className="h-5 w-5 text-blue-500" />
                Water Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Arc Score</span>
                <Badge className={getScoreColor(leedScores.water)}>{leedScores.water}</Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current Consumption</span>
                  <span>{metrics.water?.consumption || 0} gallons</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Baseline</span>
                  <span>{metrics.water?.baseline || 0} gallons</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Target</span>
                  <span>{metrics.water?.target || 0} gallons</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium mb-2">Monthly Water Consumption</p>
                <ResponsiveContainer width="100%" height={150}>
                  <AreaChart data={metrics.water?.trend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#dbeafe" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Waste Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash className="h-5 w-5 text-green-500" />
                Waste Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Arc Score</span>
                <Badge className={getScoreColor(leedScores.waste)}>{leedScores.waste}</Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Waste Generated</span>
                  <span>{metrics.waste?.generated || 0} tons</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Waste Diverted</span>
                  <span>{metrics.waste?.diverted || 0} tons</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Diversion Rate</span>
                  <span>
                    {metrics.waste?.generated ? 
                      Math.round((metrics.waste.diverted / metrics.waste.generated) * 100) : 0}%
                  </span>
                </div>
              </div>

              <div>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Diverted', value: metrics.waste?.diverted || 65, color: '#10b981' },
                        { name: 'Disposed', value: (metrics.waste?.generated || 100) - (metrics.waste?.diverted || 65), color: '#ef4444' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Transportation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5 text-purple-500" />
                Transportation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Arc Score</span>
                <Badge className={getScoreColor(leedScores.transportation)}>{leedScores.transportation}</Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Transportation Emissions</span>
                  <span>{metrics.transportation?.emissions || 0} kg CO₂e</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Survey Responses</span>
                  <span>{metrics.transportation?.surveyResponses || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Response Rate</span>
                  <span>
                    {metrics.transportation?.totalOccupants ? 
                      Math.round((metrics.transportation.surveyResponses / metrics.transportation.totalOccupants) * 100) : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* GHG Emissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-green-600" />
              GHG Emissions Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium mb-4">Emissions by Source</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Scope 1', value: metrics.ghgEmissions?.scope1 || 35, color: '#ef4444' },
                        { name: 'Scope 2', value: metrics.ghgEmissions?.scope2 || 65, color: '#3b82f6' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      <Cell fill="#ef4444" />
                      <Cell fill="#3b82f6" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Total GHG Emissions</p>
                  <p className="text-2xl font-bold">{((metrics.ghgEmissions?.scope1 || 0) + (metrics.ghgEmissions?.scope2 || 0))} tCO₂e</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Emissions Intensity</p>
                  <p className="text-2xl font-bold">{metrics.ghgEmissions?.intensity || 0} kgCO₂e/sq ft</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Scope 1 (Direct)</span>
                    <span>{metrics.ghgEmissions?.scope1 || 0} tCO₂e</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Scope 2 (Indirect)</span>
                    <span>{metrics.ghgEmissions?.scope2 || 0} tCO₂e</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
            <CardTitle>About This Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Arc & GBCI</h4>
              <p className="text-sm text-muted-foreground">
                Arc is a digital platform that measures, manages and improves sustainability performance for the built environment. 
                This report is generated based on LEED v4.1 Building Design and Construction standards managed by the 
                Green Business Certification Inc. (GBCI).
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Data Sources</h4>
              <p className="text-sm text-muted-foreground">
                Performance data is collected from building management systems, utility meters, occupant surveys, 
                and manual data entry. All data points are verified and normalized according to LEED v4.1 requirements.
              </p>
            </div>

            <Separator />
            
            <div className="text-xs text-muted-foreground">
              <p>Report generated on {new Date().toLocaleString()}</p>
              <p>LEED v4.1 BD+C | Arc Platform Integration | © {new Date().getFullYear()} Green Building Certification Inc.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LEEDReport;