import { usePermissions } from '@/hooks/usePermissions';
import { ReactNode } from 'react';

interface ProtectedComponentProps {
  children: ReactNode;
  permission?: keyof import('@/lib/services/PermissionService').UserPermissions;
  role?: 'admin' | 'manager' | 'commercial';
  fallback?: ReactNode;
  requireAll?: boolean; // Si true, nécessite toutes les permissions spécifiées
}

export function ProtectedComponent({ 
  children, 
  permission, 
  role, 
  fallback = <div>Accès non autorisé</div>,
  requireAll = false 
}: ProtectedComponentProps) {
  const { permissions, role: userRole, loading } = usePermissions();

  if (loading) {
    return <div>Chargement...</div>;
  }

  // Vérification du rôle
  if (role && userRole !== role) {
    return <>{fallback}</>;
  }

  // Vérification des permissions
  if (permission && permissions) {
    const hasPermission = permissions[permission];
    if (!hasPermission) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

// Hook pour vérifier une permission spécifique
export function usePermissionCheck(permission: keyof import('@/lib/services/PermissionService').UserPermissions) {
  const { permissions, loading } = usePermissions();

  return {
    hasPermission: permissions ? permissions[permission] : false,
    loading
  };
}

// Hook pour vérifier le rôle
export function useRoleCheck(requiredRole: 'admin' | 'manager' | 'commercial') {
  const { role, loading } = usePermissions();

  return {
    hasRole: role === requiredRole,
    loading
  };
}

// Composants de protection spécifiques pour faciliter l'utilisation
export function AdminOnly({ children, fallback }: ProtectedComponentProps) {
  return (
    <ProtectedComponent role="admin" fallback={fallback}>
      {children}
    </ProtectedComponent>
  );
}

export function ManagerOnly({ children, fallback }: ProtectedComponentProps) {
  return (
    <ProtectedComponent role="manager" fallback={fallback}>
      {children}
    </ProtectedComponent>
  );
}

export function CommercialOnly({ children, fallback }: ProtectedComponentProps) {
  return (
    <ProtectedComponent role="commercial" fallback={fallback}>
      {children}
    </ProtectedComponent>
  );
}

export function CanManageTeams({ children, fallback }: ProtectedComponentProps) {
  return (
    <ProtectedComponent permission="canManageTeams" fallback={fallback}>
      {children}
    </ProtectedComponent>
  );
}

export function CanAssignLeads({ children, fallback }: ProtectedComponentProps) {
  return (
    <ProtectedComponent permission="canAssignLeads" fallback={fallback}>
      {children}
    </ProtectedComponent>
  );
}

export function CanManageCampaigns({ children, fallback }: ProtectedComponentProps) {
  return (
    <ProtectedComponent permission="canManageCampaigns" fallback={fallback}>
      {children}
    </ProtectedComponent>
  );
}

export function CanImportFiles({ children, fallback }: ProtectedComponentProps) {
  return (
    <ProtectedComponent permission="canImportFiles" fallback={fallback}>
      {children}
    </ProtectedComponent>
  );
}
