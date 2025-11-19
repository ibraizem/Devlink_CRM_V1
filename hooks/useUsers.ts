import { useState, useCallback } from 'react';
import { userService } from '@/lib/services/userService';

type User = {
  id: string;
  email: string;
  nom: string | null;
  prenom: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type UserListResponse = {
  data: User[];
  count: number | null;
};

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Récupérer les utilisateurs avec pagination
  const fetchUsers = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    setError(null);
    try {
      const { data, count } = await userService.getUsers(page, pageSize);
      setUsers(data || []);
      setTotalCount(count || 0);
      return { data, count };
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Rechercher des utilisateurs
  const searchUsers = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const results = await userService.searchUsers(query);
      return results;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mettre à jour un utilisateur
  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    setLoading(true);
    setError(null);
    try {
      const updatedUser = await userService.updateUser(id, updates);
      setUsers(prev => 
        prev.map(user => 
          user.id === id ? { ...user, ...updatedUser } : user
        )
      );
      return updatedUser;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Désactiver un utilisateur
  const deactivateUser = useCallback(async (id: string) => {
    return updateUser(id, { is_active: false });
  }, [updateUser]);

  // Activer un utilisateur
  const activateUser = useCallback(async (id: string) => {
    return updateUser(id, { is_active: true });
  }, [updateUser]);

  // Récupérer les équipes d'un utilisateur
  const getUserTeams = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const teams = await userService.getUserTeams(userId);
      return teams;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    users,
    loading,
    error,
    totalCount,
    fetchUsers,
    searchUsers,
    updateUser,
    deactivateUser,
    activateUser,
    getUserTeams,
  };
}
