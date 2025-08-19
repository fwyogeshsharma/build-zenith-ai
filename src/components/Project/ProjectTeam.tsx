import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Mail, Phone, MoreHorizontal, UserMinus, Settings, Crown, Shield } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type TeamMember = Database['public']['Tables']['project_team_members']['Row'] & {
  profile?: {
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
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'project_manager' | 'contractor' | 'architect'>('contractor');
  const { toast } = useToast();

  useEffect(() => {
    fetchTeamMembers();
  }, [projectId]);

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('project_team_members')
        .select(`
          *,
          profile:profiles!inner(
            first_name,
            last_name,
            email,
            avatar_url,
            phone
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;
      setTeamMembers(data || []);
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

  const inviteTeamMember = async () => {
    if (!inviteEmail.trim()) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }

    try {
      // In a real app, you'd first check if the user exists or send an invitation
      // For now, we'll assume the user exists and add them directly
      const { error } = await supabase
        .from('project_team_members')
        .insert({
          project_id: projectId,
          user_id: 'placeholder-user-id', // In real app, get this from user lookup
          role: inviteRole
        });

      if (error) throw error;

      setIsInviteOpen(false);
      setInviteEmail('');
      setInviteRole('team_member');
      
      toast({
        title: "Invitation sent",
        description: `Invitation sent to ${inviteEmail}`,
      });

      // Refresh team members
      fetchTeamMembers();
    } catch (error: any) {
      toast({
        title: "Error sending invitation",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateMemberRole = async (memberId: string, newRole: string) => {
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
      case 'team_member': return 'bg-green-100 text-green-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
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
        
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                />
              </div>
              
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer - Can view project</SelectItem>
                    <SelectItem value="team_member">Team Member - Can view and edit</SelectItem>
                    <SelectItem value="project_manager">Project Manager - Full access</SelectItem>
                    <SelectItem value="admin">Admin - Full control</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={inviteTeamMember} className="flex-1">
                  Send Invitation
                </Button>
                <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
                      <AvatarImage src={member.profile?.avatar_url} />
                      <AvatarFallback>
                        {getInitials(member.profile?.first_name, member.profile?.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">
                          {member.profile?.first_name} {member.profile?.last_name}
                        </h4>
                        {getRoleIcon(member.role)}
                        <Badge variant="outline" className={getRoleColor(member.role)}>
                          {member.role.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span>{member.profile?.email}</span>
                        </div>
                        {member.profile?.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{member.profile.phone}</span>
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
                      <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'team_member')}>
                        <Settings className="h-4 w-4 mr-2" />
                        Make Team Member
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
              {teamMembers.filter(m => m.role === 'team_member').length}
            </div>
            <div className="text-sm text-muted-foreground">Team Members</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">
              {teamMembers.filter(m => m.role === 'viewer').length}
            </div>
            <div className="text-sm text-muted-foreground">Viewers</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectTeam;