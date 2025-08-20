import { Database } from '@/integrations/supabase/types';

type ProjectPhase = Database['public']['Enums']['project_phase'];
type CertificationType = Database['public']['Enums']['certification_type'];
type ProjectType = Database['public']['Enums']['project_type'];

export interface TaskTemplate {
  title: string;
  description: string;
  phase: ProjectPhase;
  priority: 'low' | 'medium' | 'high';
  ai_generated: boolean;
}

export interface PhaseTemplate {
  phase: ProjectPhase;
  budget_percentage?: number;
  duration_weeks?: number;
}

export interface CertificationTemplate {
  type: CertificationType;
  target_level?: string;
  requirements: Record<string, any>;
  expected_weeks?: number;
}

export interface ProjectTemplate {
  type: ProjectType;
  name: string;
  emoji: string;
  description: string;
  emphasis: string[];
  ai_focus: string[];
  phases: PhaseTemplate[];
  tasks: TaskTemplate[];
  certifications: CertificationTemplate[];
  defaultBudgetRange?: {
    min: number;
    max: number;
  };
  estimatedDuration?: number; // weeks
}

export const PROJECT_TEMPLATES: Record<ProjectType, ProjectTemplate> = {
  new_construction: {
    type: 'new_construction',
    name: 'New Construction',
    emoji: '🆕',
    description: 'Full lifecycle construction from ground up with BIM-based planning and sustainability compliance.',
    emphasis: ['Full lifecycle', 'BIM-based planning', 'Permits', 'Sustainability compliance'],
    ai_focus: ['Land evaluation', 'ROI', 'BIM clash detection', 'Predictive scheduling'],
    phases: [
      { phase: 'concept', budget_percentage: 5, duration_weeks: 4 },
      { phase: 'design', budget_percentage: 15, duration_weeks: 12 },
      { phase: 'pre_construction', budget_percentage: 10, duration_weeks: 8 },
      { phase: 'execution', budget_percentage: 65, duration_weeks: 52 },
      { phase: 'handover', budget_percentage: 5, duration_weeks: 4 },
    ],
    tasks: [
      { title: 'Site Survey & Analysis', description: 'Conduct comprehensive site evaluation', phase: 'concept', priority: 'high', ai_generated: true },
      { title: 'Feasibility Study', description: 'Market analysis and ROI projections', phase: 'concept', priority: 'high', ai_generated: true },
      { title: 'Zoning Compliance Check', description: 'Verify compliance with local regulations', phase: 'concept', priority: 'medium', ai_generated: true },
      { title: 'Architectural Design', description: 'Create detailed architectural plans', phase: 'design', priority: 'high', ai_generated: false },
      { title: 'BIM Model Development', description: 'Develop comprehensive 3D BIM model', phase: 'design', priority: 'high', ai_generated: true },
      { title: 'Energy Simulation', description: 'Perform energy efficiency analysis', phase: 'design', priority: 'medium', ai_generated: true },
      { title: 'Permit Applications', description: 'Submit all required construction permits', phase: 'pre_construction', priority: 'high', ai_generated: true },
      { title: 'Contractor Selection', description: 'Bid evaluation and contractor selection', phase: 'pre_construction', priority: 'high', ai_generated: false },
      { title: 'Foundation Work', description: 'Excavation and foundation construction', phase: 'execution', priority: 'high', ai_generated: false },
      { title: 'Quality Inspections', description: 'Regular quality control inspections', phase: 'execution', priority: 'high', ai_generated: true },
      { title: 'Final Inspections', description: 'Complete all final inspections', phase: 'handover', priority: 'high', ai_generated: false },
      { title: 'Occupancy Certificate', description: 'Obtain final occupancy certificate', phase: 'handover', priority: 'high', ai_generated: true },
    ],
    certifications: [
      { type: 'leed', target_level: 'Gold', requirements: { energy_efficiency: 'required', water_conservation: 'required' }, expected_weeks: 24 },
      { type: 'iso', target_level: '9001', requirements: { quality_management: 'required' }, expected_weeks: 16 },
    ],
    defaultBudgetRange: { min: 500000, max: 5000000 },
    estimatedDuration: 78,
  },

  renovation_repair: {
    type: 'renovation_repair',
    name: 'Renovation & Repair',
    emoji: '🔧',
    description: 'Renovation projects with focus on scope definition, permits, and material reuse.',
    emphasis: ['Scope definition', 'Demolition permits', 'Material reuse'],
    ai_focus: ['Lifecycle cost vs. rebuild', 'Compliance for hazardous material removal', 'Adaptive reuse strategies'],
    phases: [
      { phase: 'concept', budget_percentage: 10, duration_weeks: 3 },
      { phase: 'design', budget_percentage: 20, duration_weeks: 8 },
      { phase: 'pre_construction', budget_percentage: 15, duration_weeks: 4 },
      { phase: 'execution', budget_percentage: 50, duration_weeks: 20 },
      { phase: 'handover', budget_percentage: 5, duration_weeks: 2 },
    ],
    tasks: [
      { title: 'Existing Structure Assessment', description: 'Evaluate current building condition', phase: 'concept', priority: 'high', ai_generated: true },
      { title: 'Demolition Planning', description: 'Plan selective demolition strategy', phase: 'design', priority: 'high', ai_generated: true },
      { title: 'Hazardous Material Survey', description: 'Identify and plan removal of hazardous materials', phase: 'design', priority: 'high', ai_generated: true },
      { title: 'Demolition Permits', description: 'Obtain required demolition permits', phase: 'pre_construction', priority: 'high', ai_generated: true },
      { title: 'Material Recovery Plan', description: 'Plan for salvage and reuse of materials', phase: 'pre_construction', priority: 'medium', ai_generated: true },
      { title: 'Selective Demolition', description: 'Execute controlled demolition', phase: 'execution', priority: 'high', ai_generated: false },
      { title: 'Renovation Work', description: 'Complete renovation construction', phase: 'execution', priority: 'high', ai_generated: false },
    ],
    certifications: [
      { type: 'iso', target_level: '45001', requirements: { safety_management: 'required' }, expected_weeks: 12 },
    ],
    defaultBudgetRange: { min: 100000, max: 2000000 },
    estimatedDuration: 37,
  },

  interior_fitout: {
    type: 'interior_fitout',
    name: 'Interior & Fit-Out',
    emoji: '🎨',
    description: 'Interior projects with space optimization, quick approvals, and efficient procurement.',
    emphasis: ['Space optimization', 'Quick approvals', 'Material procurement'],
    ai_focus: ['Generative design for layouts', 'Energy-efficient interiors', 'Smart building automation'],
    phases: [
      { phase: 'concept', budget_percentage: 10, duration_weeks: 2 },
      { phase: 'design', budget_percentage: 25, duration_weeks: 6 },
      { phase: 'pre_construction', budget_percentage: 10, duration_weeks: 3 },
      { phase: 'execution', budget_percentage: 50, duration_weeks: 12 },
      { phase: 'handover', budget_percentage: 5, duration_weeks: 1 },
    ],
    tasks: [
      { title: 'Space Planning', description: 'Optimize layout for functionality', phase: 'concept', priority: 'high', ai_generated: true },
      { title: 'Interior Design Concepts', description: 'Develop design themes and concepts', phase: 'design', priority: 'high', ai_generated: true },
      { title: 'Material Selection', description: 'Select finishes and furniture', phase: 'design', priority: 'medium', ai_generated: true },
      { title: 'MEP Coordination', description: 'Coordinate mechanical, electrical, plumbing', phase: 'pre_construction', priority: 'high', ai_generated: false },
      { title: 'Fit-out Construction', description: 'Execute interior construction work', phase: 'execution', priority: 'high', ai_generated: false },
      { title: 'Smart Systems Installation', description: 'Install automation and smart systems', phase: 'execution', priority: 'medium', ai_generated: true },
    ],
    certifications: [
      { type: 'well', target_level: 'Silver', requirements: { wellness_features: 'required' }, expected_weeks: 16 },
    ],
    defaultBudgetRange: { min: 50000, max: 1000000 },
    estimatedDuration: 24,
  },

  land_development: {
    type: 'land_development',
    name: 'Land & Site Development',
    emoji: '🌍',
    description: 'Site development with grading, drainage, and landscape compliance.',
    emphasis: ['Site grading', 'Drainage', 'Landscape compliance'],
    ai_focus: ['Satellite-based land evaluation', 'Environmental approvals', 'SITES certification automation'],
    phases: [
      { phase: 'concept', budget_percentage: 15, duration_weeks: 6 },
      { phase: 'design', budget_percentage: 20, duration_weeks: 10 },
      { phase: 'pre_construction', budget_percentage: 15, duration_weeks: 8 },
      { phase: 'execution', budget_percentage: 45, duration_weeks: 24 },
      { phase: 'handover', budget_percentage: 5, duration_weeks: 2 },
    ],
    tasks: [
      { title: 'Topographic Survey', description: 'Detailed site survey and mapping', phase: 'concept', priority: 'high', ai_generated: true },
      { title: 'Environmental Impact Assessment', description: 'Evaluate environmental impacts', phase: 'concept', priority: 'high', ai_generated: true },
      { title: 'Grading Plan', description: 'Design site grading and earthwork', phase: 'design', priority: 'high', ai_generated: true },
      { title: 'Drainage Design', description: 'Design stormwater management systems', phase: 'design', priority: 'high', ai_generated: true },
      { title: 'Landscape Design', description: 'Plan landscaping and green spaces', phase: 'design', priority: 'medium', ai_generated: true },
      { title: 'Environmental Permits', description: 'Obtain environmental approvals', phase: 'pre_construction', priority: 'high', ai_generated: true },
      { title: 'Site Preparation', description: 'Clear and prepare development site', phase: 'execution', priority: 'high', ai_generated: false },
      { title: 'Infrastructure Installation', description: 'Install utilities and infrastructure', phase: 'execution', priority: 'high', ai_generated: false },
    ],
    certifications: [
      { type: 'other', target_level: 'SITES Certified', requirements: { sustainable_sites: 'required' }, expected_weeks: 20 },
    ],
    defaultBudgetRange: { min: 200000, max: 3000000 },
    estimatedDuration: 50,
  },

  sustainable_green: {
    type: 'sustainable_green',
    name: 'Sustainable / Green Building',
    emoji: '🌱',
    description: 'Green building projects focused on LEED/IGBC/BREEAM certification.',
    emphasis: ['LEED/IGBC/BREEAM certification'],
    ai_focus: ['Energy simulations', 'Material sustainability analysis', 'IoT-driven compliance reporting'],
    phases: [
      { phase: 'concept', budget_percentage: 8, duration_weeks: 6 },
      { phase: 'design', budget_percentage: 22, duration_weeks: 16 },
      { phase: 'pre_construction', budget_percentage: 12, duration_weeks: 8 },
      { phase: 'execution', budget_percentage: 53, duration_weeks: 48 },
      { phase: 'handover', budget_percentage: 5, duration_weeks: 4 },
    ],
    tasks: [
      { title: 'Sustainability Goals Definition', description: 'Define green building targets', phase: 'concept', priority: 'high', ai_generated: true },
      { title: 'Energy Modeling', description: 'Comprehensive energy performance modeling', phase: 'design', priority: 'high', ai_generated: true },
      { title: 'Sustainable Material Selection', description: 'Select eco-friendly materials', phase: 'design', priority: 'high', ai_generated: true },
      { title: 'Green Technology Integration', description: 'Plan renewable energy systems', phase: 'design', priority: 'medium', ai_generated: true },
      { title: 'Commissioning Plan', description: 'Plan building systems commissioning', phase: 'pre_construction', priority: 'high', ai_generated: true },
      { title: 'Green Construction Practices', description: 'Implement sustainable construction methods', phase: 'execution', priority: 'high', ai_generated: true },
      { title: 'Performance Monitoring Setup', description: 'Install monitoring systems', phase: 'execution', priority: 'medium', ai_generated: true },
      { title: 'Certification Documentation', description: 'Compile certification submissions', phase: 'handover', priority: 'high', ai_generated: true },
    ],
    certifications: [
      { type: 'leed', target_level: 'Platinum', requirements: { energy_efficiency: 'required', water_conservation: 'required', materials: 'required' }, expected_weeks: 32 },
      { type: 'breeam', target_level: 'Excellent', requirements: { sustainability_performance: 'required' }, expected_weeks: 28 },
      { type: 'energy_star', requirements: { energy_performance: 'required' }, expected_weeks: 20 },
    ],
    defaultBudgetRange: { min: 800000, max: 8000000 },
    estimatedDuration: 82,
  },

  affordable_housing: {
    type: 'affordable_housing',
    name: 'Affordable Housing',
    emoji: '🏘️',
    description: 'Cost-optimized housing with speed, efficiency, and government compliance.',
    emphasis: ['Cost optimization', 'Speed', 'Government compliance'],
    ai_focus: ['Budget simulations', 'Prefabrication automation', 'Subsidy compliance checks'],
    phases: [
      { phase: 'concept', budget_percentage: 8, duration_weeks: 4 },
      { phase: 'design', budget_percentage: 12, duration_weeks: 8 },
      { phase: 'pre_construction', budget_percentage: 15, duration_weeks: 6 },
      { phase: 'execution', budget_percentage: 60, duration_weeks: 32 },
      { phase: 'handover', budget_percentage: 5, duration_weeks: 2 },
    ],
    tasks: [
      { title: 'Affordability Study', description: 'Analyze cost constraints and targets', phase: 'concept', priority: 'high', ai_generated: true },
      { title: 'Subsidy Application', description: 'Apply for government housing subsidies', phase: 'concept', priority: 'high', ai_generated: true },
      { title: 'Standardized Design', description: 'Create repeatable unit designs', phase: 'design', priority: 'high', ai_generated: true },
      { title: 'Prefabrication Planning', description: 'Plan modular construction approach', phase: 'design', priority: 'medium', ai_generated: true },
      { title: 'Bulk Procurement', description: 'Organize bulk material purchasing', phase: 'pre_construction', priority: 'high', ai_generated: true },
      { title: 'Rapid Construction', description: 'Execute fast-track construction', phase: 'execution', priority: 'high', ai_generated: false },
    ],
    certifications: [
      { type: 'iso', target_level: '9001', requirements: { quality_management: 'required' }, expected_weeks: 16 },
    ],
    defaultBudgetRange: { min: 300000, max: 2000000 },
    estimatedDuration: 52,
  },

  luxury: {
    type: 'luxury',
    name: 'Luxury / High-End Development',
    emoji: '🏖️',
    description: 'Premium developments with luxury interiors, smart automation, and resort-style amenities.',
    emphasis: ['Premium interiors', 'Smart automation', 'Resort-style amenities'],
    ai_focus: ['Generative design (luxury layouts)', 'Wellness certification (WELL, Fitwel)', 'Smart energy systems'],
    phases: [
      { phase: 'concept', budget_percentage: 5, duration_weeks: 6 },
      { phase: 'design', budget_percentage: 18, duration_weeks: 20 },
      { phase: 'pre_construction', budget_percentage: 12, duration_weeks: 10 },
      { phase: 'execution', budget_percentage: 60, duration_weeks: 64 },
      { phase: 'handover', budget_percentage: 5, duration_weeks: 6 },
    ],
    tasks: [
      { title: 'Luxury Market Analysis', description: 'Research high-end market demands', phase: 'concept', priority: 'high', ai_generated: true },
      { title: 'Premium Design Development', description: 'Create luxury architectural designs', phase: 'design', priority: 'high', ai_generated: true },
      { title: 'Smart Home Integration', description: 'Plan advanced automation systems', phase: 'design', priority: 'high', ai_generated: true },
      { title: 'Amenity Design', description: 'Design resort-style facilities', phase: 'design', priority: 'medium', ai_generated: true },
      { title: 'Luxury Material Procurement', description: 'Source premium materials and finishes', phase: 'pre_construction', priority: 'high', ai_generated: false },
      { title: 'High-End Construction', description: 'Execute luxury construction standards', phase: 'execution', priority: 'high', ai_generated: false },
      { title: 'Smart Systems Installation', description: 'Install premium automation systems', phase: 'execution', priority: 'high', ai_generated: false },
    ],
    certifications: [
      { type: 'well', target_level: 'Platinum', requirements: { wellness_features: 'required', luxury_amenities: 'required' }, expected_weeks: 24 },
      { type: 'leed', target_level: 'Gold', requirements: { energy_efficiency: 'required' }, expected_weeks: 20 },
    ],
    defaultBudgetRange: { min: 2000000, max: 20000000 },
    estimatedDuration: 106,
  },

  mixed_use: {
    type: 'mixed_use',
    name: 'Mixed-Use Development',
    emoji: '🏢',
    description: 'Integrated residential, commercial, and retail developments.',
    emphasis: ['Integration of residential + commercial + retail'],
    ai_focus: ['Crowd flow simulation', 'Zoning compliance', 'Multi-tenant facility optimization'],
    phases: [
      { phase: 'concept', budget_percentage: 8, duration_weeks: 8 },
      { phase: 'design', budget_percentage: 18, duration_weeks: 20 },
      { phase: 'pre_construction', budget_percentage: 12, duration_weeks: 12 },
      { phase: 'execution', budget_percentage: 57, duration_weeks: 72 },
      { phase: 'handover', budget_percentage: 5, duration_weeks: 4 },
    ],
    tasks: [
      { title: 'Mixed-Use Feasibility', description: 'Analyze viability of mixed-use concept', phase: 'concept', priority: 'high', ai_generated: true },
      { title: 'Zoning Analysis', description: 'Verify compliance with mixed-use zoning', phase: 'concept', priority: 'high', ai_generated: true },
      { title: 'Integrated Design', description: 'Design integrated building systems', phase: 'design', priority: 'high', ai_generated: true },
      { title: 'Traffic Flow Analysis', description: 'Simulate pedestrian and vehicle flow', phase: 'design', priority: 'medium', ai_generated: true },
      { title: 'Multi-Tenant Planning', description: 'Plan flexible tenant spaces', phase: 'design', priority: 'high', ai_generated: true },
      { title: 'Phased Construction', description: 'Execute multi-phase construction', phase: 'execution', priority: 'high', ai_generated: false },
    ],
    certifications: [
      { type: 'leed', target_level: 'Gold', requirements: { mixed_use_optimization: 'required' }, expected_weeks: 28 },
    ],
    defaultBudgetRange: { min: 3000000, max: 30000000 },
    estimatedDuration: 116,
  },

  co_living_working: {
    type: 'co_living_working',
    name: 'Co-living / Co-working Spaces',
    emoji: '👥',
    description: 'Flexible spaces with modern interiors, IoT integration, and quick turnover capability.',
    emphasis: ['Flexibility', 'Modern interiors', 'Quick turnover'],
    ai_focus: ['Space optimization', 'IoT integration for booking/usage', 'Wellness certification'],
    phases: [
      { phase: 'concept', budget_percentage: 12, duration_weeks: 4 },
      { phase: 'design', budget_percentage: 25, duration_weeks: 10 },
      { phase: 'pre_construction', budget_percentage: 13, duration_weeks: 4 },
      { phase: 'execution', budget_percentage: 45, duration_weeks: 16 },
      { phase: 'handover', budget_percentage: 5, duration_weeks: 2 },
    ],
    tasks: [
      { title: 'Space Utilization Study', description: 'Optimize shared space efficiency', phase: 'concept', priority: 'high', ai_generated: true },
      { title: 'Flexible Design System', description: 'Create adaptable space layouts', phase: 'design', priority: 'high', ai_generated: true },
      { title: 'IoT Infrastructure Planning', description: 'Plan smart booking and usage systems', phase: 'design', priority: 'high', ai_generated: true },
      { title: 'Community Amenity Design', description: 'Design shared amenity spaces', phase: 'design', priority: 'medium', ai_generated: true },
      { title: 'Smart Technology Installation', description: 'Install IoT and booking systems', phase: 'execution', priority: 'high', ai_generated: false },
      { title: 'Flexible Fit-out', description: 'Complete adaptable interior fit-out', phase: 'execution', priority: 'high', ai_generated: false },
    ],
    certifications: [
      { type: 'well', target_level: 'Gold', requirements: { community_wellness: 'required' }, expected_weeks: 18 },
    ],
    defaultBudgetRange: { min: 400000, max: 4000000 },
    estimatedDuration: 36,
  },

  redevelopment: {
    type: 'redevelopment',
    name: 'Redevelopment Projects',
    emoji: '🔄',
    description: 'Urban renewal projects with demolition, rehab, and sustainability focus.',
    emphasis: ['Demolition', 'Slum rehab', 'Urban renewal'],
    ai_focus: ['Material recovery', 'Compliance tracking', 'Resettlement planning', 'Sustainability proof'],
    phases: [
      { phase: 'concept', budget_percentage: 15, duration_weeks: 8 },
      { phase: 'design', budget_percentage: 20, duration_weeks: 16 },
      { phase: 'pre_construction', budget_percentage: 15, duration_weeks: 12 },
      { phase: 'execution', budget_percentage: 45, duration_weeks: 52 },
      { phase: 'handover', budget_percentage: 5, duration_weeks: 4 },
    ],
    tasks: [
      { title: 'Urban Analysis Study', description: 'Analyze existing urban conditions', phase: 'concept', priority: 'high', ai_generated: true },
      { title: 'Resettlement Planning', description: 'Plan temporary and permanent resettlement', phase: 'concept', priority: 'high', ai_generated: true },
      { title: 'Demolition Strategy', description: 'Plan systematic demolition approach', phase: 'design', priority: 'high', ai_generated: true },
      { title: 'Material Recovery Plan', description: 'Maximize material reuse and recycling', phase: 'design', priority: 'medium', ai_generated: true },
      { title: 'Community Engagement', description: 'Engage with affected communities', phase: 'pre_construction', priority: 'high', ai_generated: false },
      { title: 'Controlled Demolition', description: 'Execute safe demolition operations', phase: 'execution', priority: 'high', ai_generated: false },
      { title: 'New Construction', description: 'Build replacement structures', phase: 'execution', priority: 'high', ai_generated: false },
    ],
    certifications: [
      { type: 'iso', target_level: '45001', requirements: { safety_management: 'required' }, expected_weeks: 16 },
      { type: 'other', target_level: 'Circular Economy', requirements: { material_recovery: 'required' }, expected_weeks: 24 },
    ],
    defaultBudgetRange: { min: 1000000, max: 15000000 },
    estimatedDuration: 92,
  },
};

export const getProjectTemplate = (projectType: ProjectType): ProjectTemplate => {
  return PROJECT_TEMPLATES[projectType];
};

export const getAllProjectTemplates = (): ProjectTemplate[] => {
  return Object.values(PROJECT_TEMPLATES);
};