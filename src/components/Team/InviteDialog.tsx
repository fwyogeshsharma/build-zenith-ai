import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Copy, CheckCircle, Mail, MessageSquare, Share2 } from 'lucide-react';

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['admin', 'project_manager', 'contractor', 'architect', 'engineer', 'client', 'inspector']),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onInviteSuccess: () => void;
}

const roleOptions = [
  { value: 'admin', label: 'Admin', description: 'Full project access and management' },
  { value: 'project_manager', label: 'Project Manager', description: 'Manage project phases and tasks' },
  { value: 'architect', label: 'Architect', description: 'Design and architectural oversight' },
  { value: 'engineer', label: 'Engineer', description: 'Technical engineering tasks' },
  { value: 'contractor', label: 'Contractor', description: 'Construction and implementation' },
  { value: 'client', label: 'Client', description: 'Project stakeholder with viewing access' },
  { value: 'inspector', label: 'Inspector', description: 'Quality control and inspections' },
];

export const InviteDialog = ({ isOpen, onClose, projectId, onInviteSuccess }: InviteDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [invitationLink, setInvitationLink] = useState<string | null>(null);
  const [showInviteLink, setShowInviteLink] = useState(false);
  const [projectName, setProjectName] = useState<string>('Project');

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'client',
    },
  });

  const generateToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const onSubmit = async (data: InviteFormData) => {
    if (!user || !projectId) return;

    setIsLoading(true);
    try {
      // Generate invitation token
      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      // Check if user is already a team member
      const { data: teamMemberUserIds } = await supabase
        .from('project_team_members')
        .select('user_id')
        .eq('project_id', projectId);

      if (teamMemberUserIds && teamMemberUserIds.length > 0) {
        const { data: existingProfiles } = await supabase
          .from('profiles')
          .select('email')
          .in('user_id', teamMemberUserIds.map(m => m.user_id));

        const memberEmails = existingProfiles?.map(p => p.email) || [];
        
        if (memberEmails.includes(data.email)) {
          toast({
            title: "User already a member",
            description: "This email is already associated with a team member.",
            variant: "destructive",
          });
          return;
        }
      }

      // Check if there's already a pending invitation and update it, or create new one
      const { data: existingInvitation } = await supabase
        .from('invitations')
        .select('id')
        .eq('project_id', projectId)
        .eq('email', data.email)
        .eq('status', 'pending')
        .single();

      let error;
      if (existingInvitation) {
        // Update existing invitation with new token and expiry
        const { error: updateError } = await supabase
          .from('invitations')
          .update({
            role: data.role,
            invited_by: user.id,
            token,
            expires_at: expiresAt.toISOString(),
            created_at: new Date().toISOString(), // Reset created_at to show it's a resend
          })
          .eq('id', existingInvitation.id);
        error = updateError;
      } else {
        // Create new invitation
        const { error: insertError } = await supabase
          .from('invitations')
          .insert({
            project_id: projectId,
            email: data.email,
            role: data.role,
            invited_by: user.id,
            token,
            expires_at: expiresAt.toISOString(),
          });
        error = insertError;
      }

      if (error) throw error;

      // Create invitation link
      const acceptUrl = `${window.location.origin}/accept-invitation?token=${token}`;
      setInvitationLink(acceptUrl);
      
      // Send invitation email via edge function
      try {
        // Fetch project name for email
        const { data: project } = await supabase
          .from('projects')
          .select('name')
          .eq('id', projectId)
          .single();
        
        const currentProjectName = project?.name || 'Project';
        setProjectName(currentProjectName);

        const { error: emailError } = await supabase.functions.invoke('send-invitation', {
          body: {
            email: data.email,
            projectName: currentProjectName,
            inviterName: user.email,
            role: data.role,
            token,
            acceptUrl,
            declineUrl: `${acceptUrl}&action=decline`
          }
        });

        if (emailError) {
          console.error('Email sending failed:', emailError);
          toast({
            title: "Email delivery may have failed",
            description: `Email might not reach ${data.email}. Please share the invitation link below manually to ensure delivery.`,
            variant: "destructive",
          });
        } else {
          const actionText = existingInvitation ? "resent" : "sent";
          toast({
            title: `Invitation ${actionText} successfully`,
            description: `Email ${actionText} to ${data.email}. You can also share the link below as backup.`,
          });
        }
      } catch (emailError) {
        console.error('Email error:', emailError);
        setShowInviteLink(true);
        toast({
          title: "Email service unavailable",
          description: `The invitation was saved but email couldn't be sent to ${data.email}. Use the link below to invite them manually.`,
          variant: "destructive",
        });
      }
      
      // Always show the invitation link after creation, regardless of email success
      setShowInviteLink(true);
      onInviteSuccess();
      
    } catch (error) {
      console.error('Invitation error:', error);
      toast({
        title: "Failed to send invitation",
        description: "There was an error sending the invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setShowInviteLink(false);
    setInvitationLink(null);
    onClose();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Link copied!",
        description: "Invitation link has been copied to clipboard.",
      });
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const shareViaEmail = (email: string, link: string, projectName: string) => {
    const subject = encodeURIComponent(`You're invited to join ${projectName} on FutureBuild`);
    const body = encodeURIComponent(`Hi,

You've been invited to join the "${projectName}" project on FutureBuild.

Click the link below to accept the invitation:
${link}

This invitation will expire in 7 days.

Best regards,
FutureBuild Team`);
    
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_self');
  };

  const shareViaSMS = (link: string, projectName: string) => {
    const message = encodeURIComponent(`You're invited to join "${projectName}" on FutureBuild. Click: ${link}`);
    window.open(`sms:?body=${message}`, '_self');
  };

  const shareViaWebShare = async (link: string, projectName: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${projectName} on FutureBuild`,
          text: `You're invited to join the "${projectName}" project`,
          url: link,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback to copy
      copyToClipboard(link);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Team Member
          </DialogTitle>
          <DialogDescription>
            Send an invitation to add a new team member to this project.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="colleague@company.com"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{role.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {role.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The role determines what permissions the team member will have.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Show invitation link with sharing options */}
            {showInviteLink && invitationLink && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Share2 className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-800">Invitation Link Ready</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Share this invitation link with <strong>{form.getValues('email')}</strong>:
                    </p>
                    <div className="bg-white border rounded-md p-3 mb-4">
                      <code className="text-xs text-gray-800 break-all select-all">
                        {invitationLink}
                      </code>
                    </div>
                    
                    <p className="text-xs text-blue-600 mb-3 font-medium">
                      Choose how to share the invitation:
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(invitationLink)}
                        className="text-blue-700 border-blue-300 hover:bg-blue-100"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy Link
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          shareViaEmail(form.getValues('email'), invitationLink, projectName);
                        }}
                        className="text-blue-700 border-blue-300 hover:bg-blue-100"
                      >
                        <Mail className="h-3 w-3 mr-1" />
                        Email
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          shareViaSMS(invitationLink, projectName);
                        }}
                        className="text-blue-700 border-blue-300 hover:bg-blue-100"
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        SMS
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          shareViaWebShare(invitationLink, projectName);
                        }}
                        className="text-blue-700 border-blue-300 hover:bg-blue-100"
                      >
                        <Share2 className="h-3 w-3 mr-1" />
                        Share
                      </Button>
                    </div>
                    
                    <div className="pt-2 border-t border-blue-200">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleClose}
                        className="bg-blue-600 hover:bg-blue-700 w-full"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Done
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || showInviteLink}
                className="bg-primary hover:bg-primary/90"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Invitation
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};