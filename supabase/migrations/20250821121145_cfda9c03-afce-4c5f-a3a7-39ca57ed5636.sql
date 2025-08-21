-- Insert LEED v4.1 certificate template
INSERT INTO certificate_templates (
  name,
  type,
  description,
  estimated_duration_weeks,
  lifecycle_phases,
  default_requirements,
  default_tasks
) VALUES (
  'LEED v4.1 Template',
  'leed',
  'LEED v4.1 Building Design and Construction certification template with comprehensive requirements and tasks',
  24,
  ARRAY['planning_design', 'construction', 'commissioning_handover'],
  '[
    {
      "category": "Integrative Process",
      "mandatory": true,
      "text": "Conduct integrative design process with all project team members"
    },
    {
      "category": "Location and Transportation",
      "mandatory": true,
      "text": "Select location near diverse uses and public transportation"
    },
    {
      "category": "Sustainable Sites",
      "mandatory": true,
      "text": "Implement construction activity pollution prevention"
    },
    {
      "category": "Water Efficiency",
      "mandatory": true,
      "text": "Reduce outdoor water use by 30%"
    },
    {
      "category": "Water Efficiency",
      "mandatory": true,
      "text": "Reduce indoor water use by 20%"
    },
    {
      "category": "Energy and Atmosphere",
      "mandatory": true,
      "text": "Fundamental commissioning and verification"
    },
    {
      "category": "Energy and Atmosphere",
      "mandatory": true,
      "text": "Minimum energy performance (5% better than baseline)"
    },
    {
      "category": "Energy and Atmosphere",
      "mandatory": true,
      "text": "Building-level energy metering"
    },
    {
      "category": "Energy and Atmosphere",
      "mandatory": true,
      "text": "Fundamental refrigerant management"
    },
    {
      "category": "Materials and Resources",
      "mandatory": true,
      "text": "Storage and collection of recyclables"
    },
    {
      "category": "Materials and Resources",
      "mandatory": true,
      "text": "Construction and demolition waste management planning"
    },
    {
      "category": "Indoor Environmental Quality",
      "mandatory": true,
      "text": "Minimum indoor air quality performance"
    },
    {
      "category": "Indoor Environmental Quality",
      "mandatory": true,
      "text": "Environmental tobacco smoke control"
    },
    {
      "category": "Energy and Atmosphere",
      "mandatory": false,
      "text": "Optimize energy performance (up to 18 points)"
    },
    {
      "category": "Energy and Atmosphere",
      "mandatory": false,
      "text": "Advanced energy metering"
    },
    {
      "category": "Energy and Atmosphere",
      "mandatory": false,
      "text": "Demand response program"
    },
    {
      "category": "Energy and Atmosphere",
      "mandatory": false,
      "text": "Renewable energy production (up to 3 points)"
    },
    {
      "category": "Water Efficiency",
      "mandatory": false,
      "text": "Cooling tower water use"
    },
    {
      "category": "Water Efficiency",
      "mandatory": false,
      "text": "Water metering"
    },
    {
      "category": "Materials and Resources",
      "mandatory": false,
      "text": "Building product disclosure and optimization - sourcing"
    },
    {
      "category": "Materials and Resources",
      "mandatory": false,
      "text": "Construction and demolition waste management (up to 2 points)"
    },
    {
      "category": "Indoor Environmental Quality",
      "mandatory": false,
      "text": "Enhanced indoor air quality strategies"
    },
    {
      "category": "Indoor Environmental Quality",
      "mandatory": false,
      "text": "Low-emitting materials (up to 3 points)"
    },
    {
      "category": "Indoor Environmental Quality",
      "mandatory": false,
      "text": "Construction indoor air quality management plan"
    },
    {
      "category": "Indoor Environmental Quality",
      "mandatory": false,
      "text": "Indoor air quality assessment"
    },
    {
      "category": "Indoor Environmental Quality",
      "mandatory": false,
      "text": "Thermal comfort"
    },
    {
      "category": "Indoor Environmental Quality",
      "mandatory": false,
      "text": "Interior lighting (up to 2 points)"
    },
    {
      "category": "Indoor Environmental Quality",
      "mandatory": false,
      "text": "Daylight (up to 3 points)"
    },
    {
      "category": "Indoor Environmental Quality",
      "mandatory": false,
      "text": "Quality views"
    },
    {
      "category": "Indoor Environmental Quality",
      "mandatory": false,
      "text": "Acoustic performance"
    },
    {
      "category": "Sustainable Sites",
      "mandatory": false,
      "text": "Site assessment"
    },
    {
      "category": "Sustainable Sites",
      "mandatory": false,
      "text": "Site development - protect or restore habitat"
    },
    {
      "category": "Sustainable Sites",
      "mandatory": false,
      "text": "Open space"
    },
    {
      "category": "Sustainable Sites",
      "mandatory": false,
      "text": "Rainwater management (up to 3 points)"
    },
    {
      "category": "Sustainable Sites",
      "mandatory": false,
      "text": "Heat island reduction (up to 2 points)"
    },
    {
      "category": "Sustainable Sites",
      "mandatory": false,
      "text": "Light pollution reduction"
    },
    {
      "category": "Location and Transportation",
      "mandatory": false,
      "text": "Bicycle facilities"
    },
    {
      "category": "Location and Transportation",
      "mandatory": false,
      "text": "Reduced parking footprint"
    },
    {
      "category": "Location and Transportation",
      "mandatory": false,
      "text": "Green vehicles"
    },
    {
      "category": "Innovation",
      "mandatory": false,
      "text": "Innovation in design (up to 5 points)"
    },
    {
      "category": "Innovation",
      "mandatory": false,
      "text": "LEED Accredited Professional"
    },
    {
      "category": "Regional Priority",
      "mandatory": false,
      "text": "Regional priority credits (up to 4 points)"
    }
  ]'::jsonb,
  '[
    {
      "title": "Integrative Design Workshop",
      "phase": "design",
      "priority": "high"
    },
    {
      "title": "Site Selection Analysis",
      "phase": "design", 
      "priority": "high"
    },
    {
      "title": "Transportation Survey",
      "phase": "design",
      "priority": "medium"
    },
    {
      "title": "Erosion and Sedimentation Control Plan",
      "phase": "pre_construction",
      "priority": "high"
    },
    {
      "title": "Water Efficient Landscaping Design",
      "phase": "design",
      "priority": "medium"
    },
    {
      "title": "Low-Flow Fixtures Specification",
      "phase": "design",
      "priority": "medium"
    },
    {
      "title": "Water Metering Installation",
      "phase": "execution",
      "priority": "medium"
    },
    {
      "title": "Energy Modeling and Analysis",
      "phase": "design",
      "priority": "high"
    },
    {
      "title": "Commissioning Agent Selection",
      "phase": "design",
      "priority": "high"
    },
    {
      "title": "Building Energy Simulation",
      "phase": "design",
      "priority": "high"
    },
    {
      "title": "Energy Metering System Installation",
      "phase": "execution",
      "priority": "high"
    },
    {
      "title": "HVAC Systems Commissioning",
      "phase": "handover",
      "priority": "high"
    },
    {
      "title": "Refrigerant Management Plan",
      "phase": "design",
      "priority": "medium"
    },
    {
      "title": "Construction Waste Management Plan",
      "phase": "pre_construction",
      "priority": "high"
    },
    {
      "title": "Recycling Collection Areas Design",
      "phase": "design",
      "priority": "medium"
    },
    {
      "title": "Sustainable Materials Procurement",
      "phase": "pre_construction",
      "priority": "medium"
    },
    {
      "title": "Material Health Verification",
      "phase": "pre_construction",
      "priority": "medium"
    },
    {
      "title": "Construction IAQ Management Plan",
      "phase": "pre_construction",
      "priority": "high"
    },
    {
      "title": "Low-Emitting Materials Selection",
      "phase": "design",
      "priority": "medium"
    },
    {
      "title": "Ventilation System Design",
      "phase": "design",
      "priority": "high"
    },
    {
      "title": "Daylight and Views Analysis", 
      "phase": "design",
      "priority": "medium"
    },
    {
      "title": "Thermal Comfort System Design",
      "phase": "design",
      "priority": "medium"
    },
    {
      "title": "Acoustic Design and Analysis",
      "phase": "design",
      "priority": "medium"
    },
    {
      "title": "Indoor Air Quality Testing",
      "phase": "handover",
      "priority": "high"
    },
    {
      "title": "Site Habitat Assessment",
      "phase": "design",
      "priority": "medium"
    },
    {
      "title": "Stormwater Management Design",
      "phase": "design",
      "priority": "high"
    },
    {
      "title": "Heat Island Reduction Measures",
      "phase": "design",
      "priority": "medium"
    },
    {
      "title": "Light Pollution Control Plan",
      "phase": "design",
      "priority": "medium"
    },
    {
      "title": "Bicycle Storage and Facilities",
      "phase": "design",
      "priority": "low"
    },
    {
      "title": "EV Charging Infrastructure",
      "phase": "design",
      "priority": "low"
    },
    {
      "title": "LEED Documentation Package Preparation",
      "phase": "handover",
      "priority": "high"
    },
    {
      "title": "LEED Scorecard Tracking",
      "phase": "execution",
      "priority": "high"
    },
    {
      "title": "Regional Priority Credits Analysis",
      "phase": "design", 
      "priority": "low"
    },
    {
      "title": "Innovation Strategy Development",
      "phase": "design",
      "priority": "low"
    },
    {
      "title": "LEED AP Coordination",
      "phase": "design",
      "priority": "medium"
    }
  ]'::jsonb
);