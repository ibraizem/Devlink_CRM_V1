'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings, Edit, Trash2, UserPlus, List } from 'lucide-react';
import Link from 'next/link';

export function TeamActions({ teamId }: { teamId: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette équipe ? Cette action est irréversible.')) {
      return;
    }

    try {
      // Supprimer d'abord les membres de l'équipe
      const { error: deleteMembersError } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId);

      if (deleteMembersError) throw deleteMembersError;

      // Ensuite supprimer l'équipe
      const { error: deleteTeamError } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (deleteTeamError) throw deleteTeamError;

      toast.success('🗑️ Équipe supprimée', {
        description: 'L\'équipe a été supprimée avec tous ses membres.',
      });
      router.push('/equipes');
      router.refresh();
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'équipe:', error);
      toast.error('❌ Erreur lors de la suppression', {
        description: 'Impossible de supprimer l\'équipe. Veuillez réessayer.',
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/equipes/${teamId}/modifier`} className="flex items-center w-full">
            <Edit className="mr-2 h-4 w-4" />
            Modifier l'équipe
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/equipes/${teamId}/membres/ajouter`} className="flex items-center w-full">
            <UserPlus className="mr-2 h-4 w-4" />
            Ajouter des membres
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/equipes/${teamId}/membres`} className="flex items-center w-full">
            <List className="mr-2 h-4 w-4" />
            Gérer les membres
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="text-red-600 focus:bg-red-50"
          onClick={handleDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer l'équipe
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
