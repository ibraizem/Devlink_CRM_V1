'use client'

import { useCallback, useMemo } from 'react'
import { VirtualGrid } from '@/components/virtual'
import { useVirtualGridState } from '@/hooks/useVirtualGridState'
import { useVirtualGridColumns, createColumn } from '@/hooks/useVirtualGridColumns'
import { Lead } from '@/types/leads'
import { leadService } from '@/lib/services/leadService'
import { toast } from 'sonner'
import { z } from 'zod'

interface VirtualLeadsTableProps {
  data: Lead[]
  onRefresh?: () => void
  onDataChange?: (data: Lead[]) => void
}

export function VirtualLeadsTable({ 
  data, 
  onRefresh,
  onDataChange 
}: VirtualLeadsTableProps) {
  const columnPresets = useMemo(() => [
    createColumn<Lead>({
      id: 'nom',
      label: 'Nom',
      accessor: 'nom',
      type: 'text',
      editable: true,
      sortable: true,
      width: 180,
    }),
    createColumn<Lead>({
      id: 'prenom',
      label: 'Prénom',
      accessor: 'prenom',
      type: 'text',
      editable: true,
      sortable: true,
      width: 180,
    }),
    createColumn<Lead>({
      id: 'email',
      label: 'Email',
      accessor: 'email',
      type: 'email',
      editable: true,
      sortable: true,
      width: 250,
    }),
    createColumn<Lead>({
      id: 'telephone',
      label: 'Téléphone',
      accessor: 'telephone',
      type: 'tel',
      editable: true,
      sortable: true,
      width: 180,
    }),
    createColumn<Lead>({
      id: 'entreprise',
      label: 'Entreprise',
      accessor: 'entreprise',
      type: 'text',
      editable: true,
      sortable: true,
      width: 200,
    }),
    createColumn<Lead>({
      id: 'poste',
      label: 'Poste',
      accessor: 'poste',
      type: 'text',
      editable: true,
      sortable: true,
      width: 180,
    }),
    createColumn<Lead>({
      id: 'ville',
      label: 'Ville',
      accessor: 'ville',
      type: 'text',
      editable: true,
      sortable: true,
      width: 150,
    }),
    createColumn<Lead>({
      id: 'code_postal',
      label: 'Code postal',
      accessor: 'code_postal',
      type: 'text',
      editable: true,
      sortable: true,
      width: 130,
    }),
    createColumn<Lead>({
      id: 'statut',
      label: 'Statut',
      accessor: 'statut',
      type: 'text',
      editable: false,
      sortable: true,
      width: 120,
    }),
    createColumn<Lead>({
      id: 'score',
      label: 'Score',
      accessor: 'score',
      type: 'number',
      editable: true,
      sortable: true,
      width: 100,
    }),
  ], [])

  const columns = useVirtualGridColumns(columnPresets)

  const {
    columns: managedColumns,
    sortedData,
    selectedRows,
    sortBy,
    handleCellUpdate,
    handleColumnsChange,
    handleSelectionChange,
    handleSortChange,
    clearSelection,
    getSelectedData,
  } = useVirtualGridState({
    initialColumns: columns,
    data,
    getRowId: (row) => row.id,
    onDataChange,
  })

  const handleCellUpdateWithService = useCallback(
    async (rowIndex: number, columnId: string, newValue: any) => {
      const row = sortedData[rowIndex]
      
      try {
        const updates: any = {}
        
        if (columnId === 'statut') {
          await leadService.updateLeadStatus(row.id, newValue)
        } else {
          if (row.donnees) {
            updates.donnees = {
              ...row.donnees,
              [columnId]: newValue,
            }
          } else {
            updates[columnId] = newValue
          }
          
          await leadService.updateLeadData(row.id, updates)
        }
        
        await handleCellUpdate(rowIndex, columnId, newValue)
        
        toast.success('Cellule mise à jour')
        onRefresh?.()
      } catch (error) {
        console.error('Erreur mise à jour cellule:', error)
        toast.error('Erreur lors de la mise à jour')
        throw error
      }
    },
    [sortedData, handleCellUpdate, onRefresh]
  )

  const handleRowClick = useCallback(
    (row: Lead, index: number) => {
      console.log('Row clicked:', row)
    },
    []
  )

  return (
    <div className="h-[calc(100vh-12rem)]">
      <VirtualGrid
        data={sortedData}
        columns={managedColumns}
        rowHeight={52}
        headerHeight={48}
        overscan={10}
        selectable
        selectedRows={selectedRows}
        onSelectionChange={handleSelectionChange}
        onRowClick={handleRowClick}
        onCellUpdate={handleCellUpdateWithService}
        onColumnsChange={handleColumnsChange}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        getRowId={(row) => row.id}
        enableColumnReordering
        enableColumnResizing
        enableColumnManagement
        className="shadow-sm"
      />
    </div>
  )
}
