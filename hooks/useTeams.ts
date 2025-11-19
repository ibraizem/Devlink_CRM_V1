import { useState, useCallback } from 'react';
import { Team, CreateTeamFormData, UpdateTeamFormData } from '@/lib/types/teams';
import { teamService } from '@/lib/services/teamService';

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Récupérer toutes les équipes
  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await teamService.getAllTeams();
      setTeams(data);
      return data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Créer une équipe
  const createTeam = useCallback(async (teamData: CreateTeamFormData) => {
    setLoading(true);
    setError(null);
    try {
      const newTeam = await teamService.createTeam(teamData);
      setTeams(prev => [newTeam, ...prev]);
      return newTeam;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mettre à jour une équipe
  const updateTeam = useCallback(async (teamData: UpdateTeamFormData) => {
    setLoading(true);
    setError(null);
    try {
      const updatedTeam = await teamService.updateTeam(teamData);
      setTeams(prev => 
        prev.map(team => 
          team.id === teamData.id ? { ...team, ...updatedTeam } : team
        )
      );
      return updatedTeam;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Supprimer une équipe
  const deleteTeam = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await teamService.deleteTeam(id);
      setTeams(prev => prev.filter(team => team.id !== id));
      return true;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Gestion des membres de l'équipe
  const addTeamMember = useCallback(async (teamId: string, userId: string, role = 'member') => {
    try {
      await teamService.addTeamMember(teamId, userId, role);
      // Recharger les données de l'équipe
      const updatedTeam = await teamService.getTeamById(teamId);
      setTeams(prev => 
        prev.map(team => team.id === teamId ? updatedTeam : team)
      );
      return updatedTeam;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const removeTeamMember = useCallback(async (teamId: string, userId: string) => {
    try {
      await teamService.removeTeamMember(teamId, userId);
      // Recharger les données de l'équipe
      const updatedTeam = await teamService.getTeamById(teamId);
      setTeams(prev => 
        prev.map(team => team.id === teamId ? updatedTeam : team)
      );
      return updatedTeam;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const updateTeamMemberRole = useCallback(async (teamId: string, userId: string, role: string) => {
    try {
      await teamService.updateTeamMemberRole(teamId, userId, role);
      // Recharger les données de l'équipe
      const updatedTeam = await teamService.getTeamById(teamId);
      setTeams(prev => 
        prev.map(team => team.id === teamId ? updatedTeam : team)
      );
      return updatedTeam;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  return {
    teams,
    loading,
    error,
    fetchTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    addTeamMember,
    removeTeamMember,
    updateTeamMemberRole,
  };
}
