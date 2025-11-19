"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CampaignForm } from "./CampaignForm";

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign?: any;
  onSuccess: () => void;
}

export function CampaignModal({ isOpen, onClose, campaign, onSuccess }: CampaignModalProps) {
  const isEditing = !!campaign;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <CampaignForm
          initialData={campaign}
          onSuccess={onSuccess}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
