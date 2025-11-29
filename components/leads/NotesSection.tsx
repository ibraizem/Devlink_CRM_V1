'use client';

import { useEffect, useState } from 'react';
import { Note, getLeadNotes, createNote, updateNote, deleteNote } from '@/lib/types/leads';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface NotesSectionProps {
  leadId: string;
}

export function NotesSection({ leadId }: NotesSectionProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadNotes();
  }, [leadId]);

  const loadNotes = async () => {
    setLoading(true);
    const { data } = await getLeadNotes(leadId);
    if (data) setNotes(data);
    setLoading(false);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setSaving(true);
    const { data, error } = await createNote(leadId, newNote);
    
    if (error) {
      toast.error('Erreur lors de l\'ajout de la note');
    } else {
      toast.success('Note ajoutée avec succès');
      setNewNote('');
      loadNotes();
    }
    
    setSaving(false);
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editingContent.trim()) return;

    setSaving(true);
    const { error } = await updateNote(noteId, editingContent);
    
    if (error) {
      toast.error('Erreur lors de la modification de la note');
    } else {
      toast.success('Note modifiée avec succès');
      setEditingId(null);
      loadNotes();
    }
    
    setSaving(false);
  };

  const handleDeleteNote = async () => {
    if (!deleteId) return;

    const { error } = await deleteNote(deleteId);
    
    if (error) {
      toast.error('Erreur lors de la suppression de la note');
    } else {
      toast.success('Note supprimée avec succès');
      setDeleteId(null);
      loadNotes();
    }
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditingContent(note.contenu);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingContent('');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Nouvelle note</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Écrivez une note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
          />
          <Button
            onClick={handleAddNote}
            disabled={!newNote.trim() || saving}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une note
          </Button>
        </CardContent>
      </Card>

      {notes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">Aucune note pour ce lead</p>
          </CardContent>
        </Card>
      ) : (
        notes.map((note) => (
          <Card key={note.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  {note.users_profile && (
                    <p className="text-sm font-medium">
                      {note.users_profile.nom} {note.users_profile.prenom}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    {format(new Date(note.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                  </p>
                </div>

                {editingId !== note.id && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(note)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(note.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                )}
              </div>

              {editingId === note.id ? (
                <div className="space-y-3">
                  <Textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    rows={3}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUpdateNote(note.id)}
                      disabled={saving}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Enregistrer
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelEdit}
                      disabled={saving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{note.contenu}</p>
              )}
            </CardContent>
          </Card>
        ))
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la note</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette note ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNote}
              className="bg-red-500 hover:bg-red-600"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
