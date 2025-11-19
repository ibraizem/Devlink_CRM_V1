'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { TeamDataTable } from '@/components/equipes/TeamDataTable';
import { TeamModal } from '@/components/equipes/TeamModal';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Team } from '@/lib/types/teams';
import { supabase } from '@/lib/supabase/client';

export default function EquipesPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const openCreateModal = () => {
    setSelectedTeam(null);
    setModalOpen(true);
  };

  const openEditModal = (team: Team) => {
    setSelectedTeam(team);
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedTeam(null);
    setModalOpen(false);
  };

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          leader:leader_id (id, nom, prenom, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Récupérer les membres séparément pour éviter la récursion
      const teamsWithMembers = await Promise.all(
        (data || []).map(async (team) => {
          const { data: members, error: membersError } = await supabase
            .from('team_members')
            .select(`
              user:user_id (id, nom, prenom, email)
            `)
            .eq('team_id', team.id);

          return {
            ...team,
            members: members || []
          };
        })
      );
      
      setTeams(teamsWithMembers);
      console.log('Teams loaded successfully:', teamsWithMembers.length);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError('Erreur lors du chargement des équipes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 p-8">
          <div>Chargement des équipes...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-blue-700 font-bold text-xl">
              Gérez les équipes et leurs membres
            </p>
          </div>
          <Button 
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Créer une équipe
          </Button>
        </div>
        
        <TeamDataTable 
          data={teams} 
          onRefresh={fetchTeams} 
        />
        
        {/* Modal de création/modification d'équipe */}
        <TeamModal
          isOpen={modalOpen}
          onClose={closeModal}
          team={selectedTeam}
          onSuccess={() => fetchTeams()}
        />
      </div>
    </div>
  );
}
