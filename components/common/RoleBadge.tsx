import { usePermissions } from '@/hooks/usePermissions';
import { Badge } from '@/components/ui/badge';

export function RoleBadge() {
  const { role, loading } = usePermissions();

  if (loading) {
    return <Badge variant="outline">Chargement...</Badge>;
  }

  if (!role) {
    return <Badge variant="outline">Non défini</Badge>;
  }

  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'manager':
        return 'default';
      case 'commercial':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrateur';
      case 'manager':
        return 'Manager';
      case 'commercial':
        return 'Commercial';
      default:
        return role;
    }
  };

  return (
    <Badge variant={getRoleVariant(role)}>
      {getRoleLabel(role)}
    </Badge>
  );
}

export function PermissionInfo() {
  const { permissions, role, loading } = usePermissions();

  if (loading || !permissions) {
    return <div>Chargement des permissions...</div>;
  }

  const permissionList = [
    { key: 'canViewAllUsers', label: 'Voir tous les utilisateurs' },
    { key: 'canManageTeams', label: 'Gérer les équipes' },
    { key: 'canViewAllLeads', label: 'Voir tous les leads' },
    { key: 'canAssignLeads', label: 'Assigner des leads' },
    { key: 'canManageCampaigns', label: 'Gérer les campagnes' },
    { key: 'canViewAllCampaigns', label: 'Voir toutes les campagnes' },
    { key: 'canImportFiles', label: 'Importer des fichiers' },
    { key: 'canManageFiles', label: 'Gérer les fichiers' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Rôle actuel: {role}</h3>
      </div>
      
      <div>
        <h4 className="text-md font-medium mb-2">Permissions:</h4>
        <div className="grid grid-cols-2 gap-2">
          {permissionList.map(({ key, label }) => (
            <div key={key} className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${permissions[key as keyof typeof permissions] ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
