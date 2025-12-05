'use client';

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
import { AlertTriangle } from 'lucide-react';

interface BulkDeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: () => void;
}

export function BulkDeleteConfirmDialog({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
}: BulkDeleteConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2">
            <p>
              Vous êtes sur le point de supprimer{' '}
              <span className="font-semibold text-destructive">
                {selectedCount} lead{selectedCount > 1 ? 's' : ''}
              </span>
              .
            </p>
            <p className="text-sm">
              Cette action est <strong>irréversible</strong> et supprimera définitivement :
            </p>
            <ul className="text-sm list-disc list-inside space-y-1 ml-2">
              <li>Les données des leads</li>
              <li>L&apos;historique des interactions</li>
              <li>Les notes associées</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Supprimer {selectedCount} lead{selectedCount > 1 ? 's' : ''}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
