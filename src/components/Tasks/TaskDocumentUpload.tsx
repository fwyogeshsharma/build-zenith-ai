import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type DocumentInsert = Database['public']['Tables']['documents']['Insert'];

interface TaskDocumentUploadProps {
  taskId: string;
  projectId: string;
  onUploadComplete: () => void;
  onCancel: () => void;
}

export const TaskDocumentUpload = ({ taskId, projectId, onUploadComplete, onCancel }: TaskDocumentUploadProps) => {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [newDocument, setNewDocument] = useState<Partial<DocumentInsert>>({
    name: '',
    phase: 'concept',
    tags: []
  });

  const handleFileUpload = async () => {
    if (!uploadFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileName = uploadFile.name;
      const fileExt = fileName.split('.').pop();
      const filePath = `tasks/${taskId}/${Date.now()}-${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, uploadFile);

      if (uploadError) throw uploadError;

      // Create document record
      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          project_id: projectId,
          task_id: taskId,
          name: newDocument.name || fileName,
          file_path: filePath,
          file_size: uploadFile.size,
          mime_type: uploadFile.type,
          phase: newDocument.phase,
          tags: newDocument.tags,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id || ''
        });

      if (insertError) throw insertError;

      toast({
        title: "Document uploaded",
        description: "File has been uploaded successfully",
      });

      onUploadComplete();
    } catch (error: any) {
      toast({
        title: "Error uploading document",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="file">Select File</Label>
        <div className="flex items-center gap-2">
          <Input
            id="file"
            type="file"
            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip,.xlsx,.xls,.txt,.csv"
            disabled={uploading}
          />
          <Upload className="h-4 w-4 text-muted-foreground" />
        </div>
        {uploadFile && (
          <div className="flex items-center justify-between mt-2 p-2 bg-muted/50 rounded-md">
            <div>
              <p className="text-sm font-medium">{uploadFile.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(uploadFile.size)}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setUploadFile(null)}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      <div>
        <Label htmlFor="name">Document Name (optional)</Label>
        <Input
          id="name"
          value={newDocument.name}
          onChange={(e) => setNewDocument({ ...newDocument, name: e.target.value })}
          placeholder="Custom name for the document"
          disabled={uploading}
        />
      </div>

      <div>
        <Label htmlFor="phase">Project Phase</Label>
        <Select 
          value={newDocument.phase} 
          onValueChange={(value) => setNewDocument({ ...newDocument, phase: value as any })}
          disabled={uploading}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="concept">Concept</SelectItem>
            <SelectItem value="design">Design</SelectItem>
            <SelectItem value="pre_construction">Pre-Construction</SelectItem>
            <SelectItem value="execution">Execution</SelectItem>
            <SelectItem value="handover">Handover</SelectItem>
            <SelectItem value="operations_maintenance">Operations & Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-4">
        <Button 
          onClick={handleFileUpload} 
          className="flex-1" 
          disabled={!uploadFile || uploading}
        >
          {uploading ? 'Uploading...' : 'Upload Document'}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={uploading}>
          Cancel
        </Button>
      </div>
    </div>
  );
};