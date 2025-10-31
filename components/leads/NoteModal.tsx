'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/utils/supabase/client';

export function NoteModal({ open, onOpenChange, lead }: any) {
  const supabase = createClient();
  const [note, setNote] = useState('');

  const handleSave = async () => {
    if (!note.trim()) return;
    await supabase.from('historique_actions').insert({
      lead_id: lead.id,
      type: 'note',
      contenu: note,
    });
    setNote('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter une note</DialogTitle>
        </DialogHeader>
        <textarea
          className="w-full border rounded-md p-2 min-h-[120px] text-sm"
          placeholder="Écrivez une note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <Button onClick={handleSave} className="mt-3 w-full">
          Enregistrer
        </Button>
      </DialogContent>
    </Dialog>
  );
}
