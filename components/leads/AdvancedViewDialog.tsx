'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LeadViewConfig, ColumnConfig, ViewFilter, ViewSort } from '@/types/leads';
import { ViewConfigPanel } from './ViewConfigPanel';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AdvancedViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  view?: LeadViewConfig | null;
  availableFields: Array<{ key: string; label: string }>;
  onCreate?: (view: Omit<LeadViewConfig, 'id' | 'created_at' | 'updated_at'>) => Promise<LeadViewConfig>;
  onUpdate?: (id: string, updates: Partial<LeadViewConfig>) => Promise<LeadViewConfig>;
  userId: string;
}

export function AdvancedViewDialog({
  open,
  onOpenChange,
  view,
  availableFields,
  onCreate,
  onUpdate,
  userId,
}: AdvancedViewDialogProps) {
  const [name, setName] = useState(view?.name || '');
  const [description, setDescription] = useState(view?.description || '');
  const [columns, setColumns] = useState<ColumnConfig[]>(view?.columns || []);
  const [filters, setFilters] = useState<ViewFilter[]>(view?.filters || []);
  const [sorts, setSorts] = useState<ViewSort[]>(view?.sorts || []);
  const [loading, setLoading] = useState(false);

  const isEditMode = !!view?.id;

  useEffect(() => {
    if (view) {
      setName(view.name);
      setDescription(view.description || '');
      setColumns(view.columns || []);
      setFilters(view.filters || []);
      setSorts(view.sorts || []);
    } else {
      setName('');
      setDescription('');
      setColumns([]);
      setFilters([]);
      setSorts([]);
    }
  }, [view]);

  const handleSave = async () => {
    if (!name.trim()) return;

    setLoading(true);
    try {
      if (isEditMode && view?.id && onUpdate) {
        await onUpdate(view.id, {
          name: name.trim(),
          description: description.trim(),
          columns,
          filters,
          sorts,
        });
      } else if (onCreate) {
        await onCreate({
          name: name.trim(),
          description: description.trim(),
          user_id: userId,
          columns,
          filters,
          sorts,
        });
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving view:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Modifier la vue' : 'Créer une vue personnalisée'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la vue *</Label>
                <Input
                  id="name"
                  placeholder="Ma vue personnalisée"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Description de la vue (optionnel)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <ViewConfigPanel
              columns={columns}
              filters={filters}
              sorts={sorts}
              availableFields={availableFields}
              onColumnsChange={setColumns}
              onFiltersChange={setFilters}
              onSortsChange={setSorts}
            />
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || loading}>
            {loading 
              ? (isEditMode ? 'Mise à jour...' : 'Création...') 
              : (isEditMode ? 'Mettre à jour' : 'Créer la vue')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
