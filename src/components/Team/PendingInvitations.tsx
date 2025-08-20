import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Mail, X, Clock, User } from 'lucide-react';
import { format } from 'date-fns';

interface Invitation {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
}

interface PendingInvitationsProps {
  invitations: Invitation[];
  onCancelInvitation: (invitationId: string) => void;
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

const formatRole = (role: string) => {
  return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const isExpired = (expiresAt: string) => {
  return new Date() > new Date(expiresAt);
};

export const PendingInvitations = ({ invitations, onCancelInvitation }: PendingInvitationsProps) => {
  if (invitations.length === 0) {
    return (
      <div className="text-center py-8">
        <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Pending Invitations</h3>
        <p className="text-muted-foreground">
          All sent invitations have been responded to.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invitations.map((invitation) => {
        const expired = isExpired(invitation.expires_at);
        
        return (
          <div
            key={invitation.id}
            className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
              expired 
                ? 'border-destructive/20 bg-destructive/5' 
                : 'border-border hover:bg-accent/50'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg ${expired ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                <Mail className={`h-5 w-5 ${expired ? 'text-destructive' : 'text-primary'}`} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-card-foreground">
                    {invitation.email}
                  </h4>
                  <Badge variant="outline" className={getRoleColor(invitation.role)}>
                    <User className="h-3 w-3 mr-1" />
                    {formatRole(invitation.role)}
                  </Badge>
                  {expired && (
                    <Badge variant="destructive">
                      Expired
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Sent {format(new Date(invitation.created_at), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Expires {format(new Date(invitation.expires_at), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <X className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel the invitation for {invitation.email}? 
                      This will prevent them from joining the project using the invitation link.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Invitation</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onCancelInvitation(invitation.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Cancel Invitation
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        );
      })}
    </div>
  );
};