import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getAllCategories, getTasksByCategory, getTotalPossiblePoints, getPrerequisitesCount } from '@/lib/leedSubcategories';
import { Award, CheckCircle, AlertTriangle } from 'lucide-react';

interface LEEDCategoryBreakdownProps {
  certificationType: string;
  version: string;
}

const LEEDCategoryBreakdown = ({ certificationType, version }: LEEDCategoryBreakdownProps) => {
  // Only show for LEED v4.1 certifications
  if (certificationType !== 'leed' || version !== 'v4.1') {
    return null;
  }

  const categories = getAllCategories();
  const totalPoints = getTotalPossiblePoints();
  const prerequisiteCount = getPrerequisitesCount();

  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case 'IP': return '🔄';
      case 'LT': return '🚗';
      case 'SS': return '🌍';
      case 'WE': return '💧';
      case 'EA': return '⚡';
      case 'MR': return '🏗️';
      case 'IEQ': return '🏠';
      case 'I': return '💡';
      case 'RP': return '📍';
      default: return '📋';
    }
  };

  const getCategoryDescription = (categoryId: string) => {
    switch (categoryId) {
      case 'IP': return 'Cross-disciplinary planning and collaboration';
      case 'LT': return 'Site location and transportation access';
      case 'SS': return 'Site development and environmental protection';
      case 'WE': return 'Water use reduction and management';
      case 'EA': return 'Energy performance and renewable systems';
      case 'MR': return 'Material selection and waste management';
      case 'IEQ': return 'Indoor air quality and occupant comfort';
      case 'I': return 'Innovation strategies and LEED expertise';
      case 'RP': return 'Regional environmental priorities';
      default: return 'General certification requirements';
    }
  };

  const getCategoryColor = (categoryId: string) => {
    switch (categoryId) {
      case 'IP': return 'border-purple-200 bg-purple-50';
      case 'LT': return 'border-blue-200 bg-blue-50';
      case 'SS': return 'border-green-200 bg-green-50';
      case 'WE': return 'border-cyan-200 bg-cyan-50';
      case 'EA': return 'border-yellow-200 bg-yellow-50';
      case 'MR': return 'border-orange-200 bg-orange-50';
      case 'IEQ': return 'border-teal-200 bg-teal-50';
      case 'I': return 'border-pink-200 bg-pink-50';
      case 'RP': return 'border-indigo-200 bg-indigo-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-green-600" />
          LEED v4.1 BD+C Category Breakdown
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div>Total Points Available: <span className="font-semibold text-green-600">{totalPoints}</span></div>
          <div>Prerequisites: <span className="font-semibold text-red-600">{prerequisiteCount}</span></div>
          <div>Categories: <span className="font-semibold text-blue-600">{categories.length}</span></div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => {
            const categoryTasks = getTasksByCategory(category.id);
            const totalCategoryPoints = categoryTasks.reduce((sum, task) => sum + task.maxScore, 0);
            const prerequisiteTasks = categoryTasks.filter(task => task.isPrerequisite);
            
            return (
              <div
                key={category.id}
                className={`p-4 border rounded-lg ${getCategoryColor(category.id)}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getCategoryIcon(category.id)}</span>
                    <div>
                      <h4 className="font-semibold text-sm">{category.name}</h4>
                      <p className="text-xs text-muted-foreground">{category.id}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {totalCategoryPoints} pts
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground mb-3">
                  {getCategoryDescription(category.id)}
                </p>

                <div className="space-y-2 mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Progress</span>
                    <span className="text-xs font-medium">0/{category.taskCount} tasks</span>
                  </div>
                  <Progress value={0} className="h-1" />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>{category.taskCount - prerequisiteTasks.length} Credits</span>
                  </div>
                  {prerequisiteTasks.length > 0 && (
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      <span>{prerequisiteTasks.length} Prereq</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-current/20">
                  <div className="text-xs font-medium">Key Requirements:</div>
                  <div className="text-xs text-muted-foreground">
                    {categoryTasks.slice(0, 2).map((task, idx) => (
                      <div key={idx}>• {task.subcategoryId}</div>
                    ))}
                    {categoryTasks.length > 2 && (
                      <div>... and {categoryTasks.length - 2} more</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* LEED Certification Levels */}
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border rounded-lg">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-green-600" />
            LEED Certification Levels
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-2 bg-white rounded border">
              <div className="text-sm font-medium">Certified</div>
              <div className="text-xs text-muted-foreground">40-49 points</div>
            </div>
            <div className="text-center p-2 bg-white rounded border">
              <div className="text-sm font-medium text-gray-600">Silver</div>
              <div className="text-xs text-muted-foreground">50-59 points</div>
            </div>
            <div className="text-center p-2 bg-white rounded border">
              <div className="text-sm font-medium text-yellow-600">Gold</div>
              <div className="text-xs text-muted-foreground">60-79 points</div>
            </div>
            <div className="text-center p-2 bg-white rounded border">
              <div className="text-sm font-medium text-green-600">Platinum</div>
              <div className="text-xs text-muted-foreground">80+ points</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LEEDCategoryBreakdown;