import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, FileText, Plus, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CertificateRequirementsProps {
  certificateId: string;
  certificationType: string;
  onRequirementUpdate?: () => void;
}

const CertificateRequirements = ({ certificateId, certificationType, onRequirementUpdate }: CertificateRequirementsProps) => {
  const [requirements, setRequirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRequirement, setEditingRequirement] = useState<string | null>(null);
  const [newRequirementText, setNewRequirementText] = useState('');
  const [newRequirementCategory, setNewRequirementCategory] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequirements();
  }, [certificateId]);

  const fetchRequirements = async () => {
    try {
      const { data, error } = await supabase
        .from('certificate_requirements')
        .select('*')
        .eq('certificate_id', certificateId)
        .order('is_mandatory', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setRequirements(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading requirements",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRequirement = async (requirementId: string, isCompleted: boolean) => {
    try {
      const { error } = await supabase
        .from('certificate_requirements')
        .update({
          is_completed: isCompleted,
          completion_date: isCompleted ? new Date().toISOString().split('T')[0] : null
        })
        .eq('id', requirementId);

      if (error) throw error;

      setRequirements(prev => 
        prev.map(req => 
          req.id === requirementId 
            ? { 
                ...req, 
                is_completed: isCompleted,
                completion_date: isCompleted ? new Date().toISOString().split('T')[0] : null
              }
            : req
        )
      );

      // Update parent component to recalculate progress
      onRequirementUpdate?.();

      toast({
        title: isCompleted ? "Requirement completed" : "Requirement marked incomplete",
        description: isCompleted 
          ? "Progress has been updated" 
          : "Progress has been recalculated",
      });
    } catch (error: any) {
      toast({
        title: "Error updating requirement",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateRequirementNotes = async (requirementId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('certificate_requirements')
        .update({ notes })
        .eq('id', requirementId);

      if (error) throw error;

      setRequirements(prev => 
        prev.map(req => 
          req.id === requirementId ? { ...req, notes } : req
        )
      );

      setEditingRequirement(null);
    } catch (error: any) {
      toast({
        title: "Error updating notes",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addRequirement = async () => {
    if (!newRequirementText.trim()) return;

    try {
      const { data, error } = await supabase
        .from('certificate_requirements')
        .insert({
          certificate_id: certificateId,
          requirement_text: newRequirementText,
          requirement_category: newRequirementCategory || 'General',
          is_mandatory: false
        })
        .select()
        .single();

      if (error) throw error;

      setRequirements(prev => [...prev, data]);
      setNewRequirementText('');
      setNewRequirementCategory('');
      setShowAddForm(false);

      toast({
        title: "Requirement added",
        description: "New requirement has been added to the certificate",
      });
    } catch (error: any) {
      toast({
        title: "Error adding requirement",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const calculateProgress = () => {
    if (requirements.length === 0) return 0;
    const completed = requirements.filter(req => req.is_completed).length;
    return Math.round((completed / requirements.length) * 100);
  };

  if (loading) {
    return <div>Loading requirements...</div>;
  }

  const progress = calculateProgress();
  const mandatoryRequirements = requirements.filter(req => req.is_mandatory);
  const optionalRequirements = requirements.filter(req => !req.is_mandatory);
  const completedMandatory = mandatoryRequirements.filter(req => req.is_completed).length;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Requirements Progress</span>
            <Badge variant={progress === 100 ? "default" : "outline"}>
              {progress}% Complete
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progress} className="h-2" />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Mandatory: </span>
              <span className="font-medium">
                {completedMandatory}/{mandatoryRequirements.length}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Optional: </span>
              <span className="font-medium">
                {requirements.filter(req => !req.is_mandatory && req.is_completed).length}/{optionalRequirements.length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add New Requirement */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Requirements Checklist</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Requirement
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAddForm && (
            <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
              <div>
                <Label htmlFor="requirement-text">Requirement Text</Label>
                <Textarea
                  id="requirement-text"
                  value={newRequirementText}
                  onChange={(e) => setNewRequirementText(e.target.value)}
                  placeholder="Describe the requirement..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="requirement-category">Category</Label>
                <Input
                  id="requirement-category"
                  value={newRequirementCategory}
                  onChange={(e) => setNewRequirementCategory(e.target.value)}
                  placeholder="e.g., Energy, Water, Materials"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={addRequirement} size="sm">
                  Add Requirement
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Mandatory Requirements */}
          {mandatoryRequirements.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Mandatory Requirements
              </h4>
              {mandatoryRequirements.map((requirement) => (
                <RequirementItem
                  key={requirement.id}
                  requirement={requirement}
                  onToggle={toggleRequirement}
                  onUpdateNotes={updateRequirementNotes}
                  editingRequirement={editingRequirement}
                  setEditingRequirement={setEditingRequirement}
                />
              ))}
            </div>
          )}

          {/* Optional Requirements */}
          {optionalRequirements.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-blue-700 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Optional Requirements
              </h4>
              {optionalRequirements.map((requirement) => (
                <RequirementItem
                  key={requirement.id}
                  requirement={requirement}
                  onToggle={toggleRequirement}
                  onUpdateNotes={updateRequirementNotes}
                  editingRequirement={editingRequirement}
                  setEditingRequirement={setEditingRequirement}
                />
              ))}
            </div>
          )}

          {requirements.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No requirements defined yet</p>
              <p className="text-sm">Add requirements to track certification progress</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface RequirementItemProps {
  requirement: any;
  onToggle: (id: string, completed: boolean) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  editingRequirement: string | null;
  setEditingRequirement: (id: string | null) => void;
}

const RequirementItem = ({ 
  requirement, 
  onToggle, 
  onUpdateNotes, 
  editingRequirement, 
  setEditingRequirement 
}: RequirementItemProps) => {
  const [notes, setNotes] = useState(requirement.notes || '');

  const handleNotesUpdate = () => {
    onUpdateNotes(requirement.id, notes);
  };

  return (
    <div className={`border rounded-lg p-3 ${requirement.is_completed ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
      <div className="flex items-start gap-3">
        <Checkbox
          checked={requirement.is_completed}
          onCheckedChange={(checked) => onToggle(requirement.id, checked as boolean)}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm ${requirement.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                {requirement.requirement_text}
              </p>
              {requirement.requirement_category && (
                <Badge variant="outline" className="mt-1 text-xs">
                  {requirement.requirement_category}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {requirement.is_mandatory && (
                <Badge variant="destructive" className="text-xs">
                  Mandatory
                </Badge>
              )}
              {requirement.is_completed && requirement.completion_date && (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <Calendar className="h-3 w-3" />
                  {new Date(requirement.completion_date).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {/* Notes Section */}
          <div className="mt-2">
            {editingRequirement === requirement.id ? (
              <div className="space-y-2">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes or evidence..."
                  className="text-sm"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleNotesUpdate}>
                    Save
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setEditingRequirement(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                {requirement.notes ? (
                  <p className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                    {requirement.notes}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No notes added</p>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setNotes(requirement.notes || '');
                    setEditingRequirement(requirement.id);
                  }}
                  className="text-xs"
                >
                  {requirement.notes ? 'Edit' : 'Add Notes'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateRequirements;