'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LeadViewConfig } from '@/types/leads';

interface EditViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  view: LeadViewConfig;
  onUpdate: (id: string, updates: Partial<LeadViewConfig>) => Promise<LeadViewConfig>;
}

export function EditViewDialog({
  open,
  onOpenChange,
  view,
  onUpdate,
}: EditViewDialogProps) {
  const [name, setName] = useState(view.name);
  const [description, setDescription] = useState(view.description || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(view.name);
    setDescription(view.description || '');
  }, [view]);

  const handleUpdate = async () => {
    if (!name.trim() || !view.id) return;

    setLoading(true);
    try {
      await onUpdate(view.id, {
        name: name.trim(),
        description: description.trim(),
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating view:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifier la vue</DialogTitle>
          <DialogDescription>
            Modifiez le nom et la description de votre vue.
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
          <Button onClick={handleUpdate} disabled={!name.trim() || loading}>
            {loading ? 'Mise à jour...' : 'Mettre à jour'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
