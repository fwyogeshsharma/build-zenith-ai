import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Package, Settings, Users, Wrench } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type TaskResource = Database['public']['Tables']['task_resources']['Row'];
type Material = Database['public']['Tables']['materials']['Row'];
type TaskResourceInsert = Database['public']['Tables']['task_resources']['Insert'];

interface TaskResourcesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
}

export const TaskResourcesDialog = ({ isOpen, onClose, taskId, taskTitle }: TaskResourcesDialogProps) => {
  const [resources, setResources] = useState<TaskResource[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddingResource, setIsAddingResource] = useState(false);
  const { toast } = useToast();

  const [newResource, setNewResource] = useState<Partial<TaskResourceInsert>>({
    task_id: taskId,
    resource_type: 'material',
    resource_name: '',
    quantity: 0,
    unit: 'kg',
    cost_per_unit: 0
  });

  useEffect(() => {
    if (isOpen) {
      fetchResources();
      fetchMaterials();
    }
  }, [isOpen, taskId]);

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from('task_resources')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading resources",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('is_public', true)
        .order('name');

      if (error) throw error;
      setMaterials(data || []);
    } catch (error: any) {
      console.error('Error loading materials:', error);
    }
  };

  const handleMaterialSelect = (materialId: string) => {
    const material = materials.find(m => m.id === materialId);
    if (material) {
      setNewResource({
        ...newResource,
        material_id: materialId,
        resource_name: material.name,
        unit: material.unit,
        cost_per_unit: material.cost_per_unit || 0
      });
    }
  };

  const addResource = async () => {
    if (!newResource.resource_name?.trim()) {
      toast({
        title: "Error",
        description: "Resource name is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('task_resources')
        .insert({
          task_id: taskId,
          resource_type: newResource.resource_type!,
          resource_name: newResource.resource_name!,
          material_id: newResource.material_id || null,
          quantity: newResource.quantity || 0,
          unit: newResource.unit || 'unit',
          cost_per_unit: newResource.cost_per_unit || 0,
          allocated_hours: newResource.allocated_hours || null,
          start_date: newResource.start_date || null,
          end_date: newResource.end_date || null,
          notes: newResource.notes || null,
          created_by: userData.user?.id || ''
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Resource added successfully",
      });

      setNewResource({
        task_id: taskId,
        resource_type: 'material',
        resource_name: '',
        quantity: 0,
        unit: 'kg',
        cost_per_unit: 0
      });
      
      setIsAddingResource(false);
      fetchResources();
    } catch (error: any) {
      toast({
        title: "Error adding resource",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteResource = async (resourceId: string) => {
    try {
      const { error } = await supabase
        .from('task_resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Resource removed",
      });
      
      fetchResources();
    } catch (error: any) {
      toast({
        title: "Error removing resource",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'material': return <Package className="h-4 w-4" />;
      case 'equipment': return <Wrench className="h-4 w-4" />;
      case 'labor': return <Users className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getResourceTypeColor = (type: string) => {
    switch (type) {
      case 'material': return 'bg-blue-100 text-blue-800';
      case 'equipment': return 'bg-purple-100 text-purple-800';
      case 'labor': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalCost = resources.reduce((sum, resource) => sum + (resource.total_cost || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Task Resources - {taskTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total Resources</p>
                  <p className="text-2xl font-bold">{resources.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Cost</p>
                  <p className="text-2xl font-bold">${totalCost.toFixed(2)}</p>
                </div>
                <Button onClick={() => setIsAddingResource(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Resource
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Add Resource Form */}
          {isAddingResource && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Resource</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Resource Type</Label>
                    <Select 
                      value={newResource.resource_type} 
                      onValueChange={(value) => setNewResource({ ...newResource, resource_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="material">Material</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="labor">Labor</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newResource.resource_type === 'material' && (
                    <div>
                      <Label>Select Material (Optional)</Label>
                      <Select onValueChange={handleMaterialSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose from library" />
                        </SelectTrigger>
                        <SelectContent>
                          {materials.map((material) => (
                            <SelectItem key={material.id} value={material.id}>
                              {material.name} ({material.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Resource Name</Label>
                  <Input
                    value={newResource.resource_name}
                    onChange={(e) => setNewResource({ ...newResource, resource_name: e.target.value })}
                    placeholder="Enter resource name"
                  />
                </div>

                {newResource.resource_type !== 'labor' && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        value={newResource.quantity === 0 ? '' : newResource.quantity}
                        onChange={(e) => setNewResource({ ...newResource, quantity: parseFloat(e.target.value) || 0 })}
                        placeholder="Enter quantity"
                      />
                    </div>
                    <div>
                      <Label>Unit</Label>
                      <Input
                        value={newResource.unit}
                        onChange={(e) => setNewResource({ ...newResource, unit: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Cost per Unit ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newResource.cost_per_unit === 0 ? '' : newResource.cost_per_unit}
                        onChange={(e) => setNewResource({ ...newResource, cost_per_unit: parseFloat(e.target.value) || 0 })}
                        placeholder="Enter cost"
                      />
                    </div>
                  </div>
                )}

                {newResource.resource_type === 'labor' && (
                  <div>
                    <Label>Allocated Hours</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={newResource.allocated_hours || ''}
                      onChange={(e) => setNewResource({ ...newResource, allocated_hours: parseFloat(e.target.value) || undefined })}
                      placeholder="Enter hours"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={newResource.start_date || ''}
                      onChange={(e) => setNewResource({ ...newResource, start_date: e.target.value || undefined })}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={newResource.end_date || ''}
                      onChange={(e) => setNewResource({ ...newResource, end_date: e.target.value || undefined })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={newResource.notes || ''}
                    onChange={(e) => setNewResource({ ...newResource, notes: e.target.value || undefined })}
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={addResource} disabled={loading}>
                    {loading ? 'Adding...' : 'Add Resource'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingResource(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resources List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Current Resources</h3>
            {resources.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No resources added yet</p>
                </CardContent>
              </Card>
            ) : (
              resources.map((resource) => (
                <Card key={resource.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getResourceIcon(resource.resource_type)}
                          <h4 className="font-semibold">{resource.resource_name}</h4>
                          <Badge className={getResourceTypeColor(resource.resource_type)}>
                            {resource.resource_type}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Quantity</p>
                            <p className="font-medium">{resource.quantity} {resource.unit}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Cost per Unit</p>
                            <p className="font-medium">${resource.cost_per_unit}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Total Cost</p>
                            <p className="font-medium text-green-600">${resource.total_cost}</p>
                          </div>
                          {resource.allocated_hours && (
                            <div>
                              <p className="text-muted-foreground">Hours</p>
                              <p className="font-medium">{resource.allocated_hours}h</p>
                            </div>
                          )}
                        </div>

                        {resource.notes && (
                          <p className="text-sm text-muted-foreground mt-2">{resource.notes}</p>
                        )}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteResource(resource.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};