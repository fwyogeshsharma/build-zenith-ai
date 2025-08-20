-- Add task_id column to documents table to associate documents with tasks
ALTER TABLE public.documents ADD COLUMN task_id uuid;

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false);

-- Create storage policies for documents
CREATE POLICY "Team members can view documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.documents d
    JOIN public.projects p ON d.project_id = p.id
    LEFT JOIN public.project_team_members ptm ON p.id = ptm.project_id
    WHERE d.file_path = storage.objects.name AND (
      p.owner_id = auth.uid() OR 
      ptm.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Team members can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Team members can update their documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.file_path = storage.objects.name AND d.uploaded_by = auth.uid()
  )
);

CREATE POLICY "Team members can delete their documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.file_path = storage.objects.name AND d.uploaded_by = auth.uid()
  )
);

-- Update documents table RLS policies to allow updates and deletes
DROP POLICY IF EXISTS "Team members can upload documents" ON public.documents;
DROP POLICY IF EXISTS "Team members can view documents" ON public.documents;

CREATE POLICY "Team members can view documents"
ON public.documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    LEFT JOIN public.project_team_members ptm ON p.id = ptm.project_id
    WHERE p.id = documents.project_id AND (
      p.owner_id = auth.uid() OR 
      ptm.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Team members can manage documents"
ON public.documents FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    LEFT JOIN public.project_team_members ptm ON p.id = ptm.project_id
    WHERE p.id = documents.project_id AND (
      p.owner_id = auth.uid() OR 
      ptm.user_id = auth.uid()
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    LEFT JOIN public.project_team_members ptm ON p.id = ptm.project_id
    WHERE p.id = documents.project_id AND (
      p.owner_id = auth.uid() OR 
      ptm.user_id = auth.uid()
    )
  ) AND uploaded_by = auth.uid()
);