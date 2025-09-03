// CSV Parser utility for LEED v4.1 subcategories
import { LEEDSubcategory, LEEDTask } from './leedSubcategories';

export interface CSVRow {
  certification: string;
  'category id': string;
  category: string;
  'subcategory id': string;
  subcategory: string;
  'max score': string;
  version: string;
}

// Function to parse CSV content
export const parseCSV = (csvContent: string): CSVRow[] => {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1)
    .filter(line => line.trim() && !line.startsWith('certification')) // Skip header and empty lines
    .map(line => {
      const values = line.split(',').map(val => val.trim());
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header.trim()] = values[index] || '';
      });
      
      return row as CSVRow;
    });
};

// Function to convert CSV rows to LEEDSubcategory objects
export const convertCSVToSubcategories = (csvRows: CSVRow[]): LEEDSubcategory[] => {
  return csvRows.map(row => ({
    certification: row.certification,
    categoryId: row['category id'],
    category: row.category,
    subcategoryId: row['subcategory id'],
    subcategory: row.subcategory,
    maxScore: parseInt(row['max score']) || 0,
    version: row.version,
    isPrerequisite: row['subcategory id'].toLowerCase().includes('p') && !row['subcategory id'].toLowerCase().includes('rp')
  }));
};

// Function to load CSV data from public folder
export const loadCSVData = async (): Promise<LEEDSubcategory[]> => {
  try {
    const response = await fetch('/all_v4.1_subcategories.csv');
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.statusText}`);
    }
    
    const csvContent = await response.text();
    const csvRows = parseCSV(csvContent);
    return convertCSVToSubcategories(csvRows);
  } catch (error) {
    console.error('Error loading CSV data:', error);
    return [];
  }
};

// Function to get subcategories by certification type
export const getSubcategoriesByCertificationType = (
  subcategories: LEEDSubcategory[], 
  certificationType: string
): LEEDSubcategory[] => {
  return subcategories.filter(sub => 
    sub.certification.toLowerCase().includes(certificationType.toLowerCase())
  );
};

// Function to convert subcategories to tasks
export const convertSubcategoriesToTasks = (subcategories: LEEDSubcategory[]): LEEDTask[] => {
  return subcategories.map(sub => {
    // Determine project phase based on category
    let phase: LEEDTask['phase'] = 'execution';
    switch (sub.categoryId.toUpperCase()) {
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
      case 'EGGE': // Energy and Greenhouse Gas Emissions for Cities & Communities
        phase = 'execution';
        break;
      case 'IEQ':
      case 'QL': // Quality of Life for Cities & Communities
        phase = 'handover';
        break;
      case 'I':
      case 'RP':
      case 'NSE': // Natural Systems & Ecology for Cities & Communities
      case 'TL': // Transportation & Land Use for Cities & Communities
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

// Get available certification types
export const getAvailableCertificationTypes = (subcategories: LEEDSubcategory[]): string[] => {
  const types = new Set<string>();
  subcategories.forEach(sub => types.add(sub.certification));
  return Array.from(types).sort();
};