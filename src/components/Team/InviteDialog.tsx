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
import { Loader2, UserPlus } from 'lucide-react';

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

      // Check if there's already a pending invitation
      const { data: existingInvitation } = await supabase
        .from('invitations')
        .select('id')
        .eq('project_id', projectId)
        .eq('email', data.email)
        .eq('status', 'pending')
        .single();

      if (existingInvitation) {
        toast({
          title: "Invitation already sent",
          description: "A pending invitation already exists for this email.",
          variant: "destructive",
        });
        return;
      }

      // Create invitation
      const { error } = await supabase
        .from('invitations')
        .insert({
          project_id: projectId,
          email: data.email,
          role: data.role,
          invited_by: user.id,
          token,
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;

      // TODO: Send invitation email via edge function
      
      onInviteSuccess();
      onClose();
      form.reset();
      
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
    onClose();
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
                disabled={isLoading}
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