'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { LeadViewConfig } from '@/types/leads';
import { Users } from 'lucide-react';

interface ShareViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  view: LeadViewConfig;
  onShare: (id: string, shared: boolean) => Promise<void>;
}

export function ShareViewDialog({
  open,
  onOpenChange,
  view,
  onShare,
}: ShareViewDialogProps) {
  const [shareWithTeam, setShareWithTeam] = useState(view.shared_with_team || false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setShareWithTeam(view.shared_with_team || false);
  }, [view]);

  const handleShare = async () => {
    if (!view.id) return;

    setLoading(true);
    try {
      await onShare(view.id, shareWithTeam);
      onOpenChange(false);
    } catch (error) {
      console.error('Error sharing view:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Partager la vue</DialogTitle>
          <DialogDescription>
            Partagez votre vue avec votre équipe pour qu'ils puissent l'utiliser.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="share-team" className="text-base">
                  Partager avec l'équipe
                </Label>
                <p className="text-sm text-muted-foreground">
                  Tous les membres de l'équipe pourront voir et utiliser cette vue
                </p>
              </div>
            </div>
            <Switch
              id="share-team"
              checked={shareWithTeam}
              onCheckedChange={setShareWithTeam}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleShare} disabled={loading}>
            {loading ? 'Partage...' : 'Partager'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
