'use client'

import { useCallback, useMemo } from 'react'
import { VirtualGrid, VirtualGridToolbar, VirtualGridStats } from '@/components/virtual'
import { useVirtualGridState } from '@/hooks/useVirtualGridState'
import { useVirtualGridColumns, createColumn } from '@/hooks/useVirtualGridColumns'
import { useVirtualGridFilters } from '@/hooks/useVirtualGridFilters'
import { useVirtualGridExport } from '@/hooks/useVirtualGridExport'
import { Lead } from '@/types/leads'
import { leadService } from '@/lib/services/leadService'
import { toast } from 'sonner'
import { 
  Users, 
  UserCheck, 
  Clock, 
  CheckCircle,
  Download,
  Copy,
  FileSpreadsheet,
  FileJson
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface AdvancedVirtualLeadsTableProps {
  data: Lead[]
  onRefresh?: () => void
  onDataChange?: (data: Lead[]) => void
}

export function AdvancedVirtualLeadsTable({ 
  data, 
  onRefresh,
  onDataChange 
}: AdvancedVirtualLeadsTableProps) {
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

  const {
    searchValue,
    setSearchValue,
    filteredData,
    filters,
    toggleFilter,
  } = useVirtualGridFilters({
    data,
    columns: managedColumns,
    searchableColumns: ['nom', 'prenom', 'email', 'telephone', 'entreprise'],
  })

  const { exportToCsv, exportToJson, exportToExcel, copyToClipboard } = useVirtualGridExport({
    data: filteredData,
    columns: managedColumns,
    filename: 'leads',
  })

  const stats = useMemo(() => {
    const total = filteredData.length
    const selected = selectedRows.size
    
    const statusCounts = filteredData.reduce((acc, lead) => {
      const status = lead.statut || 'nouveau'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return [
      {
        label: 'Total',
        value: total,
        icon: <Users className="h-4 w-4" />,
        color: 'bg-blue-100 text-blue-600',
      },
      {
        label: 'Sélectionnés',
        value: selected,
        icon: <UserCheck className="h-4 w-4" />,
        color: 'bg-green-100 text-green-600',
      },
      {
        label: 'En cours',
        value: statusCounts.en_cours || 0,
        icon: <Clock className="h-4 w-4" />,
        color: 'bg-orange-100 text-orange-600',
      },
      {
        label: 'Traités',
        value: statusCounts.traite || 0,
        icon: <CheckCircle className="h-4 w-4" />,
        color: 'bg-purple-100 text-purple-600',
      },
    ]
  }, [filteredData, selectedRows])

  const handleCellUpdateWithService = useCallback(
    async (rowIndex: number, columnId: string, newValue: any) => {
      const row = filteredData[rowIndex]
      
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
    [filteredData, handleCellUpdate, onRefresh]
  )

  const handleExport = useCallback(() => {
    const selectedData = getSelectedData()
    if (selectedData.length > 0) {
      exportToCsv(selectedData)
      toast.success(`${selectedData.length} leads exportés`)
    } else {
      exportToCsv()
      toast.success('Tous les leads exportés')
    }
  }, [getSelectedData, exportToCsv])

  const handleDelete = useCallback(async () => {
    const selectedData = getSelectedData()
    if (selectedData.length === 0) return

    if (!confirm(`Supprimer ${selectedData.length} lead(s) ?`)) return

    try {
      await Promise.all(
        selectedData.map((lead) => leadService.deleteLead(lead.id))
      )
      toast.success(`${selectedData.length} lead(s) supprimé(s)`)
      clearSelection()
      onRefresh?.()
    } catch (error) {
      console.error('Erreur suppression:', error)
      toast.error('Erreur lors de la suppression')
    }
  }, [getSelectedData, clearSelection, onRefresh])

  const handleCopyToClipboard = useCallback(async () => {
    const selectedData = getSelectedData()
    const success = await copyToClipboard(
      selectedData.length > 0 ? selectedData : undefined
    )
    if (success) {
      toast.success('Copié dans le presse-papiers')
    } else {
      toast.error('Erreur lors de la copie')
    }
  }, [getSelectedData, copyToClipboard])

  const handleExportExcel = useCallback(async () => {
    const selectedData = getSelectedData()
    try {
      await exportToExcel(selectedData.length > 0 ? selectedData : undefined)
      toast.success('Export Excel réussi')
    } catch (error) {
      toast.error('Erreur lors de l\'export Excel')
    }
  }, [getSelectedData, exportToExcel])

  const handleExportJson = useCallback(() => {
    const selectedData = getSelectedData()
    exportToJson(selectedData.length > 0 ? selectedData : undefined)
    toast.success('Export JSON réussi')
  }, [getSelectedData, exportToJson])

  const filterOptions = useMemo(() => {
    return [
      {
        id: 'nouveau',
        label: 'Nouveaux leads',
        active: filters.some((f) => f.columnId === 'statut' && f.value === 'nouveau' && f.active),
        onToggle: () => {
          const existingFilter = filters.find((f) => f.columnId === 'statut' && f.value === 'nouveau')
          if (existingFilter) {
            toggleFilter(existingFilter.id)
          }
        },
      },
      {
        id: 'en_cours',
        label: 'En cours',
        active: filters.some((f) => f.columnId === 'statut' && f.value === 'en_cours' && f.active),
        onToggle: () => {
          const existingFilter = filters.find((f) => f.columnId === 'statut' && f.value === 'en_cours')
          if (existingFilter) {
            toggleFilter(existingFilter.id)
          }
        },
      },
    ]
  }, [filters, toggleFilter])

  return (
    <div className="space-y-4">
      <VirtualGridStats stats={stats} />

      <div className="border rounded-lg overflow-hidden">
        <VirtualGridToolbar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          selectedCount={selectedRows.size}
          totalCount={filteredData.length}
          onRefresh={onRefresh}
          onDelete={selectedRows.size > 0 ? handleDelete : undefined}
          onClearSelection={selectedRows.size > 0 ? clearSelection : undefined}
          filters={filterOptions}
          actions={[
            {
              label: '',
              icon: (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExport}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportExcel}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportJson}>
                      <FileJson className="h-4 w-4 mr-2" />
                      JSON
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleCopyToClipboard}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copier
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ),
              onClick: () => {},
            },
          ]}
        />

        <div className="h-[calc(100vh-24rem)]">
          <VirtualGrid
            data={filteredData}
            columns={managedColumns}
            rowHeight={52}
            headerHeight={48}
            overscan={10}
            selectable
            selectedRows={selectedRows}
            onSelectionChange={handleSelectionChange}
            onCellUpdate={handleCellUpdateWithService}
            onColumnsChange={handleColumnsChange}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            getRowId={(row) => row.id}
            enableColumnReordering
            enableColumnResizing
            enableColumnManagement
          />
        </div>
      </div>
    </div>
  )
}
