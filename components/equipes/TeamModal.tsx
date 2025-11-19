'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TeamForm } from "./TeamForm";
import { Team } from "@/lib/types/teams";

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team?: Team | null;
  onSuccess: () => void;
}

export function TeamModal({ isOpen, onClose, team, onSuccess }: TeamModalProps) {
  const isEditing = !!team;

  const handleSuccess = () => {
    // Fermer la modal
    onClose();
    // Notifier le parent du succès pour rafraîchir les données
    onSuccess();
  };

  const handleCancel = () => {
    // Fermer la modal
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Modifier l\'équipe' : 'Créer une équipe'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? `Modifiez les informations de l'équipe "${team.name}".`
              : 'Remplissez les informations ci-dessous pour créer une nouvelle équipe et assigner des membres.'
            }
          </DialogDescription>
        </DialogHeader>
        <TeamForm
          team={team || undefined}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
