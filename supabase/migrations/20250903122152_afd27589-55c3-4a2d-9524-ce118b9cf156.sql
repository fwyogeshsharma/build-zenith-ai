-- Add certification_type column to certifications table
ALTER TABLE certifications ADD COLUMN certification_type text;

-- Add certification_type column to certificate_templates table  
ALTER TABLE certificate_templates ADD COLUMN certification_type text;

-- Update existing certificate_templates with appropriate types
UPDATE certificate_templates 
SET certification_type = CASE 
  WHEN type = 'leed_v4_1' THEN 'BD+C New Construction'
  WHEN type = 'leed_v4' THEN 'BD+C New Construction'
  WHEN type = 'breeam' THEN 'New Construction'
  WHEN type = 'well' THEN 'Core'
  ELSE 'New Construction'
END;

-- Insert additional LEED v4.1 templates for different certification types
INSERT INTO certificate_templates (type, name, description, certification_type, default_requirements, default_tasks, estimated_duration_weeks) VALUES
('leed_v4_1', 'LEED v4.1 BD+C Core and Shell', 'Building Design and Construction: Core and Shell certification for commercial buildings', 'BD+C Core and Shell', 
'[
  {"text": "Fundamental Commissioning of Building Energy Systems", "category": "Energy and Atmosphere", "mandatory": true},
  {"text": "Minimum Energy Performance", "category": "Energy and Atmosphere", "mandatory": true},
  {"text": "Building-Level Energy Metering", "category": "Energy and Atmosphere", "mandatory": true},
  {"text": "Fundamental Refrigerant Management", "category": "Energy and Atmosphere", "mandatory": true},
  {"text": "Storage and Collection of Recyclables", "category": "Materials and Resources", "mandatory": true},
  {"text": "Construction and Demolition Waste Management Planning", "category": "Materials and Resources", "mandatory": true}
]',
'[
  {"title": "Conduct Building Energy Commissioning", "phase": "construction", "priority": "high"},
  {"title": "Install Energy Metering Systems", "phase": "construction", "priority": "high"},
  {"title": "Implement Waste Management Plan", "phase": "construction", "priority": "medium"},
  {"title": "Design HVAC Systems", "phase": "design_development", "priority": "high"}
]', 52),

('leed_v4_1', 'LEED v4.1 BD+C Schools', 'Building Design and Construction: Schools certification for educational facilities', 'BD+C Schools',
'[
  {"text": "Enhanced Commissioning", "category": "Energy and Atmosphere", "mandatory": false},
  {"text": "Acoustic Performance", "category": "Indoor Environmental Quality", "mandatory": true},
  {"text": "Environmental Tobacco Smoke Control", "category": "Indoor Environmental Quality", "mandatory": true},
  {"text": "Mold Prevention", "category": "Indoor Environmental Quality", "mandatory": true}
]',
'[
  {"title": "Design Acoustic Systems", "phase": "design_development", "priority": "high"},
  {"title": "Implement Mold Prevention Strategies", "phase": "construction", "priority": "high"},
  {"title": "Install Air Quality Monitoring", "phase": "construction", "priority": "medium"}
]', 48),

('leed_v4_1', 'LEED v4.1 BD+C Retail', 'Building Design and Construction: Retail certification for retail spaces', 'BD+C Retail',
'[
  {"text": "Bicycle Facilities", "category": "Transportation", "mandatory": false},
  {"text": "Reduced Parking Footprint", "category": "Transportation", "mandatory": false},
  {"text": "Daylight", "category": "Indoor Environmental Quality", "mandatory": false}
]',
'[
  {"title": "Design Bicycle Storage Areas", "phase": "design_development", "priority": "medium"},
  {"title": "Optimize Parking Layout", "phase": "schematic_design", "priority": "medium"},
  {"title": "Maximize Natural Lighting", "phase": "design_development", "priority": "medium"}
]', 40);