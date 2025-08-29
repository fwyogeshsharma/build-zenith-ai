import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { InviteDialog } from '@/components/Team/InviteDialog';

interface TeamMember {
  user_id: string;
  role: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

interface TeamMemberSelectProps {
  projectId: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  showInviteButton?: boolean;
}

export const TeamMemberSelect = ({ 
  projectId, 
  value, 
  onChange, 
  label = "Assigned To",
  placeholder = "Select team member",
  showInviteButton = true
}: TeamMemberSelectProps) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  useEffect(() => {
    fetchTeamMembers();
  }, [projectId]);

  const fetchTeamMembers = async () => {
    try {
      const { data: teamData, error } = await supabase
        .from('project_team_members')
        .select('user_id, role')
        .eq('project_id', projectId);

      if (error) throw error;

      if (teamData && teamData.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, email')
          .in('user_id', teamData.map(t => t.user_id));

        const membersWithProfiles: TeamMember[] = teamData.map(member => {
          const profile = profilesData?.find(p => p.user_id === member.user_id);
          return {
            ...member,
            profiles: profile ? {
              first_name: profile.first_name,
              last_name: profile.last_name,
              email: profile.email
            } : null
          };
        }).filter(member => member.profiles !== null);

        setTeamMembers(membersWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSuccess = () => {
    // Refresh team members after successful invitation
    fetchTeamMembers();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {showInviteButton && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsInviteDialogOpen(true)}
            className="h-8 px-2 text-xs"
          >
            <UserPlus className="h-3 w-3 mr-1" />
            Invite
          </Button>
        )}
      </div>
      
      <Select value={value} onValueChange={onChange} disabled={loading}>
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Loading..." : placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Unassigned</SelectItem>
          {teamMembers.map((member) => (
            <SelectItem key={member.user_id} value={member.user_id}>
              <div className="flex flex-col">
                <span>
                  {member.profiles?.first_name} {member.profiles?.last_name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {member.role}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Invite Dialog */}
      <InviteDialog
        isOpen={isInviteDialogOpen}
        onClose={() => setIsInviteDialogOpen(false)}
        projectId={projectId}
        onInviteSuccess={handleInviteSuccess}
      />
    </div>
  );
};