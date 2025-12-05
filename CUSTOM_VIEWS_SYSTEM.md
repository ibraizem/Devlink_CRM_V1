# Système de Vues Personnalisées - Documentation

## Vue d'ensemble

Le système de vues personnalisées permet aux utilisateurs de créer, sauvegarder et partager des configurations personnalisées pour l'affichage et le filtrage des leads dans le CRM.

## Fonctionnalités principales

### 1. **Gestion des colonnes**
- ✅ Sélection des colonnes visibles
- ✅ Réorganisation par drag & drop
- ✅ Configuration de la largeur de chaque colonne
- ✅ Ordre personnalisé des colonnes

### 2. **Filtres avancés**
- ✅ Filtres multiples avec opérateurs variés
- ✅ Conditions combinées (ET/OU)
- ✅ Opérateurs disponibles :
  - Égal à
  - Contient
  - Commence par
  - Finit par
  - Supérieur à
  - Inférieur à
  - Est vide
  - N'est pas vide

### 3. **Tri complexe**
- ✅ Tri sur plusieurs colonnes
- ✅ Ordre croissant/décroissant
- ✅ Priorité de tri configurable

### 4. **Vues nommées**
- ✅ Création de vues personnalisées
- ✅ Sauvegarde avec nom et description
- ✅ Modification des vues existantes
- ✅ Duplication de vues
- ✅ Suppression de vues

### 5. **Partage de vues**
- ✅ Partage avec toute l'équipe
- ✅ Partage avec des utilisateurs spécifiques
- ✅ Visualisation des vues partagées

### 6. **Templates prédéfinis**
- ✅ **Par statut** :
  - Nouveaux leads
  - Leads en cours
  - Leads traités
  - Leads abandonnés

- ✅ **Par canal** :
  - Leads avec téléphone
  - Leads avec email

- ✅ **Personnalisés** :
  - Leads prioritaires (score élevé)

## Architecture

### Structure des fichiers

```
lib/
├── services/
│   └── viewService.ts          # Service pour gérer les vues
└── utils/
    └── viewFilters.ts          # Utilitaires pour filtres et tris

hooks/
└── useLeadViews.ts             # Hook React pour gérer les vues

components/leads/
├── ViewManager.tsx             # Menu de gestion des vues
├── CreateViewDialog.tsx        # Dialog de création de vue
├── EditViewDialog.tsx          # Dialog d'édition de vue
├── ShareViewDialog.tsx         # Dialog de partage de vue
├── AdvancedViewDialog.tsx      # Dialog avancé avec configuration complète
├── ViewConfigPanel.tsx         # Panel de configuration (colonnes/filtres/tri)
├── ColumnManager.tsx           # Gestion des colonnes
├── FilterBuilder.tsx           # Constructeur de filtres
├── SortBuilder.tsx             # Constructeur de tri
└── RawLeadsTableWithViews.tsx  # Table avec intégration des vues

types/
└── leads.ts                    # Types TypeScript pour les vues
```

### Base de données

```sql
-- Table lead_views
CREATE TABLE lead_views (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  user_id TEXT NOT NULL,
  is_template BOOLEAN,
  template_type TEXT,
  is_shared BOOLEAN,
  shared_with_team BOOLEAN,
  shared_with_users TEXT[],
  columns JSONB,
  filters JSONB,
  sorts JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

## Utilisation

### 1. Intégration dans une page

```typescript
import { RawLeadsTableWithViews } from '@/components/leads/RawLeadsTableWithViews';

function LeadsPage() {
  return (
    <RawLeadsTableWithViews
      data={leads}
      columns={columns}
      onExport={handleExport}
      onRefresh={handleRefresh}
    />
  );
}
```

### 2. Utilisation du hook useLeadViews

```typescript
import { useLeadViews } from '@/hooks/useLeadViews';

function MyComponent() {
  const {
    userViews,
    sharedViews,
    templateViews,
    currentView,
    createView,
    updateView,
    deleteView,
    applyView,
  } = useLeadViews(userId);

  // Créer une nouvelle vue
  const handleCreate = async () => {
    await createView({
      name: 'Ma vue',
      user_id: userId,
      columns: [...],
      filters: [...],
      sorts: [...],
    });
  };

  // Appliquer une vue
  const handleApply = (view) => {
    applyView(view);
  };
}
```

### 3. Création d'une vue depuis un template

```typescript
const { createFromTemplate, templateViews } = useLeadViews(userId);

// Créer une vue "Nouveaux leads" depuis le template
const template = templateViews.find(t => t.id === 'template-new-leads');
if (template) {
  await createFromTemplate(template, 'Mes nouveaux leads');
}
```

## Types TypeScript

### ViewFilter

```typescript
interface ViewFilter {
  field: string;
  operator: FilterOperator;
  value: string | number | boolean;
  condition?: 'and' | 'or';
}

type FilterOperator = 
  | 'equals'
  | 'contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'is_empty'
  | 'is_not_empty';
```

### ViewSort

```typescript
interface ViewSort {
  field: string;
  direction: 'asc' | 'desc';
}
```

### ColumnConfig

```typescript
interface ColumnConfig {
  key: string;
  visible: boolean;
  width?: number;
  order: number;
}
```

### LeadViewConfig

```typescript
interface LeadViewConfig {
  id?: string;
  name: string;
  description?: string;
  user_id: string;
  is_template?: boolean;
  template_type?: 'status' | 'agent' | 'channel' | 'custom';
  is_shared?: boolean;
  shared_with_team?: boolean;
  shared_with_users?: string[];
  columns: ColumnConfig[];
  filters: ViewFilter[];
  sorts: ViewSort[];
  created_at?: string;
  updated_at?: string;
}
```

## API du service

### viewService

```typescript
// Créer une vue
await viewService.createView(view);

// Mettre à jour une vue
await viewService.updateView(id, updates);

// Supprimer une vue
await viewService.deleteView(id);

// Récupérer une vue
const view = await viewService.getView(id);

// Récupérer les vues d'un utilisateur
const views = await viewService.getUserViews(userId);

// Récupérer les vues partagées
const shared = await viewService.getSharedViews(userId);

// Partager avec l'équipe
await viewService.shareViewWithTeam(viewId, true);

// Partager avec des utilisateurs
await viewService.shareViewWithUsers(viewId, [userId1, userId2]);

// Dupliquer une vue
await viewService.duplicateView(viewId, userId, 'Nouvelle copie');

// Créer depuis un template
await viewService.createViewFromTemplate(template, userId);

// Obtenir les templates par défaut
const templates = viewService.getDefaultTemplates();
```

## Installation de la base de données

Exécutez le script SQL pour créer la table :

```bash
psql -h your-db-host -U your-user -d your-database -f lead_views_table.sql
```

Ou via Supabase Dashboard :
1. Allez dans SQL Editor
2. Copiez le contenu de `lead_views_table.sql`
3. Exécutez le script

## Exemples d'utilisation

### Créer une vue avec filtres multiples

```typescript
await createView({
  name: 'Leads chauds',
  description: 'Leads avec score > 70 et téléphone renseigné',
  user_id: userId,
  columns: [
    { key: 'name', visible: true, order: 0, width: 200 },
    { key: 'score', visible: true, order: 1, width: 100 },
    { key: 'phone', visible: true, order: 2, width: 150 },
  ],
  filters: [
    { field: 'score', operator: 'greater_than', value: 70 },
    { field: 'phone', operator: 'is_not_empty', value: '', condition: 'and' },
  ],
  sorts: [
    { field: 'score', direction: 'desc' },
  ],
});
```

### Filtrer avec conditions OR

```typescript
const filters = [
  { field: 'statut', operator: 'equals', value: 'nouveau' },
  { field: 'statut', operator: 'equals', value: 'en_cours', condition: 'or' },
];
```

### Appliquer des filtres manuellement

```typescript
import { applyFilters, applySorts } from '@/lib/utils/viewFilters';

const filtered = applyFilters(data, view.filters);
const sorted = applySorts(filtered, view.sorts);
```

## Permissions

Les permissions sont gérées via Row Level Security (RLS) :

- ✅ Les utilisateurs peuvent créer leurs propres vues
- ✅ Les utilisateurs peuvent voir et modifier leurs vues
- ✅ Les utilisateurs peuvent voir les vues partagées avec eux
- ✅ Les utilisateurs peuvent voir tous les templates
- ✅ Seul le créateur peut supprimer une vue

## Bonnes pratiques

1. **Nommage des vues** : Utilisez des noms descriptifs et clairs
2. **Description** : Ajoutez une description pour expliquer l'usage de la vue
3. **Colonnes** : Ne pas afficher trop de colonnes (max 8-10 recommandé)
4. **Filtres** : Évitez les filtres trop complexes pour maintenir les performances
5. **Partage** : Ne partagez que les vues utiles à toute l'équipe

## Dépendances requises

```json
{
  "@dnd-kit/core": "^6.x",       // Pour le drag & drop (core)
  "@dnd-kit/sortable": "^8.x",   // Pour le drag & drop (sortable)
  "@dnd-kit/utilities": "^3.x",  // Pour le drag & drop (utilities)
  "@clerk/nextjs": "^5.x",       // Pour l'authentification
  "sonner": "^1.x"               // Pour les notifications
}
```

Toutes ces dépendances sont déjà présentes dans le projet.

## Installation

```bash
# Les dépendances sont déjà installées
# Créer la table en base de données
psql < lead_views_table.sql
```

## Prochaines améliorations possibles

- [ ] Export/Import de vues entre utilisateurs
- [ ] Vues favorites/épinglées
- [ ] Historique des modifications de vues
- [ ] Suggestions de vues basées sur l'utilisation
- [ ] Vues conditionnelles basées sur le rôle
- [ ] Analytics sur l'utilisation des vues
