'use client'

import { useCallback, useMemo, useState } from 'react'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { LeadsTableHeader } from './LeadsTableHeader'
import { useLeadsTable } from '@/hooks/useLeadsTable'
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination'
import { toast } from 'sonner'
import { ColumnDefinition, Lead } from '@/types/leads'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, SearchX } from 'lucide-react'
import { NoteModal } from './NoteModal'
import { EditLeadDrawer } from './EditLeadDrawer'
import { leadService, LeadStatus } from '@/lib/services/leadService'
import { CellContextMenu } from './CellContextMenu'
import { GlobalSearch } from './GlobalSearch'
import { ColumnFilters } from './ColumnFilters'
import { ExportDialog } from './ExportDialog'
import { FullscreenTable } from './FullscreenTable'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

interface EnhancedLeadsTableProps<T extends Lead> {
  data: T[]
  columns: Array<ColumnDefinition<T>>
  onRefresh?: () => void
}

const getLeadName = (lead: Lead) =>
  lead.nom || lead.name || lead.prenom || lead.email || 'Contact inconnu'

export function EnhancedLeadsTable<T extends Lead>({
  data,
  columns: initialColumns,
  onRefresh,
}: EnhancedLeadsTableProps<T>) {
  const [leadToNote, setLeadToNote] = useState<T | null>(null)
  const [leadToEdit, setLeadToEdit] = useState<T | null>(null)
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({})
  const [selectedLead, setSelectedLead] = useState<T | null>(null)

  const filteredData = useMemo(() => {
    if (Object.keys(columnFilters).length === 0) return data

    return data.filter(item => {
      return Object.entries(columnFilters).every(([key, values]) => {
        if (values.length === 0) return true
        const itemValue = String(item[key as keyof T] || '')
        return values.includes(itemValue)
      })
    })
  }, [data, columnFilters])

  const {
    search,
    setSearch,
    sortKey,
    sortDir,
    toggleSort,
    selected,
    toggleSelect,
    page,
    setPage,
    totalPages,
    data: paginated,
  } = useLeadsTable<T>(filteredData)

  const handleCall = useCallback((lead: T) => {
    const name = getLeadName(lead)
    toast.info(`📞 Appel de ${name}...`)
  }, [])

  const handleEmail = useCallback((lead: T) => {
    const name = getLeadName(lead)
    toast.info(`📧 Email à ${name}...`)
  }, [])

  const handleMessage = useCallback((lead: T) => {
    const name = getLeadName(lead)
    toast.info(`💬 Message à ${name}...`)
  }, [])

  const handleNote = useCallback((lead: T) => setLeadToNote(lead), [])
  const handleEdit = useCallback((lead: T) => setLeadToEdit(lead), [])

  const handleDelete = useCallback(
    async (lead: T) => {
      const name = getLeadName(lead)
      if (!confirm(`Supprimer ${name} ?`)) return

      try {
        await leadService.deleteLead(lead.id)
        toast.success(`✅ Lead ${name} supprimé`)
        onRefresh?.()
      } catch (error) {
        console.error('Erreur suppression lead:', error)
        toast.error(`❌ Erreur lors de la suppression de ${name}`)
      }
    },
    [onRefresh]
  )

  const handleStatusChange = useCallback(
    async (lead: T, status: LeadStatus) => {
      const name = getLeadName(lead)
      try {
        await leadService.updateLeadStatus(lead.id, status)
        toast.success(`✅ Statut de ${name} mis à jour`)
        onRefresh?.()
      } catch (error) {
        console.error('Erreur mise à jour statut:', error)
        toast.error(`❌ Erreur lors de la mise à jour du statut`)
      }
    },
    [onRefresh]
  )

  const handleCopyCell = useCallback((value: any) => {
    toast.success('📋 Cellule copiée')
  }, [])

  const handleCopyRow = useCallback((lead: T) => {
    toast.success('📋 Ligne copiée')
  }, [])

  const handleFilterByValue = useCallback((key: string, value: any) => {
    setColumnFilters(prev => ({
      ...prev,
      [key]: [String(value)]
    }))
    toast.info(`Filtré par ${key}: ${value}`)
  }, [])

  const handleSelectLead = useCallback((lead: Lead) => {
    setSelectedLead(lead as T)
    setLeadToEdit(lead as T)
  }, [])

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(Math.max(1, Math.min(totalPages, newPage)))
    },
    [setPage, totalPages]
  )

  const handleSelectAll = useCallback(() => {
    if (selected.size === paginated.length) {
      paginated.forEach(row => toggleSelect(row.id))
    } else {
      paginated.forEach(row => {
        if (!selected.has(row.id)) {
          toggleSelect(row.id)
        }
      })
    }
  }, [paginated, selected, toggleSelect])

  const allSelected = paginated.length > 0 && selected.size === paginated.length
  const someSelected = selected.size > 0 && selected.size < paginated.length

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <GlobalSearch 
          data={filteredData} 
          onSelectLead={handleSelectLead}
        />
        
        <ColumnFilters
          data={filteredData}
          columns={initialColumns}
          filters={columnFilters}
          onFiltersChange={setColumnFilters}
        />

        <div className="ml-auto flex items-center gap-2">
          <ExportDialog
            data={filteredData}
            selectedIds={Array.from(selected)}
            columns={initialColumns}
          />
          
          <FullscreenTable>
            <EnhancedLeadsTableContent
              paginated={paginated}
              columns={initialColumns}
              selected={selected}
              toggleSelect={toggleSelect}
              allSelected={allSelected}
              someSelected={someSelected}
              handleSelectAll={handleSelectAll}
              sortKey={sortKey}
              sortDir={sortDir}
              toggleSort={toggleSort}
              handleCall={handleCall}
              handleEmail={handleEmail}
              handleMessage={handleMessage}
              handleNote={handleNote}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              handleStatusChange={handleStatusChange}
              handleCopyCell={handleCopyCell}
              handleCopyRow={handleCopyRow}
              handleFilterByValue={handleFilterByValue}
            />
          </FullscreenTable>
        </div>
      </div>

      <EnhancedLeadsTableContent
        paginated={paginated}
        columns={initialColumns}
        selected={selected}
        toggleSelect={toggleSelect}
        allSelected={allSelected}
        someSelected={someSelected}
        handleSelectAll={handleSelectAll}
        sortKey={sortKey}
        sortDir={sortDir}
        toggleSort={toggleSort}
        handleCall={handleCall}
        handleEmail={handleEmail}
        handleMessage={handleMessage}
        handleNote={handleNote}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        handleStatusChange={handleStatusChange}
        handleCopyCell={handleCopyCell}
        handleCopyRow={handleCopyRow}
        handleFilterByValue={handleFilterByValue}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <span className="text-sm text-muted-foreground">
            Page {page} / {totalPages}
          </span>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink isActive>{page}</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {leadToNote && (
        <NoteModal
          open={!!leadToNote}
          onOpenChange={() => setLeadToNote(null)}
          lead={leadToNote}
        />
      )}

      {leadToEdit && (
        <EditLeadDrawer
          open={!!leadToEdit}
          onOpenChange={() => setLeadToEdit(null)}
          lead={leadToEdit}
        />
      )}
    </div>
  )
}

interface EnhancedLeadsTableContentProps<T extends Lead> {
  paginated: T[]
  columns: ColumnDefinition<T>[]
  selected: Set<string>
  toggleSelect: (id: string) => void
  allSelected: boolean
  someSelected: boolean
  handleSelectAll: () => void
  sortKey: keyof T | ''
  sortDir: 'asc' | 'desc'
  toggleSort: (key: keyof T) => void
  handleCall: (lead: T) => void
  handleEmail: (lead: T) => void
  handleMessage: (lead: T) => void
  handleNote: (lead: T) => void
  handleEdit: (lead: T) => void
  handleDelete: (lead: T) => void
  handleStatusChange: (lead: T, status: LeadStatus) => void
  handleCopyCell: (value: any) => void
  handleCopyRow: (lead: T) => void
  handleFilterByValue: (key: string, value: any) => void
}

function EnhancedLeadsTableContent<T extends Lead>({
  paginated,
  columns,
  selected,
  toggleSelect,
  allSelected,
  someSelected,
  handleSelectAll,
  sortKey,
  sortDir,
  toggleSort,
  handleCall,
  handleEmail,
  handleMessage,
  handleNote,
  handleEdit,
  handleDelete,
  handleStatusChange,
  handleCopyCell,
  handleCopyRow,
  handleFilterByValue,
}: EnhancedLeadsTableContentProps<T>) {
  return (
    <div className="rounded-md border">
      <Table>
        <thead>
          <LeadsTableHeader
            columns={[
              { key: '_select' as keyof T, label: '' },
              ...columns
            ]}
            sortKey={sortKey as string}
            sortDir={sortDir}
            onSort={toggleSort}
            renderHeaderCell={(col) => {
              if (col.key === '_select') {
                return (
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Sélectionner tout"
                    className={cn(someSelected && 'data-[state=checked]:bg-muted')}
                  />
                )
              }
              return null
            }}
          />
        </thead>
        <TableBody>
          {paginated.length > 0 ? (
            paginated.map((row: T) => (
              <TableRow key={row.id} className="group">
                <TableCell className="w-12">
                  <Checkbox
                    checked={selected.has(row.id)}
                    onCheckedChange={() => toggleSelect(row.id)}
                    aria-label={`Sélectionner ${getLeadName(row)}`}
                  />
                </TableCell>
                {columns.map((col) => {
                  const cellValue = row[col.key]
                  return (
                    <TableCell key={String(col.key)}>
                      <CellContextMenu
                        lead={row}
                        cellKey={String(col.key)}
                        cellValue={cellValue}
                        onCall={handleCall}
                        onEmail={handleEmail}
                        onMessage={handleMessage}
                        onNote={handleNote}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onStatusChange={handleStatusChange}
                        onCopyCell={handleCopyCell}
                        onCopyRow={handleCopyRow}
                        onFilterByValue={handleFilterByValue}
                      >
                        <div className="cursor-context-menu">
                          {cellValue !== undefined && cellValue !== null
                            ? String(cellValue)
                            : '-'}
                        </div>
                      </CellContextMenu>
                    </TableCell>
                  )
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length + 1} className="text-center py-10 text-muted-foreground">
                <div className="flex flex-col items-center justify-center">
                  <SearchX className="h-6 w-6 mb-2 opacity-50" />
                  Aucun lead ne correspond à votre recherche.
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
