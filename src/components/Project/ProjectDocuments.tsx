import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Filter, FileText, Download, Eye, Trash2, Upload, File, Image, Archive } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type Document = Database['public']['Tables']['documents']['Row'];
type DocumentInsert = Database['public']['Tables']['documents']['Insert'];
type DocumentWithTask = Document & {
  tasks?: {
    id: string;
    title: string;
  } | null;
};

interface ProjectDocumentsProps {
  projectId: string;
}

const ProjectDocuments = ({ projectId }: ProjectDocumentsProps) => {
  const [documents, setDocuments] = useState<DocumentWithTask[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPhase, setFilterPhase] = useState('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const { toast } = useToast();

  const [newDocument, setNewDocument] = useState<Partial<DocumentInsert>>({
    name: '',
    phase: 'concept',
    task_id: null,
    tags: []
  });

  useEffect(() => {
    fetchDocuments();
    fetchTasks();
  }, [projectId]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          tasks!documents_task_id_fkey(id, title)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments((data || []) as any);
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

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title')
        .eq('project_id', projectId)
        .order('title');

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      console.error('Error loading tasks:', error);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      const fileName = uploadFile.name;
      const fileExt = fileName.split('.').pop();
      const filePath = `projects/${projectId}/${Date.now()}-${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, uploadFile);

      if (uploadError) throw uploadError;

      // Create document record
      const { data, error } = await supabase
        .from('documents')
        .insert({
          project_id: projectId,
          name: newDocument.name || fileName,
          file_path: filePath,
          file_size: uploadFile.size,
          mime_type: uploadFile.type,
          phase: newDocument.phase,
          task_id: newDocument.task_id,
          tags: newDocument.tags,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id || ''
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh documents list to include the new document with task info
      fetchDocuments();
      setIsUploadOpen(false);
      setUploadFile(null);
      setNewDocument({ name: '', phase: 'concept', task_id: null, tags: [] });

      toast({
        title: "Document uploaded",
        description: "File has been uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error uploading document",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const downloadDocument = async (doc: DocumentWithTask) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.file_path);

      if (error) throw error;

      // Create blob URL and trigger download
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: `Downloading ${doc.name}`,
      });
    } catch (error: any) {
      toast({
        title: "Error downloading document",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const viewDocument = async (doc: DocumentWithTask) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.file_path, 3600); // 1 hour expiry

      if (error) throw error;

      // Open in new tab
      window.open(data.signedUrl, '_blank');
    } catch (error: any) {
      toast({
        title: "Error viewing document",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  const deleteDocument = async (documentId: string) => {
    try {
      // First get the document to find the file path
      const documentToDelete = documents.find(doc => doc.id === documentId);
      
      if (documentToDelete) {
        // Delete the file from Supabase Storage
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([documentToDelete.file_path]);

        if (storageError) {
          console.warn('Error deleting file from storage:', storageError);
          // Continue with database deletion even if storage deletion fails
        }
      }

      // Delete the database record
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

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return <File className="h-5 w-5 text-gray-500" />;
    
    if (mimeType.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500" />;
    } else if (mimeType.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else if (mimeType.includes('zip') || mimeType.includes('archive')) {
      return <Archive className="h-5 w-5 text-purple-500" />;
    } else {
      return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'concept': return 'bg-blue-100 text-blue-800';
      case 'design': return 'bg-purple-100 text-purple-800';
      case 'pre_construction': return 'bg-orange-100 text-orange-800';
      case 'execution': return 'bg-green-100 text-green-800';
      case 'handover': return 'bg-gray-100 text-gray-800';
      case 'operations_maintenance': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPhase = filterPhase === 'all' || doc.phase === filterPhase;
    return matchesSearch && matchesPhase;
  });

  if (loading) {
    return <div className="text-center p-8">Loading documents...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterPhase} onValueChange={setFilterPhase}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Phases</SelectItem>
              <SelectItem value="concept">Concept</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="pre_construction">Pre-Construction</SelectItem>
              <SelectItem value="execution">Execution</SelectItem>
              <SelectItem value="handover">Handover</SelectItem>
              <SelectItem value="operations_maintenance">Operations & Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file">Select File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip,.xlsx,.xls"
                  />
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </div>
                {uploadFile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Selected: {uploadFile.name} ({formatFileSize(uploadFile.size)})
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="name">Document Name (optional)</Label>
                <Input
                  id="name"
                  value={newDocument.name}
                  onChange={(e) => setNewDocument({ ...newDocument, name: e.target.value })}
                  placeholder="Custom name for the document"
                />
              </div>

              <div>
                <Label htmlFor="phase">Project Phase</Label>
                <Select 
                  value={newDocument.phase} 
                  onValueChange={(value) => setNewDocument({ ...newDocument, phase: value as any })}
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

              <div>
                <Label htmlFor="task">Linked Task (optional)</Label>
                <Select 
                  value={newDocument.task_id || 'none'} 
                  onValueChange={(value) => setNewDocument({ ...newDocument, task_id: value === 'none' ? null : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a task or leave empty for general document" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific task</SelectItem>
                    {tasks.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleFileUpload} className="flex-1" disabled={!uploadFile}>
                  Upload Document
                </Button>
                <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              {documents.length === 0 ? 'No documents uploaded yet' : 'No documents match your search'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getFileIcon(document.mime_type)}
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{document.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="outline" className={getPhaseColor(document.phase || '')}>
                          {document.phase?.replace('_', ' ')}
                        </Badge>
                        {document.tasks && (
                          <Badge variant="secondary" className="text-xs">
                            Task: {document.tasks.title}
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {formatFileSize(document.file_size)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(document.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {document.tags && document.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {document.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {document.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{document.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => viewDocument(document)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => downloadDocument(document)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => deleteDocument(document.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Document Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {documents.filter(d => d.mime_type?.includes('pdf')).length}
            </div>
            <div className="text-sm text-muted-foreground">PDFs</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {documents.filter(d => d.mime_type?.startsWith('image/')).length}
            </div>
            <div className="text-sm text-muted-foreground">Images</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {documents.filter(d => d.phase === 'design').length}
            </div>
            <div className="text-sm text-muted-foreground">Design Phase</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">
              {Math.round(documents.reduce((sum, d) => sum + (d.file_size || 0), 0) / 1024 / 1024)}
            </div>
            <div className="text-sm text-muted-foreground">Total MB</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectDocuments;