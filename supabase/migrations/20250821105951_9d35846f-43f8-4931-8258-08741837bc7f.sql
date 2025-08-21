-- Add foreign key constraint for documents.task_id -> tasks.id
ALTER TABLE public.documents 
ADD CONSTRAINT documents_task_id_fkey 
FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE SET NULL;