// components/leads/LeadActions.tsx
'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, Phone, Mail, FileText, User, Trash2 } from 'lucide-react';
import { LeadData } from '@/lib/services/leadService';

// Interface étendue pour inclure les propriétés nécessaires au composant
type LeadWithContact = LeadData & {
  donnees: {
    telephone?: string;
    email?: string;
    [key: string]: any;
  };
};

interface LeadActionsProps {
  lead: Partial<LeadWithContact> & { id: string };
  onCall?: () => void;
  onEmail?: () => void;
  onDelete?: () => void;
  onStatusUpdate?: (status: string) => void;
  className?: string;
}

export function LeadActions({ 
  lead, 
  onCall, 
  onEmail, 
  onDelete, 
  onStatusUpdate, 
  className = '' 
}: LeadActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCall) onCall();
    else if (lead.donnees && 'telephone' in lead.donnees) {
      window.open(`tel:${lead.donnees.telephone}`, '_blank');
    }
  };

  const handleEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEmail) onEmail();
    else if (lead.donnees && 'email' in lead.donnees) {
      window.open(`mailto:${lead.donnees.email}`, '_blank');
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete();
  };

  const hasPhone = lead.donnees && 'telephone' in lead.donnees && !!lead.donnees.telephone;
  const hasEmail = lead.donnees && 'email' in lead.donnees && !!lead.donnees.email;

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {hasPhone && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-blue-600 hover:bg-blue-50"
          onClick={handleCall}
          title={`Appeler ${lead.donnees?.telephone || ''}`}
        >
          <Phone className="h-4 w-4" />
        </Button>
      )}
      
      {hasEmail && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-blue-600 hover:bg-blue-50"
          onClick={handleEmail}
          title="Envoyer un email"
        >
          <Mail className="h-4 w-4" />
        </Button>
      )}

      <DropdownMenu onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-gray-500 hover:bg-gray-100"
          >
            <MoreVertical className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem 
            onClick={handleDelete}
            className="flex items-center space-x-2 text-red-600 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
            <span>Supprimer</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}