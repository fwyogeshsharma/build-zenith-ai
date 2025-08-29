import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Building2, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);

  const token = searchParams.get('token');
  const action = searchParams.get('action');

  useEffect(() => {
    if (token) {
      fetchInvitation();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          projects (name, description)
        `)
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (error) throw error;

      // Check if invitation is expired
      if (new Date(data.expires_at) < new Date()) {
        toast({
          title: "Invitation Expired",
          description: "This invitation has expired. Please contact the project owner for a new invitation.",
          variant: "destructive",
        });
        return;
      }

      setInvitation(data);
      
      // Auto-decline if action is decline
      if (action === 'decline') {
        handleRejectInvitation();
      }
    } catch (error) {
      console.error('Error fetching invitation:', error);
      toast({
        title: "Invalid Invitation",
        description: "This invitation link is invalid or has already been used.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!user) {
      // User needs to sign in first
      await signInWithGoogle();
      return;
    }

    if (!invitation) return;

    setAccepting(true);
    try {
      // Add user to project team
      const { error: teamError } = await supabase
        .from('project_team_members')
        .insert({
          project_id: invitation.project_id,
          user_id: user.id,
          role: invitation.role,
        });

      if (teamError) throw teamError;

      // Update invitation status
      const { error: inviteError } = await supabase
        .from('invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      if (inviteError) throw inviteError;

      toast({
        title: "Welcome to the team!",
        description: `You have successfully joined ${invitation.projects.name} as ${invitation.role}.`,
      });

      // Redirect to the project
      navigate(`/projects/${invitation.project_id}`);
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      
      // Check if user is already a team member
      if (error.code === '23505') {
        toast({
          title: "Already a member",
          description: "You are already a member of this project.",
          variant: "destructive",
        });
        navigate('/dashboard');
      } else {
        toast({
          title: "Error",
          description: "Failed to accept invitation. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setAccepting(false);
    }
  };

  const handleRejectInvitation = async () => {
    if (!invitation) return;

    setDeclining(true);
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'rejected' })
        .eq('id', invitation.id);

      if (error) throw error;

      toast({
        title: "Invitation declined",
        description: "You have declined the invitation.",
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      toast({
        title: "Error",
        description: "Failed to decline invitation.",
        variant: "destructive",
      });
    } finally {
      setDeclining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary-dark to-accent">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary-dark to-accent">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Invitation</h2>
            <p className="text-muted-foreground mb-4">
              This invitation link is invalid or has expired.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary-dark to-accent p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="bg-white/20 p-3 rounded-xl w-fit mx-auto mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Project Invitation</CardTitle>
          <CardDescription>
            You've been invited to join a project team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">{invitation.projects.name}</h3>
            {invitation.projects.description && (
              <p className="text-muted-foreground mb-3">{invitation.projects.description}</p>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Role:</span>
              <span className="font-medium capitalize">{invitation.role.replace('_', ' ')}</span>
            </div>
          </div>

          {!user ? (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground">
                You need to sign in to accept this invitation
              </p>
              <Button 
                onClick={() => signInWithGoogle()} 
                className="w-full"
                size="lg"
              >
                Sign In with Google
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground">
                Do you want to join this project as {invitation.role.replace('_', ' ')}?
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleAcceptInvitation}
                  disabled={accepting}
                  className="flex-1"
                  size="lg"
                >
                  {accepting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Accepting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Accept
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleRejectInvitation}
                  variant="outline"
                  disabled={accepting || declining}
                  className="flex-1"
                  size="lg"
                >
                  {declining ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Declining...
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-2 h-4 w-4" />
                      Decline
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className="text-center text-xs text-muted-foreground">
            Expires: {new Date(invitation.expires_at).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitation;