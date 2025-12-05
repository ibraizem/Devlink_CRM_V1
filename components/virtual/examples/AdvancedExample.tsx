'use client'

import { useState, useCallback } from 'react'
import { VirtualGrid, VirtualGridToolbar, VirtualGridStats } from '@/components/virtual'
import { useVirtualGridState } from '@/hooks/useVirtualGridState'
import { useVirtualGridColumns, createColumn } from '@/hooks/useVirtualGridColumns'
import { useVirtualGridFilters } from '@/hooks/useVirtualGridFilters'
import { useVirtualGridExport } from '@/hooks/useVirtualGridExport'
import { toast } from 'sonner'
import { Users, UserCheck, Clock, CheckCircle } from 'lucide-react'

interface AdvancedData {
  id: string
  name: string
  email: string
  phone: string
  company: string
  status: 'nouveau' | 'en_cours' | 'traite' | 'abandonne'
  score: number
  created_at: string
}

export function AdvancedExample() {
  const [data] = useState<AdvancedData[]>(
    Array.from({ length: 50000 }, (_, i) => ({
      id: `${i}`,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      phone: `0612345${i.toString().padStart(3, '0')}`,
      company: `Company ${Math.floor(i / 100)}`,
      status: (['nouveau', 'en_cours', 'traite', 'abandonne'] as const)[i % 4],
      score: Math.floor(Math.random() * 100),
      created_at: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
    }))
  )

  const columns = useVirtualGridColumns<AdvancedData>([
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
      id: 'phone',
      label: 'Téléphone',
      accessor: 'phone',
      type: 'tel',
      editable: true,
      sortable: true,
      width: 180,
    }),
    createColumn({
      id: 'company',
      label: 'Entreprise',
      accessor: 'company',
      type: 'text',
      editable: true,
      sortable: true,
      width: 200,
    }),
    createColumn({
      id: 'status',
      label: 'Statut',
      accessor: 'status',
      type: 'text',
      sortable: true,
      width: 120,
    }),
    createColumn({
      id: 'score',
      label: 'Score',
      accessor: 'score',
      type: 'number',
      editable: true,
      sortable: true,
      width: 100,
    }),
    createColumn({
      id: 'created_at',
      label: 'Date de création',
      accessor: 'created_at',
      type: 'date',
      sortable: true,
      width: 150,
    }),
  ])

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

  const {
    searchValue,
    setSearchValue,
    filteredData,
  } = useVirtualGridFilters({
    data,
    columns: managedColumns,
    searchableColumns: ['name', 'email', 'company'],
  })

  const { exportToCsv, exportToJson, exportToExcel } = useVirtualGridExport({
    data: filteredData,
    columns: managedColumns,
    filename: 'example-export',
  })

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
    {
      label: 'En cours',
      value: filteredData.filter((d) => d.status === 'en_cours').length,
      icon: <Clock className="h-4 w-4" />,
      color: 'bg-orange-100 text-orange-600',
    },
    {
      label: 'Traités',
      value: filteredData.filter((d) => d.status === 'traite').length,
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'bg-purple-100 text-purple-600',
    },
  ]

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
    <div className="space-y-4">
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

        <div className="h-[calc(100vh-20rem)]">
          <VirtualGrid
            data={filteredData}
            columns={managedColumns}
            rowHeight={52}
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
        </div>
      </div>
    </div>
  )
}
