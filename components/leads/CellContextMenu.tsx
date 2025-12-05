'use client'

import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger 
} from '@/components/ui/context-menu'
import { 
  Copy, 
  Phone, 
  Mail, 
  MessageSquare, 
  Edit, 
  Trash2, 
  StickyNote,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  Filter
} from 'lucide-react'
import { Lead } from '@/types/leads'
import { LeadStatus } from '@/lib/services/leadService'

interface CellContextMenuProps {
  children: React.ReactNode
  lead: Lead
  cellKey?: string
  cellValue?: any
  onCall?: (lead: Lead) => void
  onEmail?: (lead: Lead) => void
  onMessage?: (lead: Lead) => void
  onEdit?: (lead: Lead) => void
  onDelete?: (lead: Lead) => void
  onNote?: (lead: Lead) => void
  onStatusChange?: (lead: Lead, status: LeadStatus) => void
  onCopyCell?: (value: any) => void
  onCopyRow?: (lead: Lead) => void
  onFilterByValue?: (key: string, value: any) => void
}

export function CellContextMenu({
  children,
  lead,
  cellKey,
  cellValue,
  onCall,
  onEmail,
  onMessage,
  onEdit,
  onDelete,
  onNote,
  onStatusChange,
  onCopyCell,
  onCopyRow,
  onFilterByValue
}: CellContextMenuProps) {
  const handleCopyCell = () => {
    if (cellValue !== undefined && cellValue !== null) {
      navigator.clipboard.writeText(String(cellValue))
      onCopyCell?.(cellValue)
    }
  }

  const handleCopyRow = () => {
    const rowData = JSON.stringify(lead, null, 2)
    navigator.clipboard.writeText(rowData)
    onCopyRow?.(lead)
  }

  const handleFilterByValue = () => {
    if (cellKey && cellValue !== undefined && cellValue !== null) {
      onFilterByValue?.(cellKey, cellValue)
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        {cellKey && cellValue !== undefined && cellValue !== null && (
          <>
            <ContextMenuItem onClick={handleCopyCell}>
              <Copy className="mr-2 h-4 w-4" />
              Copier la cellule
            </ContextMenuItem>
            <ContextMenuItem onClick={handleFilterByValue}>
              <Filter className="mr-2 h-4 w-4" />
              Filtrer par cette valeur
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        
        <ContextMenuItem onClick={handleCopyRow}>
          <Copy className="mr-2 h-4 w-4" />
          Copier toute la ligne
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        {onCall && (
          <ContextMenuItem onClick={() => onCall(lead)}>
            <Phone className="mr-2 h-4 w-4" />
            Appeler
          </ContextMenuItem>
        )}
        
        {onEmail && (
          <ContextMenuItem onClick={() => onEmail(lead)}>
            <Mail className="mr-2 h-4 w-4" />
            Envoyer un email
          </ContextMenuItem>
        )}
        
        {onMessage && (
          <ContextMenuItem onClick={() => onMessage(lead)}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Envoyer un message
          </ContextMenuItem>
        )}
        
        <ContextMenuSeparator />
        
        {onNote && (
          <ContextMenuItem onClick={() => onNote(lead)}>
            <StickyNote className="mr-2 h-4 w-4" />
            Ajouter une note
          </ContextMenuItem>
        )}
        
        {onEdit && (
          <ContextMenuItem onClick={() => onEdit(lead)}>
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </ContextMenuItem>
        )}
        
        {onStatusChange && (
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <CheckCircle className="mr-2 h-4 w-4" />
              Changer le statut
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem onClick={() => onStatusChange(lead, 'nouveau')}>
                <Clock className="mr-2 h-4 w-4 text-blue-500" />
                Nouveau
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onStatusChange(lead, 'en_cours')}>
                <Clock className="mr-2 h-4 w-4 text-yellow-500" />
                En cours
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onStatusChange(lead, 'traite')}>
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                Traité
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onStatusChange(lead, 'abandonne')}>
                <Ban className="mr-2 h-4 w-4 text-red-500" />
                Abandonné
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}
        
        {onDelete && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem 
              onClick={() => onDelete(lead)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}
