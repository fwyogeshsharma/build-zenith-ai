import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, FileText, Download, Eye, Trash2, File, Image, Archive } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import { TaskDocumentUpload } from './TaskDocumentUpload';

type Document = Database['public']['Tables']['documents']['Row'];

interface TaskDocumentsProps {
  taskId: string;
  projectId: string;
  refreshTrigger?: number;
}

export const TaskDocuments = ({ taskId, projectId, refreshTrigger }: TaskDocumentsProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
  }, [taskId, refreshTrigger]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading documents",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      setDocuments(documents.filter(doc => doc.id !== documentId));

      toast({
        title: "Document deleted",
        description: "Document has been removed",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting document",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const downloadDocument = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = doc.name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Error downloading document",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return <File className="h-4 w-4 text-muted-foreground" />;
    
    if (mimeType.startsWith('image/')) {
      return <Image className="h-4 w-4 text-primary" />;
    } else if (mimeType.includes('pdf')) {
      return <FileText className="h-4 w-4 text-destructive" />;
    } else if (mimeType.includes('zip') || mimeType.includes('archive')) {
      return <Archive className="h-4 w-4 text-secondary" />;
    } else {
      return <File className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return <div className="text-center p-4">Loading documents...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Task Documents</h3>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Document to Task</DialogTitle>
            </DialogHeader>
            <TaskDocumentUpload
              taskId={taskId}
              projectId={projectId}
              onUploadComplete={() => {
                fetchDocuments();
                setIsUploadOpen(false);
              }}
              onCancel={() => setIsUploadOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Documents List */}
      {documents.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No documents uploaded yet</p>
            <p className="text-sm text-muted-foreground mt-1">Upload documents to keep them organized with this task</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {documents.map((document) => (
            <Card key={document.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {getFileIcon(document.mime_type)}
                    
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm truncate">{document.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(document.file_size)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(document.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 w-7 p-0"
                      onClick={() => downloadDocument(document)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => deleteDocument(document.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Summary */}
          <div className="text-xs text-muted-foreground text-center pt-2">
            {documents.length} document{documents.length !== 1 ? 's' : ''} • {
              Math.round(documents.reduce((sum, d) => sum + (d.file_size || 0), 0) / 1024)
            } KB total
          </div>
        </div>
      )}
    </div>
  );
};