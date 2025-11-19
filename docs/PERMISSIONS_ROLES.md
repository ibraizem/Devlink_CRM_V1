# Implémentation des Permissions par Rôle

Ce document décrit l'implémentation du système de permissions basé sur les rôles dans le CRM DevLink.

## Rôles Définis

### 1. Admin (`admin`)
- **Permissions**: Accès complet à toutes les ressources
- **Peut**: Gérer les utilisateurs, équipes, campagnes, leads, fichiers
- **Accès**: Tous les données sans restriction

### 2. Manager (`manager`)
- **Permissions**: Gestion d'équipes et campagnes
- **Peut**: 
  - Gérer ses équipes (créer, modifier, supprimer)
  - Gérer les campagnes de ses équipes
  - Voir et assigner les leads des campagnes de ses équipes
  - Importer et gérer les fichiers
- **Accès**: Limité aux ressources de ses équipes

### 3. Commercial (`commercial`)
- **Permissions**: Agent commercial avec accès limité
- **Peut**:
  - Voir ses leads assignés
  - Modifier le statut de ses leads
  - Ajouter des notes à ses leads
  - Voir les campagnes où il a des leads
- **Accès**: Uniquement à ses propres ressources

## Fichiers Implémentés

### 1. Migration SQL
- `03_update_rls_policies_with_roles.sql`: Politiques RLS avec permissions par rôle
- `04_update_existing_roles.sql`: Mise à jour des rôles existants

### 2. Services
- `PermissionService.ts`: Service central de gestion des permissions
- `campaignService.ts`: Mis à jour avec vérifications de permissions
- `teamService.ts`: Mis à jour avec vérifications de permissions  
- `leadService.ts`: Mis à jour avec vérifications de permissions

### 3. Hooks
- `usePermissions.ts`: Hook pour utiliser les permissions dans les composants

### 4. Composants
- `RoleBadge.tsx`: Affichage du rôle de l'utilisateur
- `ProtectedComponent.tsx`: Composants de protection des routes
- `LeadAssignment.tsx`: Composant d'assignation de leads avec permissions

## Utilisation

### Dans les composants React

```tsx
import { ProtectedComponent, AdminOnly, CanManageTeams } from '@/components/common/ProtectedComponent';
import { usePermissions } from '@/hooks/usePermissions';

function MonComposant() {
  const { isAdmin, canManageTeams } = usePermissions();
  
  return (
    <div>
      {/* Protection par rôle */}
      <AdminOnly>
        <ButtonActionsAdmin />
      </AdminOnly>
      
      {/* Protection par permission */}
      <CanManageTeams fallback={<div>Accès refusé</div>}>
        <TeamManagement />
      </CanManageTeams>
      
      {/* Protection conditionnelle */}
      {canManageTeams && <CreateTeamButton />}
    </div>
  );
}
```

### Dans les services

```tsx
import { PermissionService } from '@/lib/services/PermissionService';

// Vérification directe
const canManage = await PermissionService.checkPermission('canManageTeams');
if (!canManage) {
  throw new Error('Permissions insuffisantes');
}

// Vérification d'accès à une ressource spécifique
const canAccessTeam = await PermissionService.canAccessTeam(teamId);
const canAccessLead = await PermissionService.canAccessLead(leadId);
```

## Migration des Données Existantes

1. **Exécuter les migrations SQL dans l'ordre**:
   ```sql
   -- 1. Appliquer les nouvelles politiques RLS
   \i lib/supabase/migrations/03_update_rls_policies_with_roles.sql
   
   -- 2. Mettre à jour les rôles existants
   \i lib/supabase/migrations/04_update_existing_roles.sql
   ```

2. **Vérifier la migration**:
   ```sql
   SELECT role, COUNT(*) FROM users_profile GROUP BY role;
   ```

## Politiques RLS (Row Level Security)

Les politiques RLS sont appliquées sur les tables suivantes:

- `users_profile`: Admin voit tout, autres voient leur profil
- `teams`: Admin voit tout, manager voit ses équipes, commercial voit les équipes où il est membre
- `team_members`: Permissions basées sur l'appartenance aux équipes
- `leads`: Admin voit tout, manager voit les leads de ses équipes, commercial voit ses leads
- `campaigns`: Admin voit tout, manager voit les campagnes de ses équipes, commercial voit les campagnes où il a des leads
- `lead_actions`: Permissions similaires aux leads
- `fichiers_import`: Admin voit tout, autres voient leurs fichiers

## Bonnes Pratiques

1. **Toujours vérifier les permissions** côté client et serveur
2. **Utiliser les composants de protection** pour l'UI
3. **Gérer les erreurs de permission** de manière élégante
4. **Documenter les permissions** requises pour chaque fonctionnalité
5. **Tester avec différents rôles** pour s'assurer de l'isolation des données

## Dépannage

### Problèmes Communs

1. **"Accès non autorisé" inattendu**
   - Vérifier que l'utilisateur a le bon rôle dans `users_profile`
   - Vérifier que les politiques RLS sont bien appliquées

2. **Performance lente**
   - Les indexes sur `role` et `leader_id` sont créés automatiquement
   - Vérifier les requêtes complexes avec les jointures

3. **Permissions non mises à jour**
   - Recharger la page ou réinitialiser le hook `usePermissions`
   - Vérifier le cache de Supabase

### Debug

```tsx
// Pour débugger les permissions
const { permissions, role } = usePermissions();
console.log('Rôle:', role);
console.log('Permissions:', permissions);
```
