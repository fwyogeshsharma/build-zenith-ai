import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const StatCard = ({ title, value, description, icon: Icon, trend, className }: StatCardProps) => {
  return (
    <Card className={`bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-all duration-300 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="bg-primary/10 p-2 rounded-lg">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
          {trend && (
            <div className={`text-xs font-medium flex items-center gap-1 ${
              trend.isPositive ? 'text-success' : 'text-destructive'
            }`}>
              <span>{trend.isPositive ? '↗' : '↘'}</span>
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;