# Composants de Gestion des Leads

Ce dossier contient tous les composants nécessaires pour la gestion avancée des leads dans le CRM DevLink.

## 📁 Structure des Dossiers

```
components/leads/
├── advanced/           # Composants d'interaction avancés
│   └── index.ts       # Export centralisé
├── examples/          # Exemples d'utilisation
│   ├── BasicExample.tsx
│   ├── ContextMenuExample.tsx
│   ├── ExportExample.tsx
│   └── index.ts
├── CellContextMenu.tsx          # Menu contextuel (clic droit)
├── ColumnFilters.tsx            # Filtres par colonne avec autocomplete
├── EnhancedLeadsTable.tsx       # Tableau intégré avec toutes les fonctionnalités
├── ExportDialog.tsx             # Dialog d'export multi-format
├── FullscreenTable.tsx          # Mode plein écran avec raccourcis
├── GlobalSearch.tsx             # Recherche globale avec highlighting
├── LeadsTableDemo.tsx           # Composant de démonstration
├── BulkActionsBar.tsx           # Barre d'actions groupées
├── BulkActionProgress.tsx       # Indicateur de progression
├── BulkAssignModal.tsx          # Attribution à un utilisateur
├── BulkEmailModal.tsx           # Envoi d'emails groupés
├── BulkSmsModal.tsx             # Envoi de SMS groupés
├── SelectionHelpTooltip.tsx     # Aide contextuelle
├── ADVANCED_FEATURES.md         # Documentation détaillée
├── SELECTION_SYSTEM.md          # Documentation système sélection
└── README.md                    # Ce fichier
```

## 🚀 Démarrage Rapide

### Import Simple

```tsx
import { EnhancedLeadsTable } from '@/components/leads/EnhancedLeadsTable'

<EnhancedLeadsTable
  data={leads}
  columns={columns}
  onRefresh={refresh}
/>
```

### Import Groupé

```tsx
import {
  CellContextMenu,
  GlobalSearch,
  ColumnFilters,
  ExportDialog,
  FullscreenTable,
  EnhancedLeadsTable,
  LeadsTableDemo
} from '@/components/leads/advanced'
```

## 📦 Composants Disponibles

### 1. EnhancedLeadsTable (Recommandé)

Composant tout-en-un qui intègre toutes les fonctionnalités avancées.

**Props:**
- `data: Lead[]` - Données des leads
- `columns: ColumnDefinition<Lead>[]` - Définition des colonnes
- `onRefresh?: () => void` - Callback de rafraîchissement

**Fonctionnalités incluses:**
- ✅ Menu contextuel sur toutes les cellules
- ✅ Recherche globale (⌘K / Ctrl+K)
- ✅ Filtres par colonne avec autocomplete
- ✅ Export multi-format (CSV, Excel, JSON)
- ✅ Mode plein écran (Ctrl+F)
- ✅ Sélection multiple avancée
- ✅ Tri et pagination
- ✅ Actions CRUD complètes

### 2. RawLeadsTable (Avec Sélection Multiple)

Composant principal du tableau avec gestion complète de la sélection.

**Props:**
```typescript
interface RawLeadsTableProps<T extends Lead> {
  data: T[];                              // Données des leads
  columns: Array<ColumnDefinition<T>>;    // Définitions des colonnes
  onExport: (selectedIds: string[]) => void;  // Handler d'export
  onRefresh?: () => void;                 // Handler de rafraîchissement
}
```

**Fonctionnalités de sélection:**
- ✅ Sélection par checkbox
- ✅ Shift+Click pour sélection en plage
- ✅ Ctrl/Cmd+Click pour sélection multiple
- ✅ Sélection de toutes les lignes (toutes pages)
- ✅ Barre d'actions groupées flottante
- ✅ Indicateur du nombre de lignes sélectionnées
- ✅ Raccourcis clavier (Ctrl+A, Escape)
- ✅ Animations fluides
- ✅ Progress tracking pour actions longues

### 3. LeadsTableDemo

Composant de démonstration avec documentation visuelle intégrée.

**Props:**
- `data: Lead[]` - Données des leads
- `onRefresh?: () => void` - Callback de rafraîchissement

**Inclut:**
- Alert avec description des fonctionnalités
- Badges pour chaque raccourci clavier
- Wrapper Card avec titre et description

### 4. CellContextMenu

Menu contextuel activé par clic droit sur les cellules.

**Props:**
- `children: React.ReactNode` - Contenu à wrapper
- `lead: Lead` - Données du lead
- `cellKey?: string` - Clé de la cellule
- `cellValue?: any` - Valeur de la cellule
- `onCall, onEmail, onMessage, onNote, onEdit, onDelete` - Callbacks d'actions
- `onStatusChange?: (lead, status) => void` - Changement de statut
- `onCopyCell, onCopyRow, onFilterByValue` - Actions contextuelles

### 5. GlobalSearch

Recherche globale avec highlighting des résultats.

**Props:**
- `data: Lead[]` - Données à rechercher
- `onSelectLead?: (lead) => void` - Callback de sélection
- `trigger?: React.ReactNode` - Élément déclencheur personnalisé

**Raccourci:** ⌘K (Mac) ou Ctrl+K (Windows/Linux)

### 6. ColumnFilters

Système de filtres par colonne avec autocomplete.

**Props:**
- `data: Lead[]` - Données à filtrer
- `columns: ColumnDefinition<Lead>[]` - Colonnes disponibles
- `filters: Record<string, string[]>` - Filtres actifs
- `onFiltersChange: (filters) => void` - Callback de changement

### 7. ExportDialog

Dialog d'export avec options personnalisables.

**Props:**
- `data: Lead[]` - Données à exporter
- `selectedIds: string[]` - IDs sélectionnés
- `columns: ColumnDefinition<Lead>[]` - Colonnes disponibles
- `trigger?: React.ReactNode` - Élément déclencheur

**Formats:**
- CSV (compatible Excel)
- Excel (.xlsx) avec formatage
- JSON (pour intégrations)

### 8. FullscreenTable

Mode plein écran avec raccourcis clavier.

**Props:**
- `children: React.ReactNode` - Contenu du tableau
- `trigger?: React.ReactNode` - Élément déclencheur
- `shortcuts?: boolean` - Activer les raccourcis (défaut: true)

**Raccourcis:**
- `Ctrl+F` : Activer/désactiver plein écran
- `Échap` : Quitter le plein écran
- `Shift+?` : Afficher les raccourcis

### 9. Composants de Sélection Multiple

#### BulkActionsBar
Barre d'actions groupées flottante (bottom) avec :
- Compteur de sélections
- 6 actions : Assigner, Statut, Email, SMS, Export, Supprimer
- Animation Framer Motion

#### BulkActionProgress
Indicateur de progression en haut de l'écran avec :
- Barre de progression
- Compteur : X / Total
- États : processing, success, error

#### BulkAssignModal
Modal d'attribution à un utilisateur avec :
- Liste déroulante des utilisateurs
- Résumé avant exécution
- Progress tracking

#### BulkEmailModal
Modal d'envoi d'emails groupés avec :
- Champs : Objet, Message
- Support des variables : {nom}, {prenom}, {email}

#### BulkSmsModal
Modal d'envoi de SMS groupés avec :
- Limite de 160 caractères avec compteur
- Support des variables : {nom}, {prenom}

#### SelectionHelpTooltip
Tooltip d'aide contextuelle affichant les raccourcis disponibles.

## 🎯 Exemples d'Utilisation

### Exemple Basique

```tsx
import { EnhancedLeadsTable } from '@/components/leads/EnhancedLeadsTable'
import { ColumnDefinition, Lead } from '@/types/leads'

const columns: ColumnDefinition<Lead>[] = [
  { key: 'nom', label: 'Nom' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Téléphone' },
]

function MyLeadsPage() {
  return (
    <EnhancedLeadsTable
      data={leads}
      columns={columns}
      onRefresh={() => fetchLeads()}
    />
  )
}
```

### Exemple Avec Sélection Multiple

```tsx
import { RawLeadsTable } from '@/components/leads/RawLeadsTable';
import { useCrmData2 } from '@/hooks/useCrmData2';

function LeadsPage() {
  const { data, columns, refresh } = useCrmData2(selectedFileIds);

  const handleExport = (selectedIds: string[]) => {
    // Logique d'export
  };

  return (
    <RawLeadsTable
      data={data}
      columns={columns}
      onExport={handleExport}
      onRefresh={refresh}
    />
  );
}
```

### Exemple Avec Composants Séparés

```tsx
import { useState } from 'react'
import { 
  GlobalSearch, 
  ColumnFilters, 
  ExportDialog 
} from '@/components/leads/advanced'

function MyCustomTable() {
  const [filters, setFilters] = useState({})
  const [selected, setSelected] = useState<string[]>([])

  return (
    <div>
      <div className="flex gap-2">
        <GlobalSearch data={leads} onSelectLead={handleSelect} />
        <ColumnFilters 
          data={leads}
          columns={columns}
          filters={filters}
          onFiltersChange={setFilters}
        />
        <ExportDialog
          data={leads}
          selectedIds={selected}
          columns={columns}
        />
      </div>
      {/* Votre tableau personnalisé */}
    </div>
  )
}
```

### Exemple Avec Menu Contextuel

```tsx
import { CellContextMenu } from '@/components/leads/CellContextMenu'

function MyTableCell({ lead, value }) {
  return (
    <CellContextMenu
      lead={lead}
      cellKey="email"
      cellValue={value}
      onCall={handleCall}
      onEmail={handleEmail}
      onCopyCell={handleCopy}
    >
      <div>{value}</div>
    </CellContextMenu>
  )
}
```

## 🎨 Personnalisation

### Thème

Tous les composants utilisent les tokens de couleur Tailwind et s'adaptent automatiquement au mode sombre.

Les couleurs de sélection utilisent :
- `bg-primary` : Barre d'actions
- `bg-blue-50` : Lignes sélectionnées
- `border-blue-500` : Bordure de sélection

### Styling

Vous pouvez personnaliser l'apparence avec des classes Tailwind :

```tsx
<EnhancedLeadsTable
  data={leads}
  columns={columns}
  className="custom-table"
/>
```

### Callbacks

Tous les callbacks sont optionnels et peuvent être personnalisés :

```tsx
<CellContextMenu
  lead={lead}
  onCall={(lead) => {
    // Logique personnalisée d'appel
    console.log('Calling', lead.phone)
  }}
  onEmail={(lead) => {
    // Logique personnalisée d'email
    window.open(`mailto:${lead.email}`)
  }}
>
  {children}
</CellContextMenu>
```

### Colonnes Visibles

Minimum 3 colonnes obligatoires (configurable dans `RawLeadsTable.tsx`) :
```typescript
const essentialColumns = ['name', 'firstname', 'phone', 'email', 'company'];
```

### Pagination

Taille de page par défaut : 25 lignes (configurable dans `useLeadsTable.ts`) :
```typescript
const [pageSize, setPageSize] = useState(25);
```

## 🔧 Hook Personnalisé

Pour une gestion d'état avancée :

```tsx
import { useAdvancedTableInteractions } from '@/hooks/useAdvancedTableInteractions'

const {
  filteredData,
  filters,
  selected,
  sortKey,
  sortDir,
  toggleSort,
  toggleSelect,
  selectAll,
  clearSelection,
  updateColumnFilter,
  clearAllFilters,
  updateSearch
} = useAdvancedTableInteractions(leads)
```

## 🚀 Fonctionnalités de Sélection

### Modes de Sélection
- **Click simple** : Sélectionner/désélectionner une ligne
- **Ctrl/Cmd+Click** : Ajouter des lignes à la sélection
- **Shift+Click** : Sélectionner une plage de lignes
- **Checkbox en-tête** : Sélectionner toute la page
- **Bouton "Tout sélectionner"** : Sélectionner toutes les lignes (toutes pages)

### Raccourcis Clavier
- `Ctrl+A` / `Cmd+A` : Tout sélectionner
- `Escape` : Désélectionner tout
- Les raccourcis sont désactivés dans les champs de saisie

### Indicateurs Visuels
- Lignes sélectionnées : Fond bleu clair + bordure gauche bleue
- Checkbox d'en-tête : État indéterminé si sélection partielle
- Badge de comptage dans la barre de recherche
- Barre d'actions avec compteur

### Actions Groupées

#### 1. Assigner
- Attribuer les leads à un utilisateur
- Liste déroulante des utilisateurs
- Résumé avant exécution

#### 2. Changer le Statut
- 4 statuts disponibles : Nouveau, En cours, Traité, Abandonné
- Menu déroulant avec indicateurs de couleur
- Mise à jour en masse avec progress tracking

#### 3. Envoyer Email
- Composer un email pour tous les leads sélectionnés
- Champs : Objet, Message
- Support des variables : {nom}, {prenom}, {email}

#### 4. Envoyer SMS
- Composer un SMS pour tous les leads sélectionnés
- Limite de 160 caractères avec compteur
- Support des variables : {nom}, {prenom}

#### 5. Exporter
- Export CSV des leads sélectionnés
- Inclut toutes les colonnes visibles

#### 6. Supprimer
- Suppression en masse avec confirmation
- Progress tracking
- Compte rendu : succès/échecs

## 📚 Documentation Complète

### Documentation Principale
- **[ADVANCED_FEATURES.md](./ADVANCED_FEATURES.md)** : Documentation détaillée des fonctionnalités avancées
- **[SELECTION_SYSTEM.md](./SELECTION_SYSTEM.md)** : Documentation complète du système de sélection
- **[EXTENDING_SELECTION.md](./EXTENDING_SELECTION.md)** : Guide pour étendre le système de sélection

### Guide des Raccourcis Clavier
- `⌘K / Ctrl+K` : Recherche globale
- `Ctrl+F` : Mode plein écran
- `Ctrl+A / Cmd+A` : Tout sélectionner
- `Escape` : Désélectionner tout / Quitter plein écran
- `Shift+?` : Afficher les raccourcis (en mode plein écran)

### Bonnes Pratiques
- Utiliser `EnhancedLeadsTable` pour une intégration rapide
- Utiliser les composants séparés pour plus de contrôle
- Toujours fournir des callbacks pour les actions
- Gérer les états de chargement et d'erreur
- Valider les données avant export

### Considérations de Performance
- Limiter le nombre de lignes affichées avec pagination
- Utiliser la virtualisation pour de très grandes listes
- Mémoriser les résultats de recherche/filtrage coûteux
- Débouncer les opérations de recherche

### Accessibilité
- Tous les contrôles ont des labels ARIA appropriés
- Navigation complète au clavier
- Support des lecteurs d'écran
- Indicateurs visuels clairs
- Gestion appropriée du focus

### Sécurité
- Validation des données avant export
- Échappement correct des caractères spéciaux
- Sanitization des valeurs JSON
- Confirmation pour actions destructives

## 🧪 Exemples Interactifs

Les composants d'exemple sont disponibles dans le dossier `examples/` :

```tsx
import { BasicExample, ContextMenuExample, ExportExample } from '@/components/leads/examples'

// Utilisez-les dans vos pages de test ou documentation
<BasicExample />
<ContextMenuExample />
<ExportExample />
```

## 🐛 Dépannage

### Le menu contextuel ne s'affiche pas
- Vérifiez que `@radix-ui/react-context-menu` est installé
- Assurez-vous que le composant parent n'empêche pas le clic droit

### La recherche globale ne s'ouvre pas avec ⌘K
- Vérifiez qu'aucun autre composant n'intercepte ce raccourci
- Le composant doit être monté pour écouter les événements

### L'export Excel ne fonctionne pas
- Vérifiez que la bibliothèque `xlsx` est installée
- Assurez-vous que les données ne contiennent pas de valeurs circulaires

### Le mode plein écran ne se ferme pas
- Appuyez sur `Échap`
- Vérifiez la console pour d'éventuelles erreurs JavaScript

### Sélection ne fonctionne pas
- Vérifier que les leads ont un `id` unique
- Vérifier que le hook `useLeadsTable` est bien initialisé

### Shift-Click ne fonctionne pas
- S'assurer que l'index est bien passé à `LeadsTableRow`
- Vérifier que `lastSelectedIndex` est bien trackée

### Actions groupées n'apparaissent pas
- Vérifier que `BulkActionsBar` reçoit bien `selectedCount > 0`
- Vérifier l'ordre z-index (should be z-50)

## 🔐 Permissions

Certaines actions peuvent nécessiter des permissions spécifiques :
- Suppression : Peut être réservée aux admins
- Attribution : Peut nécessiter un rôle manager
- Export : Peut être limité par quotas

Ces permissions doivent être implémentées dans les handlers.

## ⚡ Performance

### Optimisations Actuelles
- Set pour les sélections (O(1) lookup)
- Mémoization avec useMemo/useCallback
- Pagination pour limiter le DOM
- Debouncing sur la recherche
- AnimatePresence pour smooth unmount

### Pour Grandes Listes (>1000 lignes)
Considérez l'utilisation de TanStack Virtual (voir EXTENDING_SELECTION.md)

## 🤝 Contribution

Pour ajouter de nouvelles fonctionnalités :

1. Créez un nouveau composant dans ce dossier
2. Ajoutez-le à `advanced/index.ts` pour l'export
3. Créez un exemple dans `examples/`
4. Documentez dans `ADVANCED_FEATURES.md` ou `SELECTION_SYSTEM.md`
5. Mettez à jour ce README

## 📄 Licence

Voir le fichier LICENSE à la racine du projet.
