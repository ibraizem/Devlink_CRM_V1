# Système de Grille Virtuelle Haute-Performance

Ce système fournit une grille virtuelle optimisée pour afficher des milliers de lignes avec des performances élevées, des colonnes redimensionnables et réorganisables, et une édition inline avec validation en temps réel.

## Composants de Base

### VirtualGrid

Composant principal de grille virtuelle utilisant `@tanstack/react-virtual`.

```tsx
import { VirtualGrid } from '@/components/virtual'

<VirtualGrid
  data={data}
  columns={columns}
  rowHeight={52}
  headerHeight={48}
  overscan={10}
  selectable
  selectedRows={selectedRows}
  onSelectionChange={handleSelectionChange}
  onCellUpdate={handleCellUpdate}
  onColumnsChange={handleColumnsChange}
  sortBy={sortBy}
  onSortChange={handleSortChange}
  enableColumnReordering
  enableColumnResizing
  enableColumnManagement
/>
```

**Props:**
- `data`: Tableau de données à afficher
- `columns`: Configuration des colonnes
- `rowHeight`: Hauteur de chaque ligne (défaut: 52px)
- `headerHeight`: Hauteur de l'en-tête (défaut: 40px)
- `overscan`: Nombre de lignes à pré-rendre (défaut: 5)
- `selectable`: Activer la sélection de lignes
- `selectedRows`: Set des IDs de lignes sélectionnées
- `onSelectionChange`: Callback lors du changement de sélection
- `onCellUpdate`: Callback lors de la mise à jour d'une cellule
- `onColumnsChange`: Callback lors du changement de configuration des colonnes
- `sortBy`: Configuration du tri actuel
- `onSortChange`: Callback lors du changement de tri
- `enableColumnReordering`: Activer la réorganisation des colonnes (drag-and-drop)
- `enableColumnResizing`: Activer le redimensionnement des colonnes
- `enableColumnManagement`: Afficher le gestionnaire de colonnes

### EditableCell

Cellule éditable avec validation en temps réel.

```tsx
<EditableCell
  value={value}
  onChange={handleChange}
  validationSchema={z.string().email()}
  format={(v) => v}
  parse={(v) => v}
  type="email"
  placeholder="email@example.com"
/>
```

**Props:**
- `value`: Valeur actuelle
- `onChange`: Callback lors de la modification (peut être async)
- `validationSchema`: Schéma Zod pour la validation
- `format`: Fonction pour formater l'affichage
- `parse`: Fonction pour parser la valeur entrée
- `type`: Type d'input HTML
- `placeholder`: Texte de placeholder
- `disabled`: Désactiver l'édition

### ResizableColumn

Colonne redimensionnable avec poignée de redimensionnement.

```tsx
<ResizableColumn
  width={150}
  minWidth={80}
  maxWidth={600}
  onResize={handleResize}
  resizable
>
  {children}
</ResizableColumn>
```

### ColumnManager

Gestionnaire de colonnes avec drag-and-drop, visibilité et redimensionnement.

```tsx
<ColumnManager
  columns={columnConfigs}
  onColumnsChange={handleColumnsChange}
  onReset={handleReset}
  trigger={<Button>Gérer les colonnes</Button>}
/>
```

### VirtualGridToolbar

Barre d'outils avec recherche, filtres et actions.

```tsx
<VirtualGridToolbar
  searchValue={searchValue}
  onSearchChange={setSearchValue}
  selectedCount={selectedRows.size}
  totalCount={data.length}
  onExport={handleExport}
  onDelete={handleDelete}
  onRefresh={handleRefresh}
  onClearSelection={clearSelection}
  filters={filterOptions}
  actions={customActions}
/>
```

### VirtualGridStats

Affichage de statistiques sous forme de cartes.

```tsx
<VirtualGridStats
  stats={[
    {
      label: 'Total',
      value: 1000,
      icon: <Users className="h-4 w-4" />,
      color: 'bg-blue-100 text-blue-600',
    },
  ]}
/>
```

## Hooks Utilitaires

### useVirtualGridState

Gère l'état de la grille (colonnes, sélection, tri).

```tsx
const {
  columns,
  sortedData,
  selectedRows,
  sortBy,
  handleCellUpdate,
  handleColumnsChange,
  handleSelectionChange,
  handleSortChange,
  clearSelection,
  selectAll,
  getSelectedData,
} = useVirtualGridState({
  initialColumns,
  data,
  getRowId: (row) => row.id,
  onDataChange,
})
```

### useVirtualGridColumns

Crée des colonnes typées avec formatage et validation automatiques.

```tsx
const columns = useVirtualGridColumns([
  createColumn({
    id: 'email',
    label: 'Email',
    accessor: 'email',
    type: 'email',
    editable: true,
    sortable: true,
    width: 250,
  }),
  createColumn({
    id: 'phone',
    label: 'Téléphone',
    accessor: 'telephone',
    type: 'tel',
    editable: true,
    width: 180,
  }),
])
```

**Types supportés:**
- `text`: Texte simple
- `number`: Nombre avec formatage français
- `email`: Email avec validation
- `tel`: Téléphone avec formatage français
- `url`: URL avec validation
- `date`: Date avec formatage français
- `boolean`: Booléen (Oui/Non)
- `currency`: Montant en euros

### useVirtualGridFilters

Gère la recherche et les filtres.

```tsx
const {
  searchValue,
  setSearchValue,
  filters,
  filteredData,
  addFilter,
  removeFilter,
  toggleFilter,
  clearFilters,
  clearSearch,
  clearAll,
  activeFilterCount,
  hasActiveFilters,
} = useVirtualGridFilters({
  data,
  columns,
  searchableColumns: ['nom', 'prenom', 'email'],
})
```

**Opérateurs de filtre:**
- `equals`: Égal à
- `contains`: Contient
- `startsWith`: Commence par
- `endsWith`: Finit par
- `gt`: Supérieur à
- `lt`: Inférieur à
- `gte`: Supérieur ou égal à
- `lte`: Inférieur ou égal à
- `isEmpty`: Est vide
- `isNotEmpty`: N'est pas vide

### useVirtualGridExport

Gère l'export de données.

```tsx
const {
  exportToCsv,
  exportToJson,
  exportToExcel,
  copyToClipboard,
} = useVirtualGridExport({
  data,
  columns,
  filename: 'export',
})

// Export CSV
exportToCsv(selectedRows)

// Export Excel
await exportToExcel(selectedRows)

// Export JSON
exportToJson(selectedRows)

// Copier dans le presse-papiers
await copyToClipboard(selectedRows)
```

## Exemple Complet

```tsx
import { AdvancedVirtualLeadsTable } from '@/components/leads/AdvancedVirtualLeadsTable'

function LeadsPage() {
  const [data, setData] = useState<Lead[]>([])

  return (
    <AdvancedVirtualLeadsTable
      data={data}
      onRefresh={() => fetchLeads()}
      onDataChange={setData}
    />
  )
}
```

## Performances

Le système est optimisé pour:
- **Afficher des milliers de lignes** sans perte de performance grâce à la virtualisation
- **Édition inline réactive** avec validation en temps réel
- **Colonnes redimensionnables** avec drag-and-drop fluide
- **Tri et filtrage rapides** avec mémoïsation
- **Export efficace** vers CSV, Excel, JSON

## Architecture

```
components/virtual/
├── VirtualGrid.tsx              # Composant principal
├── EditableCell.tsx             # Cellule éditable
├── ResizableColumn.tsx          # Colonne redimensionnable
├── ColumnManager.tsx            # Gestionnaire de colonnes
├── VirtualGridToolbar.tsx       # Barre d'outils
├── VirtualGridStats.tsx         # Statistiques
└── index.ts                     # Exports

hooks/
├── useVirtualGridState.ts       # État de la grille
├── useVirtualGridColumns.ts     # Création de colonnes
├── useVirtualGridFilters.ts     # Filtres et recherche
└── useVirtualGridExport.ts      # Export de données
```

## Dépendances

- `@tanstack/react-virtual`: Virtualisation des lignes
- `@dnd-kit/core`: Drag-and-drop pour les colonnes
- `@dnd-kit/sortable`: Réorganisation des colonnes
- `zod`: Validation des données
- `xlsx`: Export Excel
- `framer-motion`: Animations

## Personnalisation

### Colonnes personnalisées

```tsx
const customColumn: VirtualGridColumn = {
  id: 'custom',
  label: 'Personnalisé',
  accessor: (row) => row.data.custom,
  format: (value) => `Custom: ${value}`,
  parse: (value) => value.replace('Custom: ', ''),
  validationSchema: z.string().min(5),
  className: 'text-blue-600',
  cellClassName: 'font-bold',
  headerClassName: 'bg-blue-50',
  editable: true,
  sortable: true,
  resizable: true,
  width: 200,
  minWidth: 100,
  maxWidth: 400,
}
```

### Actions personnalisées

```tsx
<VirtualGridToolbar
  actions={[
    {
      label: 'Action',
      icon: <Icon className="h-4 w-4" />,
      onClick: handleAction,
      variant: 'default',
      disabled: false,
    },
  ]}
/>
```
