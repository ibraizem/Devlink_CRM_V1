'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';

export function NoteModal({ open, onOpenChange, lead }: any) {
  const [note, setNote] = useState('');

  const handleSave = async () => {
    if (!note.trim()) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    
    const insertData = {
      lead_id: lead.id,
      agent_id: user?.id,
      type: 'note',
      contenu: note,
    };
    
    console.log('🔍 NoteModal - Données envoyées à lead_actions:', insertData);
    
    const { error } = await supabase.from('lead_actions').insert(insertData);
    if (error) {
      console.error('❌ NoteModal - Erreur insertion lead_actions:', error);
    } else {
      console.log('✅ NoteModal - Insertion réussie');
    }
    
    setNote('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter une note</DialogTitle>
          <DialogDescription>
            Ajoutez une note pour ce lead. Cette note sera enregistrée dans l'historique.
          </DialogDescription>
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
