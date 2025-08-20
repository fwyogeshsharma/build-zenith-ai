-- Create invitations table for team member invitations
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'member',
  invited_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for invitations
CREATE POLICY "Project owners can manage invitations" 
ON public.invitations 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM projects p 
  WHERE p.id = invitations.project_id 
  AND p.owner_id = auth.uid()
));

CREATE POLICY "Project managers can manage invitations" 
ON public.invitations 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM projects p
  LEFT JOIN project_team_members ptm ON p.id = ptm.project_id
  WHERE p.id = invitations.project_id 
  AND ptm.user_id = auth.uid() 
  AND ptm.role IN ('admin', 'project_manager')
));

CREATE POLICY "Users can view invitations sent to them" 
ON public.invitations 
FOR SELECT 
USING (email = (SELECT email FROM profiles WHERE user_id = auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_invitations_updated_at
BEFORE UPDATE ON public.invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_invitations_project_id ON public.invitations(project_id);
CREATE INDEX idx_invitations_email ON public.invitations(email);
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_status ON public.invitations(status);