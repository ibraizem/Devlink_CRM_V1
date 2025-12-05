# Guide de Démarrage Rapide - Grille Virtuelle

## Installation

Aucune installation nécessaire ! Toutes les dépendances sont déjà présentes dans le projet.

## Utilisation Basique (3 étapes)

### 1. Importer les composants

```tsx
import { VirtualGrid } from '@/components/virtual'
import { useVirtualGridColumns, createColumn } from '@/hooks/useVirtualGridColumns'
```

### 2. Définir vos colonnes

```tsx
const columns = useVirtualGridColumns([
  createColumn({
    id: 'name',
    label: 'Nom',
    accessor: 'name',
    type: 'text',
    editable: true,
    width: 200,
  }),
  createColumn({
    id: 'email',
    label: 'Email',
    accessor: 'email',
    type: 'email',
    editable: true,
    width: 250,
  }),
])
```

### 3. Utiliser la grille

```tsx
<VirtualGrid
  data={data}
  columns={columns}
  rowHeight={52}
  enableColumnResizing
  enableColumnReordering
/>
```

## Exemple Complet Minimal

```tsx
'use client'

import { VirtualGrid } from '@/components/virtual'
import { useVirtualGridColumns, createColumn } from '@/hooks/useVirtualGridColumns'

export default function MyPage() {
  const data = [
    { id: '1', name: 'John', email: 'john@example.com' },
    { id: '2', name: 'Jane', email: 'jane@example.com' },
  ]

  const columns = useVirtualGridColumns([
    createColumn({
      id: 'name',
      label: 'Nom',
      accessor: 'name',
      type: 'text',
      editable: true,
    }),
    createColumn({
      id: 'email',
      label: 'Email',
      accessor: 'email',
      type: 'email',
      editable: true,
    }),
  ])

  return (
    <div className="h-[600px]">
      <VirtualGrid
        data={data}
        columns={columns}
        rowHeight={52}
        enableColumnResizing
        enableColumnReordering
        enableColumnManagement
      />
    </div>
  )
}
```

## Ajouter des fonctionnalités

### Sélection de lignes

```tsx
import { useState } from 'react'
import { VirtualGrid } from '@/components/virtual'

const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

<VirtualGrid
  data={data}
  columns={columns}
  selectable
  selectedRows={selectedRows}
  onSelectionChange={setSelectedRows}
  getRowId={(row) => row.id}
/>
```

### Tri

```tsx
import { useState } from 'react'

const [sortBy, setSortBy] = useState(null)

<VirtualGrid
  data={data}
  columns={columns}
  sortBy={sortBy}
  onSortChange={setSortBy}
/>
```

### Édition de cellules

```tsx
const handleCellUpdate = async (rowIndex, columnId, newValue) => {
  console.log('Updated:', { rowIndex, columnId, newValue })
  // Sauvegarder dans votre backend
}

<VirtualGrid
  data={data}
  columns={columns}
  onCellUpdate={handleCellUpdate}
/>
```

### Recherche et Filtres

```tsx
import { useVirtualGridFilters } from '@/hooks/useVirtualGridFilters'
import { VirtualGridToolbar } from '@/components/virtual'

const {
  searchValue,
  setSearchValue,
  filteredData,
} = useVirtualGridFilters({
  data,
  columns,
  searchableColumns: ['name', 'email'],
})

return (
  <>
    <VirtualGridToolbar
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      totalCount={filteredData.length}
    />
    <VirtualGrid data={filteredData} columns={columns} />
  </>
)
```

### Export de données

```tsx
import { useVirtualGridExport } from '@/hooks/useVirtualGridExport'

const { exportToCsv, exportToExcel } = useVirtualGridExport({
  data,
  columns,
  filename: 'export',
})

<button onClick={() => exportToCsv()}>
  Exporter en CSV
</button>
```

### Statistiques

```tsx
import { VirtualGridStats } from '@/components/virtual'
import { Users } from 'lucide-react'

<VirtualGridStats
  stats={[
    {
      label: 'Total',
      value: data.length,
      icon: <Users className="h-4 w-4" />,
      color: 'bg-blue-100 text-blue-600',
    },
  ]}
/>
```

## Stack Complet (tout inclus)

```tsx
'use client'

import { useState, useCallback } from 'react'
import { 
  VirtualGrid, 
  VirtualGridToolbar, 
  VirtualGridStats 
} from '@/components/virtual'
import { useVirtualGridState } from '@/hooks/useVirtualGridState'
import { useVirtualGridColumns, createColumn } from '@/hooks/useVirtualGridColumns'
import { useVirtualGridFilters } from '@/hooks/useVirtualGridFilters'
import { useVirtualGridExport } from '@/hooks/useVirtualGridExport'
import { Users, UserCheck } from 'lucide-react'
import { toast } from 'sonner'

export default function CompleteExample() {
  // Données
  const [data] = useState([
    { id: '1', name: 'John', email: 'john@example.com', age: 30 },
    { id: '2', name: 'Jane', email: 'jane@example.com', age: 25 },
  ])

  // Colonnes
  const columns = useVirtualGridColumns([
    createColumn({
      id: 'name',
      label: 'Nom',
      accessor: 'name',
      type: 'text',
      editable: true,
      sortable: true,
      width: 200,
    }),
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
      id: 'age',
      label: 'Âge',
      accessor: 'age',
      type: 'number',
      editable: true,
      sortable: true,
      width: 100,
    }),
  ])

  // État
  const {
    columns: managedColumns,
    selectedRows,
    sortBy,
    handleCellUpdate: handleStateUpdate,
    handleColumnsChange,
    handleSelectionChange,
    handleSortChange,
    clearSelection,
    getSelectedData,
  } = useVirtualGridState({
    initialColumns: columns,
    data,
    getRowId: (row) => row.id,
  })

  // Filtres
  const {
    searchValue,
    setSearchValue,
    filteredData,
  } = useVirtualGridFilters({
    data,
    columns: managedColumns,
    searchableColumns: ['name', 'email'],
  })

  // Export
  const { exportToCsv } = useVirtualGridExport({
    data: filteredData,
    columns: managedColumns,
    filename: 'export',
  })

  // Stats
  const stats = [
    {
      label: 'Total',
      value: filteredData.length,
      icon: <Users className="h-4 w-4" />,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Sélectionnés',
      value: selectedRows.size,
      icon: <UserCheck className="h-4 w-4" />,
      color: 'bg-green-100 text-green-600',
    },
  ]

  // Handlers
  const handleCellUpdate = useCallback(
    async (rowIndex: number, columnId: string, newValue: any) => {
      await handleStateUpdate(rowIndex, columnId, newValue)
      toast.success('Cellule mise à jour')
    },
    [handleStateUpdate]
  )

  const handleExport = useCallback(() => {
    const selectedData = getSelectedData()
    exportToCsv(selectedData.length > 0 ? selectedData : undefined)
    toast.success('Export réussi')
  }, [getSelectedData, exportToCsv])

  return (
    <div className="space-y-4 p-4">
      <VirtualGridStats stats={stats} />

      <div className="border rounded-lg overflow-hidden">
        <VirtualGridToolbar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          selectedCount={selectedRows.size}
          totalCount={filteredData.length}
          onExport={handleExport}
          onClearSelection={selectedRows.size > 0 ? clearSelection : undefined}
        />

        <div className="h-[600px]">
          <VirtualGrid
            data={filteredData}
            columns={managedColumns}
            rowHeight={52}
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
        </div>
      </div>
    </div>
  )
}
```

## Utilisation avec Leads

### Version Simple

```tsx
import { VirtualLeadsTable } from '@/components/leads/VirtualLeadsTable'

<VirtualLeadsTable
  data={leads}
  onRefresh={fetchLeads}
/>
```

### Version Avancée

```tsx
import { AdvancedVirtualLeadsTable } from '@/components/leads/AdvancedVirtualLeadsTable'

<AdvancedVirtualLeadsTable
  data={leads}
  onRefresh={fetchLeads}
  onDataChange={setLeads}
/>
```

## Types de Colonnes Supportés

| Type | Description | Validation | Formatage |
|------|-------------|------------|-----------|
| `text` | Texte simple | String | Aucun |
| `number` | Nombre | Number | 1 234,56 |
| `email` | Email | Email valide | Aucun |
| `tel` | Téléphone | Format FR | 06 12 34 56 78 |
| `url` | URL | URL valide | Hostname |
| `date` | Date | Date valide | JJ/MM/AAAA |
| `boolean` | Booléen | Boolean | Oui/Non |
| `currency` | Montant | Number | 1 234,56 € |

## Props Importantes

### VirtualGrid

| Prop | Type | Description |
|------|------|-------------|
| `data` | Array | Données à afficher |
| `columns` | Array | Configuration des colonnes |
| `rowHeight` | number | Hauteur de ligne (défaut: 52) |
| `selectable` | boolean | Activer la sélection |
| `onCellUpdate` | function | Callback édition cellule |
| `enableColumnResizing` | boolean | Redimensionnement colonnes |
| `enableColumnReordering` | boolean | Réorganisation colonnes |
| `enableColumnManagement` | boolean | Gestionnaire de colonnes |

## Performances

- ✅ Supporte 100 000+ lignes
- ✅ 60 FPS garanti
- ✅ Virtualisation automatique
- ✅ Optimisations mémoïsation

## Support

- Documentation complète : `components/virtual/README.md`
- Exemples : `components/virtual/examples/`
- Types : `types/virtual-grid.ts`

## Prochaines Étapes

1. Copier un des exemples ci-dessus
2. Adapter à vos données
3. Personnaliser les colonnes
4. Ajouter les fonctionnalités souhaitées
5. Tester avec `yarn dev`

## Aide

Pour plus de détails, voir :
- `VIRTUAL_GRID_IMPLEMENTATION.md` - Documentation complète
- `VIRTUAL_GRID_FILES.md` - Liste des fichiers
- `components/virtual/README.md` - Documentation détaillée
