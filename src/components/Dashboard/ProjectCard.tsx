import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  DollarSign, 
  MapPin, 
  Users, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreHorizontal,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Project {
  id: string;
  name: string;
  description: string;
  project_type: string;
  status: string;
  current_phase: string;
  location: string;
  budget: number;
  progress_percentage: number;
  expected_completion_date: string;
  created_at: string;
}

interface ProjectCardProps {
  project: Project;
  onViewDetails?: (projectId: string) => void;
  onEdit?: (projectId: string) => void;
  onDelete?: (projectId: string) => void;
}

const getProjectTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    'new_construction': 'bg-primary text-primary-foreground',
    'renovation_repair': 'bg-construction text-construction-foreground',
    'interior_fitout': 'bg-accent text-accent-foreground',
    'sustainable_green': 'bg-sustainability text-sustainability-foreground',
    'luxury': 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white',
    'affordable_housing': 'bg-secondary text-secondary-foreground',
    'mixed_use': 'bg-gradient-to-r from-primary to-construction text-white',
    'co_living_working': 'bg-muted text-muted-foreground',
    'land_development': 'bg-warning text-warning-foreground',
    'redevelopment': 'bg-destructive text-destructive-foreground',
  };
  return colors[type] || 'bg-secondary text-secondary-foreground';
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-success" />;
    case 'active':
      return <TrendingUp className="h-4 w-4 text-primary" />;
    case 'on_hold':
      return <Clock className="h-4 w-4 text-warning" />;
    case 'cancelled':
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const formatProjectType = (type: string) => {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const formatPhase = (phase: string) => {
  return phase.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
};

const ProjectCard = ({ project, onViewDetails, onEdit, onDelete }: ProjectCardProps) => {
  const completionDate = new Date(project.expected_completion_date);
  const isOverdue = completionDate < new Date() && project.status !== 'completed';

  return (
    <Card 
      className="bg-gradient-card border-0 shadow-medium hover:shadow-large transition-all duration-300 hover:scale-[1.02] cursor-pointer"
      onClick={() => onViewDetails?.(project.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
              {getStatusIcon(project.status)}
            </div>
            <Badge className={`text-xs ${getProjectTypeColor(project.project_type)}`}>
              {formatProjectType(project.project_type)}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails?.(project.id)}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(project.id)}>
                Edit Project
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete?.(project.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">{project.progress_percentage}%</span>
          </div>
          <Progress value={project.progress_percentage} className="h-2" />
        </div>

        {/* Project Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{project.location || 'No location'}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">
              {project.budget ? formatCurrency(project.budget) : 'No budget'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className={`h-4 w-4 flex-shrink-0 ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`} />
            <span className={`truncate ${isOverdue ? 'text-destructive' : ''}`}>
              {completionDate.toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{formatPhase(project.current_phase)}</span>
          </div>
        </div>

        {/* Team avatars placeholder */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <Avatar key={i} className="h-6 w-6 border-2 border-background">
                <AvatarFallback className="text-xs">U{i}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">+5 team members</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;