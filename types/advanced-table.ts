import { Lead, ColumnDefinition } from './leads'
import { LeadStatus } from '@/lib/services/leadService'

export interface CellContextMenuProps<T extends Lead> {
  children: React.ReactNode
  lead: T
  cellKey?: string
  cellValue?: any
  onCall?: (lead: T) => void
  onEmail?: (lead: T) => void
  onMessage?: (lead: T) => void
  onEdit?: (lead: T) => void
  onDelete?: (lead: T) => void
  onNote?: (lead: T) => void
  onStatusChange?: (lead: T, status: LeadStatus) => void
  onCopyCell?: (value: any) => void
  onCopyRow?: (lead: T) => void
  onFilterByValue?: (key: string, value: any) => void
}

export interface GlobalSearchProps<T extends Lead> {
  data: T[]
  onSelectLead?: (lead: T) => void
  trigger?: React.ReactNode
}

export interface SearchResult<T extends Lead> {
  lead: T
  matchedFields: Array<{
    key: string
    value: string
    highlighted: string
  }>
  score: number
}

export interface ColumnFiltersProps<T extends Lead> {
  data: T[]
  columns: ColumnDefinition<T>[]
  filters: Record<string, string[]>
  onFiltersChange: (filters: Record<string, string[]>) => void
}

export interface ExportDialogProps<T extends Lead> {
  data: T[]
  selectedIds: string[]
  columns: ColumnDefinition<T>[]
  trigger?: React.ReactNode
}

export type ExportFormat = 'csv' | 'excel' | 'json'

export interface ExportOptions {
  format: ExportFormat
  selectedColumns: string[]
  includeHeaders: boolean
  exportAll: boolean
}

export interface FullscreenTableProps {
  children: React.ReactNode
  trigger?: React.ReactNode
  shortcuts?: boolean
}

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  description: string
  action: () => void
}

export interface EnhancedLeadsTableProps<T extends Lead> {
  data: T[]
  columns: Array<ColumnDefinition<T>>
  onRefresh?: () => void
}

export interface AdvancedTableFilters {
  columnFilters: Record<string, string[]>
  search: string
  dateRange?: {
    from: string
    to: string
  }
}

export interface AdvancedTableState<T extends Lead> {
  filteredData: T[]
  filters: AdvancedTableFilters
  selected: Set<string>
  sortKey: keyof T | ''
  sortDir: 'asc' | 'desc'
}

export interface AdvancedTableActions<T extends Lead> {
  toggleSort: (key: keyof T) => void
  toggleSelect: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
  updateColumnFilter: (column: string, values: string[]) => void
  clearColumnFilter: (column: string) => void
  clearAllFilters: () => void
  updateSearch: (search: string) => void
}

export interface LeadActionCallbacks<T extends Lead> {
  onCall?: (lead: T) => void
  onEmail?: (lead: T) => void
  onMessage?: (lead: T) => void
  onNote?: (lead: T) => void
  onEdit?: (lead: T) => void
  onDelete?: (lead: T) => void
  onStatusChange?: (lead: T, status: LeadStatus) => void
}

export interface TableInteractionCallbacks {
  onCopyCell?: (value: any) => void
  onCopyRow?: (lead: Lead) => void
  onFilterByValue?: (key: string, value: any) => void
}
