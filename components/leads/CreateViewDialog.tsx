'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LeadViewConfig, ColumnConfig, ViewFilter, ViewSort } from '@/types/leads';
import { useUser } from '@clerk/nextjs';

interface CreateViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (view: Omit<LeadViewConfig, 'id' | 'created_at' | 'updated_at'>) => Promise<LeadViewConfig>;
  initialColumns?: ColumnConfig[];
  initialFilters?: ViewFilter[];
  initialSorts?: ViewSort[];
}

export function CreateViewDialog({
  open,
  onOpenChange,
  onCreate,
  initialColumns = [],
  initialFilters = [],
  initialSorts = [],
}: CreateViewDialogProps) {
  const { user } = useUser();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !user) return;

    setLoading(true);
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim(),
        user_id: user.id,
        columns: initialColumns,
        filters: initialFilters,
        sorts: initialSorts,
      });
      
      setName('');
      setDescription('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating view:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle vue</DialogTitle>
          <DialogDescription>
            Donnez un nom et une description à votre vue personnalisée.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim() || loading}>
            {loading ? 'Création...' : 'Créer la vue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
