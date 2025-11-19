'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TeamForm } from "./TeamForm";
import { Team } from "@/lib/types/teams";

interface TeamCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function TeamCreateModal({ isOpen, onClose, onSuccess }: TeamCreateModalProps) {
  const handleSuccess = () => {
    // Fermer la modal
    onClose();
    // Notifier le parent du succès
    onSuccess?.();
  };

  const handleCancel = () => {
    // Fermer la modal sans notification
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle équipe</DialogTitle>
          <DialogDescription>
            Remplissez les informations ci-dessous pour créer une nouvelle équipe et assigner des membres.
          </DialogDescription>
        </DialogHeader>
        <TeamForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
