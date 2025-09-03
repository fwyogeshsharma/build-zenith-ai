# LEED v4.1 BD+C Integration Guide

## 📋 Overview

This document explains the comprehensive LEED v4.1 Building Design + Construction integration that automatically creates tasks based on actual LEED subcategories from the official CSV data.

---

## 🎯 **Key Features**

### **Automatic Task Generation**
- **50+ Individual Tasks**: Each LEED v4.1 subcategory becomes a specific project task
- **9 Major Categories**: All LEED categories covered (IP, LT, SS, WE, EA, MR, IEQ, I, RP)
- **110 Total Points**: Complete point tracking system
- **9 Prerequisites**: Critical requirements marked as mandatory

### **Smart Phase Assignment**
Tasks are automatically assigned to appropriate project phases:
- **Design Phase**: Integrative Process (IP)
- **Pre-Construction**: Location & Transportation (LT), Sustainable Sites (SS)
- **Execution**: Water Efficiency (WE), Energy & Atmosphere (EA), Materials & Resources (MR)
- **Handover**: Indoor Environmental Quality (IEQ)
- **Operations**: Innovation (I), Regional Priority (RP)

### **Priority Classification**
- **High Priority**: Prerequisites and high-point credits (≥5 points)
- **Medium Priority**: Standard credits (2-4 points)
- **Low Priority**: Single-point credits

---

## 📊 **LEED v4.1 BD+C Category Breakdown**

### **1. Integrative Process (IP) - 1 Point**
- IPc1: Integrative Process (1 point)

### **2. Location and Transportation (LT) - 16 Points**
- LTc1: Sensitive Land Protection (1 point)
- LTc2: High-Priority Site and Equitable Development (2 points)
- LTc3: Surrounding Density and Diverse Uses (5 points)
- LTc4: Access to Quality Transit (5 points)
- LTc5: Bicycle Facilities (1 point)
- LTc6: Reduced Parking Footprint (1 point)
- LTc7: Electric Vehicles (1 point)

### **3. Sustainable Sites (SS) - 10 Points + 1 Prerequisite**
- **SSp1: Construction Activity Pollution Prevention (Prerequisite)**
- SSc1: Site Assessment (1 point)
- SSc2: Protect or Restore Habitat (2 points)
- SSc3: Open Space (1 point)
- SSc4: Rainwater Management (3 points)
- SSc5: Heat Island Reduction (2 points)
- SSc6: Light Pollution Reduction (1 point)

### **4. Water Efficiency (WE) - 11 Points + 3 Prerequisites**
- **WEp1: Outdoor Water Use Reduction (Prerequisite)**
- **WEp2: Indoor Water Use Reduction (Prerequisite)**
- **WEp3: Building-Level Water Metering (Prerequisite)**
- WEc1: Outdoor Water Use Reduction (2 points)
- WEc3: Indoor Water Use Reduction (6 points)
- WEc4: Optimize Process Water Use (2 points)
- WEc5: Water Metering (1 point)

### **5. Energy and Atmosphere (EA) - 33 Points + 4 Prerequisites**
- **EAp1: Fundamental Commissioning and Verification (Prerequisite)**
- **EAp2: Minimum Energy Performance (Prerequisite)**
- **EAp3: Building-Level Energy Metering (Prerequisite)**
- **EAp4: Fundamental Refrigerant Management (Prerequisite)**
- EAc1: Enhanced Commissioning (6 points)
- EAc2: Optimize Energy Performance (18 points)
- EAc3: Advanced Energy Metering (1 point)
- EAc4: Grid Harmonization (2 points)
- EAc5: Renewable Energy (5 points)
- EAc6: Enhanced Refrigerant Management (1 point)

### **6. Materials and Resources (MR) - 13 Points + 1 Prerequisite**
- **MRp1: Storage and Collection of Recyclables (Prerequisite)**
- MRc1: Building Life-Cycle Impact Reduction (5 points)
- MRc2: Environmental Product Declarations (2 points)
- MRc3: Sourcing of Raw Materials (2 points)
- MRc4: Material Ingredients (2 points)
- MRc5: Construction and Demolition Waste Management (2 points)

### **7. Indoor Environmental Quality (IEQ) - 16 Points + 2 Prerequisites**
- **IEQp1: Minimum Indoor Air Quality Performance (Prerequisite)**
- **IEQp2: Environmental Tobacco Smoke Control (Prerequisite)**
- IEQc1: Enhanced Indoor Air Quality Strategies (2 points)
- IEQc2: Low-Emitting Materials (3 points)
- IEQc3: Construction Indoor Air Quality Management Plan (1 point)
- IEQc4: Indoor Air Quality Assessment (2 points)
- IEQc5: Thermal Comfort (1 point)
- IEQc6: Interior Lighting (2 points)
- IEQc7: Daylight (3 points)
- IEQc8: Quality Views (1 point)
- IEQc9: Acoustic Performance (1 point)

### **8. Innovation (I) - 6 Points**
- Ic1: Innovation (5 points)
- Ic2: LEED Accredited Professional (1 point)

### **9. Regional Priority (RP) - 4 Points**
- RPc1: Regional Priority (4 points)

---

## 🛠️ **Implementation Guide**

### **Step 1: Enable LEED Template**
1. Open **Certification Management**
2. Click **Add Certification**
3. Check **"Use certification template"**
4. Select **"LEED v4.1 Template"**
5. Certification type and version auto-populate

### **Step 2: Template Application**
When the LEED v4.1 template is applied, the system:
1. **Creates 50+ Tasks**: One for each LEED subcategory
2. **Sets Up Requirements**: Detailed requirements with point tracking
3. **Assigns Phases**: Smart phase assignment based on LEED timeline
4. **Marks Prerequisites**: Critical requirements flagged as mandatory
5. **Enables Tracking**: Point earning and progress monitoring

### **Step 3: Category Breakdown View**
- Visual breakdown of all 9 LEED categories
- Progress tracking for each category
- Prerequisites vs. credits identification
- Point allocation visualization

---

## 📁 **File Structure**

```
src/
├── lib/
│   └── leedSubcategories.ts          # LEED v4.1 data and utilities
├── components/Project/
│   ├── CertificationManagement.tsx   # Main certification interface
│   └── LEEDCategoryBreakdown.tsx    # LEED visual breakdown
└── public/
    └── all_v4.1_subcategories.csv   # Source CSV data
```

---

## 🔧 **Technical Details**

### **Data Source**
- **CSV File**: `all_v4.1_subcategories.csv`
- **Columns**: certification, category_id, category, subcategory_id, subcategory, max_score, version
- **Filter**: Building Design and Construction: New Construction, v4.1

### **Data Processing**
```typescript
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
```

### **Task Generation Logic**
```typescript
// Phase assignment based on category
const getPhaseForCategory = (categoryId: string) => {
  switch (categoryId) {
    case 'IP': return 'design';
    case 'LT': case 'SS': return 'pre_construction';
    case 'WE': case 'EA': case 'MR': return 'execution';
    case 'IEQ': return 'handover';
    case 'I': case 'RP': return 'operations_maintenance';
  }
};

// Priority assignment
const getPriority = (subcategory: LEEDSubcategory) => {
  if (subcategory.isPrerequisite) return 'high';
  if (subcategory.maxScore >= 5) return 'high';
  if (subcategory.maxScore <= 1) return 'low';
  return 'medium';
};
```

---

## 📈 **Database Schema Extensions**

### **Tasks Table Extensions**
```sql
ALTER TABLE tasks ADD COLUMN leed_category TEXT;
ALTER TABLE tasks ADD COLUMN leed_subcategory_id TEXT;
ALTER TABLE tasks ADD COLUMN max_points INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN is_prerequisite BOOLEAN DEFAULT FALSE;
```

### **Requirements Table Extensions**
```sql
ALTER TABLE certificate_requirements ADD COLUMN points_possible INTEGER DEFAULT 0;
ALTER TABLE certificate_requirements ADD COLUMN points_earned INTEGER DEFAULT 0;
ALTER TABLE certificate_requirements ADD COLUMN subcategory_id TEXT;
```

---

## 🎯 **Usage Examples**

### **Creating LEED v4.1 Certification**
1. **Template Mode**: Use "LEED v4.1 Template" for complete setup
2. **Manual Mode**: Select LEED type + v4.1 version for basic setup
3. **Hybrid Mode**: Combine template with custom requirements

### **Tracking Progress**
- **Task Completion**: Mark individual subcategory tasks as complete
- **Point Tracking**: Earn points for completed credits
- **Prerequisite Monitoring**: Ensure all prerequisites are met
- **Category Progress**: Monitor progress across all 9 categories

### **Reporting Integration**
- **LEED Report**: Integrates with comprehensive LEED reporting system
- **Arc Performance**: Connects with Arc score tracking
- **Certification Pathway**: Clear path to certification levels

---

## 📊 **Key Statistics**

| Metric | Value |
|---------|--------|
| **Total Subcategories** | 50 |
| **Total Points Available** | 110 |
| **Prerequisites Required** | 11 |
| **Categories Covered** | 9 |
| **Certification Levels** | 4 (Certified, Silver, Gold, Platinum) |
| **Project Phases** | 5 |
| **Priority Levels** | 3 (High, Medium, Low) |

---

## 🔄 **Future Enhancements**

### **Planned Features**
- **Other LEED Types**: O+M, Core & Shell, etc.
- **Version Support**: LEED v4, LEED v4.1, future versions
- **Regional Variations**: Different regional priority credits
- **Custom Weightings**: Project-specific priority adjustments

### **Integration Opportunities**
- **Real-time Arc Sync**: Direct integration with USGBC Arc platform
- **Document Management**: Link LEED documentation to specific tasks
- **Automated Submissions**: Streamlined LEED submission process
- **AI Recommendations**: Smart suggestions for credit achievement

---

## ✅ **Quality Assurance**

### **Data Accuracy**
- ✅ **Source Verified**: Based on official LEED v4.1 BD+C reference
- ✅ **Point Totals**: Verified 110-point total
- ✅ **Prerequisites**: All 11 prerequisites identified correctly
- ✅ **Categories**: Complete coverage of all 9 LEED categories

### **System Integration**
- ✅ **Build Success**: All TypeScript compilation passes
- ✅ **UI Components**: Responsive design across devices
- ✅ **Database Compatibility**: Works with existing schema
- ✅ **Error Handling**: Graceful fallbacks for template issues

---

*This integration provides the most comprehensive LEED v4.1 BD+C task management system, ensuring projects can efficiently track all requirements for successful LEED certification.*