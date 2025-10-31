'use client';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Phone, FileText, Edit, Trash2, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';

interface LeadsTableActionsMenuProps {
  onCall: () => void;
  onNote: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function LeadsTableActionsMenu({ 
  onCall, 
  onNote, 
  onEdit, 
  onDelete 
}: LeadsTableActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onCall}>
          <Phone className="mr-2 h-4 w-4 text-blue-500" /> Appeler
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onNote}>
          <FileText className="mr-2 h-4 w-4 text-amber-500" /> Noter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4 text-green-600" /> Modifier
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            if (confirm('Confirmer la suppression ?')) {
              onDelete();
              toast.success('Lead supprimé');
            }
          }}
          className="text-red-600 focus:text-red-700"
        >
          <Trash2 className="mr-2 h-4 w-4" /> Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
