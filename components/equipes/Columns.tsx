'use client';

import * as React from 'react';
import { ColumnDef, Row } from '@tanstack/react-table';
import { Team, TeamMember } from '@/lib/types/teams';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash2, Edit, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';

interface ColumnActionsProps {
  onViewDetails: (team: Team) => void;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
}

// Fonction utilitaire pour obtenir les initiales
const getInitials = (prenom?: string | null, nom?: string | null): string => {
  return `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase();
};

// Fonction factory pour créer les colonnes avec les callbacks
export const createColumns = (actions: ColumnActionsProps): ColumnDef<Team>[] => [
  {
    accessorKey: 'name',
    header: 'Nom',
    cell: ({ row }: { row: Row<Team> }) => (
      <div className="font-medium">{row.getValue('name')}</div>
    ),
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }: { row: Row<Team> }) => (
      <div className="text-muted-foreground">
        {row.getValue('description') || 'Aucune description'}
      </div>
    ),
  },
  {
    accessorKey: 'leader',
    header: 'Responsable',
    cell: ({ row }: { row: Row<Team> }) => {
      const leader = row.original.leader;
      if (!leader) {
        return <span className="text-muted-foreground">Non défini</span>;
      }
      
      return (
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mr-2">
            <span className="text-xs font-medium">
              {getInitials(leader.prenom, leader.nom)}
            </span>
          </div>
          <div>
            <div className="font-medium">
              {leader.prenom} {leader.nom}
            </div>
            <div className="text-xs text-muted-foreground">{leader.email}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'members',
    header: 'Membres',
    cell: ({ row }: { row: Row<Team> }) => {
      const members = row.original.members || [];
      if (members.length === 0) {
        return <span className="text-muted-foreground">Aucun membre</span>;
      }

      return (
        <div className="flex -space-x-2">
          {members.slice(0, 3).map((member: TeamMember, index: number) => (
            <div
              key={member.user?.id || index}
              className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border-2 border-background"
              style={{ zIndex: 10 - index }}
              title={`${member.user?.prenom || ''} ${member.user?.nom || ''}`.trim()}
            >
              <span className="text-xs font-medium">
                {getInitials(member.user?.prenom, member.user?.nom)}
              </span>
            </div>
          ))}
          {members.length > 3 && (
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border-2 border-background text-xs">
              +{members.length - 3}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Créée le',
    cell: ({ row }: { row: Row<Team> }) => {
      const dateValue = row.getValue('created_at');
      if (!dateValue) return null;
      
      const date = new Date(dateValue as string);
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }: { row: Row<Team> }) => {
      const team = row.original;

      const handleDelete = async () => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette équipe ?')) {
          try {
            const { error } = await supabase
              .from('teams')
              .delete()
              .eq('id', team.id);

            if (error) throw error;

            toast({
              title: '🗑️ Équipe supprimée',
              description: `"${team.name}" a été supprimée définitivement.`,
            });

            actions.onDelete(team);
          } catch (error: any) {
            toast({
              title: '❌ Erreur lors de la suppression',
              description: error.message || 'Impossible de supprimer l\'équipe. Veuillez réessayer.',
              variant: 'destructive',
            });
          }
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
              <span className="sr-only">Ouvrir le menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => actions.onViewDetails(team)}>
              <Eye className="mr-2 h-4 w-4" />
              Voir les détails
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.onEdit(team)}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-600 focus:bg-red-50"
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
