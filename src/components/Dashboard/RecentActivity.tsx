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
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  activity_type: string;
  title: string;
  description: string;
  user: {
    name: string;
    avatar?: string;
    initials: string;
  };
  projectName?: string;
  timestamp: string;
  metadata?: any;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'task_completed':
      return <CheckCircle className="h-4 w-4 text-success" />;
    case 'document_uploaded':
      return <FileText className="h-4 w-4 text-primary" />;
    case 'team_member_added':
      return <Users className="h-4 w-4 text-construction" />;
    case 'milestone_reached':
      return <Calendar className="h-4 w-4 text-sustainability" />;
    case 'comment_added':
      return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const RecentActivity = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const { data: activitiesData, error } = await supabase
          .from('activities')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching activities:', error);
          return;
        }

        if (!activitiesData || activitiesData.length === 0) {
          setActivities([]);
          return;
        }

        // Get user profiles and project names separately
        const userIds = [...new Set(activitiesData.map(a => a.user_id))];
        const projectIds = [...new Set(activitiesData.map(a => a.project_id).filter(Boolean))];

        const [profilesResult, projectsResult] = await Promise.all([
          supabase.from('profiles').select('user_id, first_name, last_name, avatar_url').in('user_id', userIds),
          projectIds.length > 0 ? supabase.from('projects').select('id, name').in('id', projectIds) : { data: [] }
        ]);

        const profilesMap = new Map(profilesResult.data?.map(p => [p.user_id, p] as const) || []);
        const projectsMap = new Map(projectsResult.data?.map(p => [p.id, p] as const) || []);

        const formattedActivities: ActivityItem[] = activitiesData.map((activity) => {
          const profile = profilesMap.get(activity.user_id);
          const project = activity.project_id ? projectsMap.get(activity.project_id) : null;
          
          return {
            id: activity.id,
            activity_type: activity.activity_type,
            title: activity.title,
            description: activity.description,
            user: {
              name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User' : 'Unknown User',
              avatar: profile?.avatar_url,
              initials: profile ? `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}` || 'U' : 'U'
            },
            projectName: project?.name,
            timestamp: formatDistanceToNow(new Date(activity.created_at), { addSuffix: true }),
            metadata: activity.metadata
          };
        });

        setActivities(formattedActivities);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  if (loading) {
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
          <div className="text-center text-muted-foreground">Loading activities...</div>
        </CardContent>
      </Card>
    );
  }

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
        {activities.length === 0 ? (
          <div className="text-center text-muted-foreground">No recent activities</div>
        ) : (
          activities.map((activity) => (
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
                    {getActivityIcon(activity.activity_type)}
                    <p className="text-sm">
                      <span className="font-medium">{activity.user.name}</span>
                      {' '}{activity.description}
                    </p>
                  </div>
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
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;