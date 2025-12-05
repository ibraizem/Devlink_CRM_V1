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
├── ADVANCED_FEATURES.md         # Documentation détaillée
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
- ✅ Sélection multiple
- ✅ Tri et pagination
- ✅ Actions CRUD complètes

### 2. LeadsTableDemo

Composant de démonstration avec documentation visuelle intégrée.

**Props:**
- `data: Lead[]` - Données des leads
- `onRefresh?: () => void` - Callback de rafraîchissement

**Inclut:**
- Alert avec description des fonctionnalités
- Badges pour chaque raccourci clavier
- Wrapper Card avec titre et description

### 3. CellContextMenu

Menu contextuel activé par clic droit sur les cellules.

**Props:**
- `children: React.ReactNode` - Contenu à wrapper
- `lead: Lead` - Données du lead
- `cellKey?: string` - Clé de la cellule
- `cellValue?: any` - Valeur de la cellule
- `onCall, onEmail, onMessage, onNote, onEdit, onDelete` - Callbacks d'actions
- `onStatusChange?: (lead, status) => void` - Changement de statut
- `onCopyCell, onCopyRow, onFilterByValue` - Actions contextuelles

### 4. GlobalSearch

Recherche globale avec highlighting des résultats.

**Props:**
- `data: Lead[]` - Données à rechercher
- `onSelectLead?: (lead) => void` - Callback de sélection
- `trigger?: React.ReactNode` - Élément déclencheur personnalisé

**Raccourci:** ⌘K (Mac) ou Ctrl+K (Windows/Linux)

### 5. ColumnFilters

Système de filtres par colonne avec autocomplete.

**Props:**
- `data: Lead[]` - Données à filtrer
- `columns: ColumnDefinition<Lead>[]` - Colonnes disponibles
- `filters: Record<string, string[]>` - Filtres actifs
- `onFiltersChange: (filters) => void` - Callback de changement

### 6. ExportDialog

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

### 7. FullscreenTable

Mode plein écran avec raccourcis clavier.

**Props:**
- `children: React.ReactNode` - Contenu du tableau
- `trigger?: React.ReactNode` - Élément déclencheur
- `shortcuts?: boolean` - Activer les raccourcis (défaut: true)

**Raccourcis:**
- `Ctrl+F` : Activer/désactiver plein écran
- `Échap` : Quitter le plein écran
- `Shift+?` : Afficher les raccourcis

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

## 📚 Documentation Complète

Voir [ADVANCED_FEATURES.md](./ADVANCED_FEATURES.md) pour :
- Documentation détaillée de chaque composant
- Guide des raccourcis clavier
- Bonnes pratiques
- Considérations de performance
- Accessibilité
- Sécurité

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

## 🤝 Contribution

Pour ajouter de nouvelles fonctionnalités :

1. Créez un nouveau composant dans ce dossier
2. Ajoutez-le à `advanced/index.ts` pour l'export
3. Créez un exemple dans `examples/`
4. Documentez dans `ADVANCED_FEATURES.md`
5. Mettez à jour ce README

## 📄 Licence

Voir le fichier LICENSE à la racine du projet.
