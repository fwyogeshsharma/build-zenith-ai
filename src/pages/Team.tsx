import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardSidebar from '@/components/Dashboard/DashboardSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, UserPlus, Mail } from 'lucide-react';
import { TeamMemberList } from '@/components/Team/TeamMemberList';
import { InviteDialog } from '@/components/Team/InviteDialog';
import { PendingInvitations } from '@/components/Team/PendingInvitations';
import { useToast } from '@/hooks/use-toast';

const Team = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');

  // Fetch user's projects
  const { data: projects = [] } = useQuery({
    queryKey: ['user-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('owner_id', user?.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch team members for selected project
  const { data: teamMembers = [], refetch: refetchTeamMembers } = useQuery({
    queryKey: ['team-members', selectedProject],
    queryFn: async () => {
      if (!selectedProject) return [];
      
      // First get team member records
      const { data: teamMemberData, error: teamError } = await supabase
        .from('project_team_members')
        .select('id, role, joined_at, user_id')
        .eq('project_id', selectedProject);
      
      if (teamError) throw teamError;
      if (!teamMemberData || teamMemberData.length === 0) return [];

      // Then get profile data for those users
      const userIds = teamMemberData.map(member => member.user_id);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email, avatar_url')
        .in('user_id', userIds);
      
      if (profileError) throw profileError;

      // Combine the data
      return teamMemberData.map(member => ({
        ...member,
        profiles: profileData?.find(profile => profile.user_id === member.user_id) || null
      }));
    },
    enabled: !!selectedProject,
  });

  // Fetch pending invitations for selected project
  const { data: pendingInvitations = [], refetch: refetchInvitations } = useQuery({
    queryKey: ['pending-invitations', selectedProject],
    queryFn: async () => {
      if (!selectedProject) return [];
      
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('project_id', selectedProject)
        .eq('status', 'pending');
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedProject,
  });

  const handleInviteSuccess = () => {
    refetchInvitations();
    toast({
      title: "Invitation sent",
      description: "Team member invitation has been sent successfully.",
    });
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('project_team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      refetchTeamMembers();
      toast({
        title: "Team member removed",
        description: "Team member has been removed from the project.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove team member.",
        variant: "destructive",
      });
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'declined' })
        .eq('id', invitationId);

      if (error) throw error;

      refetchInvitations();
      toast({
        title: "Invitation cancelled",
        description: "The invitation has been cancelled.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel invitation.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-card-foreground">Team Management</h1>
                <p className="text-muted-foreground">Manage team members and invitations</p>
              </div>
            </div>
            
            {selectedProject && (
              <Button
                onClick={() => setIsInviteDialogOpen(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {projects.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Projects Found</h3>
                <p className="text-muted-foreground mb-4">
                  You need to create a project first to manage team members.
                </p>
                <Button>Create Project</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Project Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Project</CardTitle>
                  <CardDescription>Choose a project to manage its team members</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((project) => (
                      <Button
                        key={project.id}
                        variant={selectedProject === project.id ? "default" : "outline"}
                        className="justify-start h-auto p-4"
                        onClick={() => setSelectedProject(project.id)}
                      >
                        <div className="text-left">
                          <div className="font-medium">{project.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {selectedProject === project.id ? 'Selected' : 'Click to select'}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {selectedProject && (
                <>
                  {/* Team Members */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Team Members ({teamMembers.length})
                          </CardTitle>
                          <CardDescription>Active team members on this project</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <TeamMemberList 
                        members={teamMembers} 
                        onRemoveMember={handleRemoveMember}
                        currentUserId={user?.id}
                      />
                    </CardContent>
                  </Card>

                  {/* Pending Invitations */}
                  {pendingInvitations.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Mail className="h-5 w-5" />
                          Pending Invitations ({pendingInvitations.length})
                        </CardTitle>
                        <CardDescription>Invitations waiting for response</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <PendingInvitations 
                          invitations={pendingInvitations}
                          onCancelInvitation={handleCancelInvitation}
                        />
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          )}
        </main>
      </div>

      <InviteDialog
        isOpen={isInviteDialogOpen}
        onClose={() => setIsInviteDialogOpen(false)}
        projectId={selectedProject}
        onInviteSuccess={handleInviteSuccess}
      />
    </div>
  );
};

export default Team;