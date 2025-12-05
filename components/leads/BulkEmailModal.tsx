'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Mail } from 'lucide-react';
import { BulkActionSummary } from './BulkActionSummary';

interface BulkEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onSend: (subject: string, message: string) => Promise<void>;
}

export function BulkEmailModal({
  open,
  onOpenChange,
  selectedCount,
  onSend,
}: BulkEmailModalProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      await onSend(subject, message);
      toast.success(`✅ Email envoyé à ${selectedCount} lead(s)`);
      onOpenChange(false);
      setSubject('');
      setMessage('');
    } catch (error) {
      console.error('Erreur envoi email:', error);
      toast.error('❌ Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Envoyer un email
          </DialogTitle>
          <DialogDescription>
            Envoyer un email à {selectedCount} lead(s)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <BulkActionSummary
            selectedCount={selectedCount}
            action="Envoi d'email groupé"
          />

          <div className="space-y-2">
            <Label htmlFor="subject">Objet</Label>
            <Input
              id="subject"
              placeholder="Objet de l'email"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Votre message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
            />
          </div>

          <div className="text-sm text-muted-foreground">
            💡 Astuce : Utilisez des variables comme {'{nom}'}, {'{prenom}'}, {'{email}'} pour personnaliser vos messages
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSend} disabled={loading || !subject.trim() || !message.trim()}>
            {loading ? 'Envoi...' : 'Envoyer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
