'use client';

import { Button } from '@/components/ui/button';
import { 
  Download, 
  Trash2, 
  Mail, 
  MessageSquare, 
  UserPlus, 
  X,
  CheckSquare,
  ListChecks,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

interface BulkActionsBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onExport: () => void;
  onDelete: () => void;
  onStatusChange: (status: string) => void;
  onEmail: () => void;
  onSms: () => void;
  onAssign: () => void;
}

export function BulkActionsBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onExport,
  onDelete,
  onStatusChange,
  onEmail,
  onSms,
  onAssign,
}: BulkActionsBarProps) {
  const isAllSelected = selectedCount === totalCount;

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-primary text-primary-foreground shadow-2xl rounded-lg px-4 py-3 flex items-center gap-3 min-w-[600px] max-w-4xl">
            {/* Compteur et sélection */}
            <div className="flex items-center gap-3 border-r border-primary-foreground/20 pr-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                <span className="font-semibold text-sm">
                  {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
                </span>
              </div>
              
              {!isAllSelected && selectedCount < totalCount && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSelectAll}
                  className="h-7 text-xs text-primary-foreground hover:bg-primary-foreground/10 whitespace-nowrap"
                >
                  <ListChecks className="h-3 w-3 mr-1" />
                  Tout sélectionner ({totalCount})
                </Button>
              )}

              {isAllSelected && (
                <span className="text-xs opacity-75">
                  (Toutes les lignes)
                </span>
              )}
            </div>

          {/* Actions groupées */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onAssign}
              className="h-8 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <UserPlus className="h-4 w-4 mr-1.5" />
              Assigner
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <Tag className="h-4 w-4 mr-1.5" />
                  Statut
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuLabel>Changer le statut</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onStatusChange('nouveau')}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    Nouveau
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange('en_cours')}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                    En cours
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange('traite')}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    Traité
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange('abandonne')}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    Abandonné
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="sm"
              onClick={onEmail}
              className="h-8 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Mail className="h-4 w-4 mr-1.5" />
              Email
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onSms}
              className="h-8 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <MessageSquare className="h-4 w-4 mr-1.5" />
              SMS
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onExport}
              className="h-8 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Download className="h-4 w-4 mr-1.5" />
              Exporter
            </Button>

            <div className="h-6 w-px bg-primary-foreground/20 mx-1" />

            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 text-primary-foreground hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Supprimer
            </Button>
          </div>

          {/* Bouton de fermeture */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-8 w-8 p-0 ml-auto text-primary-foreground hover:bg-primary-foreground/10"
          >
            <X className="h-4 w-4" />
          </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
