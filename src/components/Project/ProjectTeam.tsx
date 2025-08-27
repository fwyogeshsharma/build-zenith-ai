import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Mail, Phone, MoreHorizontal, UserMinus, Settings, Crown, Shield } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import { InviteDialog } from '@/components/Team/InviteDialog';

type UserRole = Database['public']['Enums']['user_role'];

type TeamMember = Database['public']['Tables']['project_team_members']['Row'] & {
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
    phone?: string;
  };
};

interface ProjectTeamProps {
  projectId: string;
}

const ProjectTeam = ({ projectId }: ProjectTeamProps) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTeamMembers();
  }, [projectId]);

  const fetchTeamMembers = async () => {
    try {
      // First get team member records
      const { data: teamMemberData, error: teamError } = await supabase
        .from('project_team_members')
        .select('id, role, joined_at, user_id, permissions')
        .eq('project_id', projectId);
      
      if (teamError) throw teamError;
      if (!teamMemberData || teamMemberData.length === 0) {
        setTeamMembers([]);
        return;
      }

      // Then get profile data for those users
      const userIds = teamMemberData.map(member => member.user_id);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email, avatar_url, phone')
        .in('user_id', userIds);
      
      if (profileError) throw profileError;

      // Combine the data
      const combinedData = teamMemberData.map(member => ({
        ...member,
        profiles: profileData?.find(profile => profile.user_id === member.user_id) || null
      }));

      setTeamMembers(combinedData as any);
    } catch (error: any) {
      toast({
        title: "Error loading team members",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSuccess = () => {
    fetchTeamMembers();
    toast({
      title: "Invitation sent",
      description: "Team member invitation has been sent successfully",
    });
  };

  const updateMemberRole = async (memberId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase
        .from('project_team_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      setTeamMembers(teamMembers.map(member => 
        member.id === memberId ? { ...member, role: newRole as any } : member
      ));

      toast({
        title: "Role updated",
        description: "Team member role has been updated",
      });
    } catch (error: any) {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('project_team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      setTeamMembers(teamMembers.filter(member => member.id !== memberId));

      toast({
        title: "Member removed",
        description: "Team member has been removed from the project",
      });
    } catch (error: any) {
      toast({
        title: "Error removing member",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'project_manager': return <Shield className="h-4 w-4 text-blue-600" />;
      default: return null;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-yellow-100 text-yellow-800';
      case 'project_manager': return 'bg-blue-100 text-blue-800';
      case 'contractor': return 'bg-green-100 text-green-800';
      case 'client': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || 'U';
  };

  if (loading) {
    return <div className="text-center p-8">Loading team members...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Team Members</h3>
          <p className="text-sm text-muted-foreground">
            Manage who has access to this project
          </p>
        </div>
        
        <Button onClick={() => setIsInviteOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </div>

      <InviteDialog
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        projectId={projectId}
        onInviteSuccess={handleInviteSuccess}
      />

      {/* Team Members List */}
      {teamMembers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No team members yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {teamMembers.map((member) => (
            <Card key={member.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.profiles?.avatar_url} />
                      <AvatarFallback>
                        {getInitials(member.profiles?.first_name, member.profiles?.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">
                          {member.profiles?.first_name} {member.profiles?.last_name}
                        </h4>
                        {getRoleIcon(member.role)}
                        <Badge variant="outline" className={getRoleColor(member.role)}>
                          {member.role.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span>{member.profiles?.email}</span>
                        </div>
                        {member.profiles?.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{member.profiles.phone}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-xs text-muted-foreground mt-1">
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'admin')}>
                        <Crown className="h-4 w-4 mr-2" />
                        Make Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'project_manager')}>
                        <Shield className="h-4 w-4 mr-2" />
                        Make Project Manager
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'contractor')}>
                        <Settings className="h-4 w-4 mr-2" />
                        Make Contractor
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => removeMember(member.id)}
                        className="text-red-600"
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        Remove from Project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Team Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {teamMembers.filter(m => m.role === 'admin').length}
            </div>
            <div className="text-sm text-muted-foreground">Admins</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {teamMembers.filter(m => m.role === 'project_manager').length}
            </div>
            <div className="text-sm text-muted-foreground">Project Managers</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {teamMembers.filter(m => m.role === 'contractor').length}
            </div>
            <div className="text-sm text-muted-foreground">Contractors</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">
              {teamMembers.filter(m => m.role === 'client').length}
            </div>
            <div className="text-sm text-muted-foreground">Clients</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectTeam;