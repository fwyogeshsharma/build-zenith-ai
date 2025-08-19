import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  CheckCircle, 
  Users, 
  Calendar, 
  MessageSquare,
  Upload,
  Clock
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'document' | 'task' | 'team' | 'milestone' | 'comment' | 'upload';
  user: {
    name: string;
    avatar?: string;
    initials: string;
  };
  action: string;
  target: string;
  projectName?: string;
  timestamp: string;
  status?: 'completed' | 'pending' | 'in_progress';
}

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'task',
    user: { name: 'Sarah Johnson', initials: 'SJ' },
    action: 'completed',
    target: 'Foundation inspection',
    projectName: 'Downtown Office Complex',
    timestamp: '2 minutes ago',
    status: 'completed'
  },
  {
    id: '2',
    type: 'document',
    user: { name: 'Mike Chen', initials: 'MC' },
    action: 'uploaded',
    target: 'Structural drawings v2.1',
    projectName: 'Green Residential Complex',
    timestamp: '15 minutes ago'
  },
  {
    id: '3',
    type: 'team',
    user: { name: 'Emma Davis', initials: 'ED' },
    action: 'added',
    target: 'Alex Thompson as Site Engineer',
    projectName: 'Luxury Hotel',
    timestamp: '1 hour ago'
  },
  {
    id: '4',
    type: 'milestone',
    user: { name: 'David Wilson', initials: 'DW' },
    action: 'reached',
    target: 'Phase 1 completion',
    projectName: 'Affordable Housing',
    timestamp: '3 hours ago',
    status: 'completed'
  },
  {
    id: '5',
    type: 'comment',
    user: { name: 'Lisa Park', initials: 'LP' },
    action: 'commented on',
    target: 'Material delivery schedule',
    projectName: 'Mixed-Use Development',
    timestamp: '5 hours ago'
  },
];

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'task':
      return <CheckCircle className="h-4 w-4 text-success" />;
    case 'document':
    case 'upload':
      return <FileText className="h-4 w-4 text-primary" />;
    case 'team':
      return <Users className="h-4 w-4 text-construction" />;
    case 'milestone':
      return <Calendar className="h-4 w-4 text-sustainability" />;
    case 'comment':
      return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusBadge = (status?: string) => {
  if (!status) return null;
  
  const colors = {
    completed: 'bg-success/20 text-success',
    pending: 'bg-warning/20 text-warning',
    in_progress: 'bg-primary/20 text-primary',
  };
  
  return (
    <Badge className={`text-xs ${colors[status as keyof typeof colors] || ''}`}>
      {status.replace('_', ' ').toUpperCase()}
    </Badge>
  );
};

const RecentActivity = () => {
  return (
    <Card className="bg-gradient-card border-0 shadow-medium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="bg-construction/20 p-2 rounded-lg">
            <Clock className="h-5 w-5 text-construction" />
          </div>
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockActivities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
              <AvatarFallback className="text-xs">{activity.user.initials}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getActivityIcon(activity.type)}
                  <p className="text-sm">
                    <span className="font-medium">{activity.user.name}</span>
                    {' '}{activity.action}{' '}
                    <span className="font-medium">{activity.target}</span>
                  </p>
                </div>
                {getStatusBadge(activity.status)}
              </div>
              
              {activity.projectName && (
                <p className="text-xs text-primary font-medium">
                  {activity.projectName}
                </p>
              )}
              
              <p className="text-xs text-muted-foreground">
                {activity.timestamp}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;