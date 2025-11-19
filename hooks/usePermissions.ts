import { useState, useEffect } from 'react';
import { PermissionService, type UserPermissions } from '@/lib/services/PermissionService';
import type { UserRole } from '@/lib/types/user';

export function usePermissions() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        setLoading(true);
        const userRole = await PermissionService.getCurrentUserRole();
        setRole(userRole);
        
        if (userRole) {
          const userPermissions = PermissionService.getPermissionsByRole(userRole);
          setPermissions(userPermissions);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, []);

  const checkPermission = async (permission: keyof UserPermissions): Promise<boolean> => {
    if (!permissions) return false;
    return PermissionService.checkPermission(permission);
  };

  const canAccessTeam = async (teamId: string): Promise<boolean> => {
    return PermissionService.canAccessTeam(teamId);
  };

  const canAccessLead = async (leadId: string): Promise<boolean> => {
    return PermissionService.canAccessLead(leadId);
  };

  const getAssignableAgents = async (): Promise<string[]> => {
    return PermissionService.getAssignableAgents();
  };

  return {
    role,
    permissions,
    loading,
    checkPermission,
    canAccessTeam,
    canAccessLead,
    getAssignableAgents,
    isAdmin: role === 'admin',
    isManager: role === 'manager',
    isCommercial: role === 'commercial',
  };
}
