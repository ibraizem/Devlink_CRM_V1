'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLeads } from '@/hooks/useLeads';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Phone, Mail, Calendar, User, Tag, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Lead } from '@/lib/types/leads';

interface LeadsDataTableProps {
  leads?: Lead[];
  onLeadClick?: (lead: Lead) => void;
}

export function LeadsDataTable({ leads: propLeads, onLeadClick }: LeadsDataTableProps = {}) {
  const { leads: hookLeads, loading } = useLeads();
  
  // Activer le temps réel
  useRealtimeSync();
  
  // Utiliser les leads passés en props ou ceux du hook
  const leads = propLeads || hookLeads;
  
  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'nouveau': 'default',
      'contacté': 'secondary', 
      'qualifié': 'default',
      'converti': 'default',
      'perdu': 'destructive',
      'en_attente': 'outline'
    };
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!leads || leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <User className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun lead</h3>
        <p className="text-gray-500">Commencez par importer un fichier pour créer des leads</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Téléphone</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Campagne</TableHead>
            <TableHead>Date création</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow 
              key={lead.id} 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => onLeadClick?.(lead)}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>{lead.nom} {lead.prenom}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{lead.email}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{lead.telephone}</span>
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(lead.statut)}
              </TableCell>
              <TableCell>
                {lead.campagne_nom ? (
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{lead.campagne_nom}</span>
                  </div>
                ) : (
                  <span className="text-gray-400 text-sm">-</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {format(new Date(lead.created_at), 'dd MMM yyyy', { locale: fr })}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Voir les détails</DropdownMenuItem>
                    <DropdownMenuItem>Modifier le statut</DropdownMenuItem>
                    <DropdownMenuItem>Ajouter une note</DropdownMenuItem>
                    <DropdownMenuItem>Assigner à un agent</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}