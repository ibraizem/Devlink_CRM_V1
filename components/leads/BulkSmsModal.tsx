'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { MessageSquare } from 'lucide-react';
import { BulkActionSummary } from './BulkActionSummary';

interface BulkSmsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onSend: (message: string) => Promise<void>;
}

export function BulkSmsModal({
  open,
  onOpenChange,
  selectedCount,
  onSend,
}: BulkSmsModalProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const maxLength = 160;
  const remainingChars = maxLength - message.length;

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Veuillez écrire un message');
      return;
    }

    if (message.length > maxLength) {
      toast.error(`Le message ne doit pas dépasser ${maxLength} caractères`);
      return;
    }

    setLoading(true);
    try {
      await onSend(message);
      toast.success(`✅ SMS envoyé à ${selectedCount} lead(s)`);
      onOpenChange(false);
      setMessage('');
    } catch (error) {
      console.error('Erreur envoi SMS:', error);
      toast.error('❌ Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Envoyer un SMS
          </DialogTitle>
          <DialogDescription>
            Envoyer un SMS à {selectedCount} lead(s)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <BulkActionSummary
            selectedCount={selectedCount}
            action="Envoi de SMS groupé"
            details={[
              { label: 'Limite par SMS', value: '160 caractères', variant: 'secondary' }
            ]}
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="message">Message</Label>
              <span className={`text-sm ${remainingChars < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {remainingChars} caractères restants
              </span>
            </div>
            <Textarea
              id="message"
              placeholder="Votre message SMS..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={maxLength}
            />
          </div>

          <div className="text-sm text-muted-foreground">
            💡 Astuce : Utilisez des variables comme {'{nom}'}, {'{prenom}'} pour personnaliser vos messages
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={loading || !message.trim() || message.length > maxLength}
          >
            {loading ? 'Envoi...' : 'Envoyer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
