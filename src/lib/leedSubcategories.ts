// LEED v4.1 Subcategories Parser
import { loadCSVData, getSubcategoriesByCertificationType, convertSubcategoriesToTasks, getAvailableCertificationTypes } from './csvParser';

export interface LEEDSubcategory {
  certification: string;
  categoryId: string;
  category: string;
  subcategoryId: string;
  subcategory: string;
  maxScore: number;
  version: string;
  isPrerequisite: boolean;
}

export interface LEEDTask {
  title: string;
  description: string;
  category: string;
  subcategoryId: string;
  maxScore: number;
  phase: 'design' | 'pre_construction' | 'execution' | 'handover' | 'operations_maintenance';
  priority: 'low' | 'medium' | 'high';
  isPrerequisite: boolean;
}

// Cache for CSV data
let csvSubcategories: LEEDSubcategory[] | null = null;

// Function to ensure CSV data is loaded
const ensureCSVDataLoaded = async (): Promise<LEEDSubcategory[]> => {
  if (!csvSubcategories) {
    csvSubcategories = await loadCSVData();
  }
  return csvSubcategories;
};

// Legacy hardcoded data - now replaced by CSV data
export const LEED_V4_1_BD_C_SUBCATEGORIES: LEEDSubcategory[] = [
  // Integrative Process (IP)
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "IP",
    category: "Integrative Process",
    subcategoryId: "IPc1",
    subcategory: "Integrative Process",
    maxScore: 1,
    version: "v4.1",
    isPrerequisite: false
  },

  // Location and Transportation (LT)
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "LT",
    category: "Location and Transportation",
    subcategoryId: "LTc1",
    subcategory: "Sensitive Land Protection",
    maxScore: 1,
    version: "v4.1",
    isPrerequisite: false
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "LT",
    category: "Location and Transportation",
    subcategoryId: "LTc2",
    subcategory: "High-Priority Site and Equitable Development",
    maxScore: 2,
    version: "v4.1",
    isPrerequisite: false
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "LT",
    category: "Location and Transportation",
    subcategoryId: "LTc3",
    subcategory: "Surrounding Density and Diverse Uses",
    maxScore: 5,
    version: "v4.1",
    isPrerequisite: false
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "LT",
    category: "Location and Transportation",
    subcategoryId: "LTc4",
    subcategory: "Access to Quality Transit",
    maxScore: 5,
    version: "v4.1",
    isPrerequisite: false
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "LT",
    category: "Location and Transportation",
    subcategoryId: "LTc5",
    subcategory: "Bicycle Facilities",
    maxScore: 1,
    version: "v4.1",
    isPrerequisite: false
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "LT",
    category: "Location and Transportation",
    subcategoryId: "LTc6",
    subcategory: "Reduced Parking Footprint",
    maxScore: 1,
    version: "v4.1",
    isPrerequisite: false
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "LT",
    category: "Location and Transportation",
    subcategoryId: "LTc7",
    subcategory: "Electric Vehicles",
    maxScore: 1,
    version: "v4.1",
    isPrerequisite: false
  },

  // Sustainable Sites (SS)
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "SS",
    category: "Sustainable Sites",
    subcategoryId: "SSp1",
    subcategory: "Construction Activity Pollution Prevention",
    maxScore: 0,
    version: "v4.1",
    isPrerequisite: true
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "SS",
    category: "Sustainable Sites",
    subcategoryId: "SSc1",
    subcategory: "Site Assessment",
    maxScore: 1,
    version: "v4.1",
    isPrerequisite: false
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "SS",
    category: "Sustainable Sites",
    subcategoryId: "SSc2",
    subcategory: "Protect or Restore Habitat",
    maxScore: 2,
    version: "v4.1",
    isPrerequisite: false
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "SS",
    category: "Sustainable Sites",
    subcategoryId: "SSc3",
    subcategory: "Open Space",
    maxScore: 1,
    version: "v4.1",
    isPrerequisite: false
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "SS",
    category: "Sustainable Sites",
    subcategoryId: "SSc4",
    subcategory: "Rainwater Management",
    maxScore: 3,
    version: "v4.1",
    isPrerequisite: false
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "SS",
    category: "Sustainable Sites",
    subcategoryId: "SSc5",
    subcategory: "Heat Island Reduction",
    maxScore: 2,
    version: "v4.1",
    isPrerequisite: false
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "SS",
    category: "Sustainable Sites",
    subcategoryId: "SSc6",
    subcategory: "Light Pollution Reduction",
    maxScore: 1,
    version: "v4.1",
    isPrerequisite: false
  },

  // Water Efficiency (WE)
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "WE",
    category: "Water Efficiency",
    subcategoryId: "WEp1",
    subcategory: "Outdoor Water Use Reduction",
    maxScore: 0,
    version: "v4.1",
    isPrerequisite: true
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "WE",
    category: "Water Efficiency",
    subcategoryId: "WEp2",
    subcategory: "Indoor Water Use Reduction",
    maxScore: 0,
    version: "v4.1",
    isPrerequisite: true
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "WE",
    category: "Water Efficiency",
    subcategoryId: "WEp3",
    subcategory: "Building-Level Water Metering",
    maxScore: 0,
    version: "v4.1",
    isPrerequisite: true
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "WE",
    category: "Water Efficiency",
    subcategoryId: "WEc1",
    subcategory: "Outdoor Water Use Reduction",
    maxScore: 2,
    version: "v4.1",
    isPrerequisite: false
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "WE",
    category: "Water Efficiency",
    subcategoryId: "WEc3",
    subcategory: "Indoor Water Use Reduction",
    maxScore: 6,
    version: "v4.1",
    isPrerequisite: false
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "WE",
    category: "Water Efficiency",
    subcategoryId: "WEc4",
    subcategory: "Optimize Process Water Use",
    maxScore: 2,
    version: "v4.1",
    isPrerequisite: false
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "WE",
    category: "Water Efficiency",
    subcategoryId: "WEc5",
    subcategory: "Water Metering",
    maxScore: 1,
    version: "v4.1",
    isPrerequisite: false
  },

  // Energy and Atmosphere (EA)
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "EA",
    category: "Energy and Atmosphere",
    subcategoryId: "EAp1",
    subcategory: "Fundamental Commissioning and Verification",
    maxScore: 0,
    version: "v4.1",
    isPrerequisite: true
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "EA",
    category: "Energy and Atmosphere",
    subcategoryId: "EAp2",
    subcategory: "Minimum Energy Performance",
    maxScore: 0,
    version: "v4.1",
    isPrerequisite: true
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "EA",
    category: "Energy and Atmosphere",
    subcategoryId: "EAp3",
    subcategory: "Building-Level Energy Metering",
    maxScore: 0,
    version: "v4.1",
    isPrerequisite: true
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "EA",
    category: "Energy and Atmosphere",
    subcategoryId: "EAp4",
    subcategory: "Fundamental Refrigerant Management",
    maxScore: 0,
    version: "v4.1",
    isPrerequisite: true
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "EA",
    category: "Energy and Atmosphere",
    subcategoryId: "EAc1",
    subcategory: "Enhanced Commissioning",
    maxScore: 6,
    version: "v4.1",
    isPrerequisite: false
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "EA",
    category: "Energy and Atmosphere",
    subcategoryId: "EAc2",
    subcategory: "Optimize Energy Performance",
    maxScore: 18,
    version: "v4.1",
    isPrerequisite: false
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "EA",
    category: "Energy and Atmosphere",
    subcategoryId: "EAc3",
    subcategory: "Advanced Energy Metering",
    maxScore: 1,
    version: "v4.1",
    isPrerequisite: false
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "EA",
    category: "Energy and Atmosphere",
    subcategoryId: "EAc4",
    subcategory: "Grid Harmonization",
    maxScore: 2,
    version: "v4.1",
    isPrerequisite: false
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "EA",
    category: "Energy and Atmosphere",
    subcategoryId: "EAc5",
    subcategory: "Renewable Energy",
    maxScore: 5,
    version: "v4.1",
    isPrerequisite: false
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "EA",
    category: "Energy and Atmosphere",
    subcategoryId: "EAc6",
    subcategory: "Enhanced Refrigerant Management",
    maxScore: 1,
    version: "v4.1",
    isPrerequisite: false
  },

  // Materials and Resources (MR)
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "MR",
    category: "Materials and Resources",
    subcategoryId: "MRp1",
    subcategory: "Storage and Collection of Recyclables",
    maxScore: 0,
    version: "v4.1",
    isPrerequisite: true
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "MR",
    category: "Materials and Resources",
    subcategoryId: "MRc1",
    subcategory: "Building Life-Cycle Impact Reduction",
    maxScore: 5,
    version: "v4.1",
    isPrerequisite: false
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "MR",
    category: "Materials and Resources",
    subcategoryId: "MRc2",
    subcategory: "Environmental Product Declarations",
    maxScore: 2,
    version: "v4.1",
    isPrerequisite: false
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "MR",
    category: "Materials and Resources",
    subcategoryId: "MRc3",
    subcategory: "Sourcing of Raw Materials",
    maxScore: 2,
    version: "v4.1",
    isPrerequisite: false
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "MR",
    category: "Materials and Resources",
    subcategoryId: "MRc4",
    subcategory: "Material Ingredients",
    maxScore: 2,
    version: "v4.1",
    isPrerequisite: false
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "MR",
    category: "Materials and Resources",
    subcategoryId: "MRc5",
    subcategory: "Construction and Demolition Waste Management",
    maxScore: 2,
    version: "v4.1",
    isPrerequisite: false
  },

  // Indoor Environmental Quality (IEQ)
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "IEQ",
    category: "Indoor Environmental Quality",
    subcategoryId: "IEQp1",
    subcategory: "Minimum Indoor Air Quality Performance",
    maxScore: 0,
    version: "v4.1",
    isPrerequisite: true
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "IEQ",
    category: "Indoor Environmental Quality",
    subcategoryId: "IEQp2",
    subcategory: "Environmental Tobacco Smoke Control",
    maxScore: 0,
    version: "v4.1",
    isPrerequisite: true
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "IEQ",
    category: "Indoor Environmental Quality",
    subcategoryId: "IEQc1",
    subcategory: "Enhanced Indoor Air Quality Strategies",
    maxScore: 2,
    version: "v4.1",
    isPrerequisite: false
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "IEQ",
    category: "Indoor Environmental Quality",
    subcategoryId: "IEQc2",
    subcategory: "Low-Emitting Materials",
    maxScore: 3,
    version: "v4.1",
    isPrerequisite: false
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "IEQ",
    category: "Indoor Environmental Quality",
    subcategoryId: "IEQc3",
    subcategory: "Construction Indoor Air Quality Management Plan",
    maxScore: 1,
    version: "v4.1",
    isPrerequisite: false
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "IEQ",
    category: "Indoor Environmental Quality",
    subcategoryId: "IEQc4",
    subcategory: "Indoor Air Quality Assessment",
    maxScore: 2,
    version: "v4.1",
    isPrerequisite: false
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "IEQ",
    category: "Indoor Environmental Quality",
    subcategoryId: "IEQc5",
    subcategory: "Thermal Comfort",
    maxScore: 1,
    version: "v4.1",
    isPrerequisite: false
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "IEQ",
    category: "Indoor Environmental Quality",
    subcategoryId: "IEQc6",
    subcategory: "Interior Lighting",
    maxScore: 2,
    version: "v4.1",
    isPrerequisite: false
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "IEQ",
    category: "Indoor Environmental Quality",
    subcategoryId: "IEQc7",
    subcategory: "Daylight",
    maxScore: 3,
    version: "v4.1",
    isPrerequisite: false
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "IEQ",
    category: "Indoor Environmental Quality",
    subcategoryId: "IEQc8",
    subcategory: "Quality Views",
    maxScore: 1,
    version: "v4.1",
    isPrerequisite: false
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "IEQ",
    category: "Indoor Environmental Quality",
    subcategoryId: "IEQc9",
    subcategory: "Acoustic Performance",
    maxScore: 1,
    version: "v4.1",
    isPrerequisite: false
  },

  // Innovation (I)
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "I",
    category: "Innovation",
    subcategoryId: "Ic1",
    subcategory: "Innovation",
    maxScore: 5,
    version: "v4.1",
    isPrerequisite: false
  },
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "I",
    category: "Innovation",
    subcategoryId: "Ic2",
    subcategory: "LEED Accredited Professional",
    maxScore: 1,
    version: "v4.1",
    isPrerequisite: false
  },

  // Regional Priority (RP)
  {
    certification: "Building Design and Construction: New Construction",
    categoryId: "RP",
    category: "Regional Priority",
    subcategoryId: "RPc1",
    subcategory: "Regional Priority",
    maxScore: 4,
    version: "v4.1",
    isPrerequisite: false
  }
];

// Get tasks by certification type (dynamic from CSV)
export const getTasksByCertificationType = async (certificationType: string): Promise<LEEDTask[]> => {
  const allSubcategories = await ensureCSVDataLoaded();
  const filteredSubcategories = getSubcategoriesByCertificationType(allSubcategories, certificationType);
  return convertSubcategoriesToTasks(filteredSubcategories);
};

// Get available LEED certification types
export const getAvailableLEEDCertificationTypes = async (): Promise<string[]> => {
  const allSubcategories = await ensureCSVDataLoaded();
  return getAvailableCertificationTypes(allSubcategories);
};

// Get LEED v4.1 BD+C tasks (backward compatibility - now uses CSV data)
export const getLEEDv41BDCTasks = async (): Promise<LEEDTask[]> => {
  return await getTasksByCertificationType('Building Design and Construction: New Construction');
};

// Synchronous version for backward compatibility (falls back to hardcoded data)
export const getLEEDv41BDCTasksSync = (): LEEDTask[] => {
  return convertSubcategoriesToTasksLegacy(LEED_V4_1_BD_C_SUBCATEGORIES);
};

// Legacy function for backward compatibility
const convertSubcategoriesToTasksLegacy = (subcategories: LEEDSubcategory[]): LEEDTask[] => {
  return subcategories.map(sub => {
    // Determine project phase based on category
    let phase: LEEDTask['phase'] = 'execution';
    switch (sub.categoryId) {
      case 'IP':
        phase = 'design';
        break;
      case 'LT':
      case 'SS':
        phase = 'pre_construction';
        break;
      case 'WE':
      case 'EA':
      case 'MR':
        phase = 'execution';
        break;
      case 'IEQ':
        phase = 'handover';
        break;
      case 'I':
      case 'RP':
        phase = 'operations_maintenance';
        break;
    }

    // Determine priority based on max score and prerequisite status
    let priority: LEEDTask['priority'] = 'medium';
    if (sub.isPrerequisite) {
      priority = 'high';
    } else if (sub.maxScore >= 5) {
      priority = 'high';
    } else if (sub.maxScore <= 1) {
      priority = 'low';
    }

    return {
      title: `${sub.subcategoryId}: ${sub.subcategory}`,
      description: `LEED v4.1 ${sub.category} - ${sub.subcategory}${sub.isPrerequisite ? ' (Prerequisite)' : ''} - Maximum ${sub.maxScore} point${sub.maxScore !== 1 ? 's' : ''}`,
      category: sub.category,
      subcategoryId: sub.subcategoryId,
      maxScore: sub.maxScore,
      phase,
      priority,
      isPrerequisite: sub.isPrerequisite
    };
  });
};

// Get tasks by category (dynamic from CSV)
export const getTasksByCategory = async (categoryId: string, certificationType: string = 'Building Design and Construction: New Construction'): Promise<LEEDTask[]> => {
  const tasks = await getTasksByCertificationType(certificationType);
  const allSubcategories = await ensureCSVDataLoaded();
  return tasks.filter(task => 
    allSubcategories.find(sub => 
      sub.subcategoryId === task.subcategoryId && 
      sub.certification.includes(certificationType)
    )?.categoryId === categoryId
  );
};

// Get all categories for a certification type (dynamic from CSV)
export const getAllCategories = async (certificationType: string = 'Building Design and Construction: New Construction'): Promise<{ id: string; name: string; taskCount: number }[]> => {
  const allSubcategories = await ensureCSVDataLoaded();
  const filteredSubcategories = getSubcategoriesByCertificationType(allSubcategories, certificationType);
  const categoryCounts: { [key: string]: { name: string; count: number } } = {};
  
  filteredSubcategories.forEach(sub => {
    if (!categoryCounts[sub.categoryId]) {
      categoryCounts[sub.categoryId] = { name: sub.category, count: 0 };
    }
    categoryCounts[sub.categoryId].count++;
  });

  return Object.keys(categoryCounts).map(id => ({
    id,
    name: categoryCounts[id].name,
    taskCount: categoryCounts[id].count
  }));
};

// Get total possible points for a certification type (dynamic from CSV)
export const getTotalPossiblePoints = async (certificationType: string = 'Building Design and Construction: New Construction'): Promise<number> => {
  const allSubcategories = await ensureCSVDataLoaded();
  const filteredSubcategories = getSubcategoriesByCertificationType(allSubcategories, certificationType);
  return filteredSubcategories.reduce((total, sub) => total + sub.maxScore, 0);
};

// Get prerequisites count for a certification type (dynamic from CSV)
export const getPrerequisitesCount = async (certificationType: string = 'Building Design and Construction: New Construction'): Promise<number> => {
  const allSubcategories = await ensureCSVDataLoaded();
  const filteredSubcategories = getSubcategoriesByCertificationType(allSubcategories, certificationType);
  return filteredSubcategories.filter(sub => sub.isPrerequisite).length;
};

// Backward compatibility - synchronous versions using hardcoded data
export const getAllCategoriesSync = (): { id: string; name: string; taskCount: number }[] => {
  const categoryCounts: { [key: string]: { name: string; count: number } } = {};
  
  LEED_V4_1_BD_C_SUBCATEGORIES.forEach(sub => {
    if (!categoryCounts[sub.categoryId]) {
      categoryCounts[sub.categoryId] = { name: sub.category, count: 0 };
    }
    categoryCounts[sub.categoryId].count++;
  });

  return Object.keys(categoryCounts).map(id => ({
    id,
    name: categoryCounts[id].name,
    taskCount: categoryCounts[id].count
  }));
};

export const getTotalPossiblePointsSync = (): number => {
  return LEED_V4_1_BD_C_SUBCATEGORIES.reduce((total, sub) => total + sub.maxScore, 0);
};

export const getPrerequisitesCountSync = (): number => {
  return LEED_V4_1_BD_C_SUBCATEGORIES.filter(sub => sub.isPrerequisite).length;
};