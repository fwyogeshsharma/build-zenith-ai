import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { UserMinus, Calendar, Crown, User } from 'lucide-react';
import { format } from 'date-fns';

interface TeamMember {
  id: string;
  role: string;
  joined_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  } | null;
}

interface TeamMemberListProps {
  members: TeamMember[];
  onRemoveMember: (memberId: string) => void;
  currentUserId?: string;
}

const getRoleColor = (role: string) => {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'project_manager':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'architect':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'engineer':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'contractor':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'inspector':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'admin':
      return <Crown className="h-3 w-3" />;
    default:
      return <User className="h-3 w-3" />;
  }
};

const formatRole = (role: string) => {
  return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const TeamMemberList = ({ members, onRemoveMember, currentUserId }: TeamMemberListProps) => {
  if (members.length === 0) {
    return (
      <div className="text-center py-8">
        <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Team Members</h3>
        <p className="text-muted-foreground">
          Start by inviting team members to collaborate on this project.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={member.profiles?.avatar_url} />
              <AvatarFallback>
                {member.profiles?.first_name?.[0] || '?'}
                {member.profiles?.last_name?.[0] || ''}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-card-foreground">
                  {member.profiles?.first_name} {member.profiles?.last_name}
                </h4>
                <Badge variant="outline" className={getRoleColor(member.role)}>
                  {getRoleIcon(member.role)}
                  <span className="ml-1">{formatRole(member.role)}</span>
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {member.profiles?.email}
              </p>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Joined {format(new Date(member.joined_at), 'MMM dd, yyyy')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                  <UserMinus className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove {member.profiles?.first_name} {member.profiles?.last_name} from this project? 
                    This action cannot be undone and they will lose access to all project resources.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onRemoveMember(member.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Remove Member
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  );
};