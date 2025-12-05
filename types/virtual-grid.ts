import { ZodSchema } from 'zod'

export type ColumnType = 
  | 'text' 
  | 'number' 
  | 'email' 
  | 'tel' 
  | 'url' 
  | 'date' 
  | 'boolean' 
  | 'currency'

export type SortDirection = 'asc' | 'desc'

export type FilterOperator = 
  | 'equals' 
  | 'contains' 
  | 'startsWith' 
  | 'endsWith' 
  | 'gt' 
  | 'lt' 
  | 'gte' 
  | 'lte' 
  | 'isEmpty' 
  | 'isNotEmpty'

export interface VirtualGridSort {
  columnId: string
  direction: SortDirection
}

export interface VirtualGridFilter<T = any> {
  id: string
  columnId: string
  operator: FilterOperator
  value: T
  active: boolean
}

export interface VirtualGridColumnBase<T = any> {
  id: string
  label: string
  accessor: keyof T | ((row: T) => any)
  width?: number
  minWidth?: number
  maxWidth?: number
  resizable?: boolean
  sortable?: boolean
  editable?: boolean
  locked?: boolean
  visible?: boolean
  className?: string
  headerClassName?: string
  cellClassName?: string
}

export interface VirtualGridColumnFormatting<T = any> {
  format?: (value: any) => string
  parse?: (value: string) => any
  validationSchema?: ZodSchema<any>
  type?: ColumnType
  placeholder?: string
}

export interface VirtualGridColumnFull<T = any> 
  extends VirtualGridColumnBase<T>, 
          VirtualGridColumnFormatting<T> {}

export interface VirtualGridSelection {
  selectedRows: Set<string>
  onSelectionChange: (selected: Set<string>) => void
}

export interface VirtualGridCallbacks<T = any> {
  onRowClick?: (row: T, index: number) => void
  onCellUpdate?: (rowIndex: number, columnId: string, newValue: any) => Promise<void>
  onColumnsChange?: (columns: VirtualGridColumnFull<T>[]) => void
  onSortChange?: (sort: VirtualGridSort | null) => void
}

export interface VirtualGridDimensions {
  rowHeight?: number
  headerHeight?: number
  overscan?: number
}

export interface VirtualGridFeatures {
  selectable?: boolean
  enableColumnReordering?: boolean
  enableColumnResizing?: boolean
  enableColumnManagement?: boolean
}

export interface VirtualGridState<T = any> {
  data: T[]
  columns: VirtualGridColumnFull<T>[]
  selectedRows: Set<string>
  sortBy: VirtualGridSort | null
  filters: VirtualGridFilter[]
  searchValue: string
}

export interface VirtualGridStats {
  total: number
  selected: number
  filtered: number
  visible: number
}

export interface VirtualGridExportFormat {
  format: 'csv' | 'json' | 'excel' | 'clipboard'
  filename?: string
  includeHeaders?: boolean
  onlySelected?: boolean
  onlyVisible?: boolean
}

export interface VirtualGridAction {
  id: string
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost'
  disabled?: boolean
  hidden?: boolean
  requiresSelection?: boolean
}

export interface VirtualGridToolbarFilter {
  id: string
  label: string
  active: boolean
  onToggle: () => void
}

export interface VirtualGridPerformanceMetrics {
  renderTime: number
  virtualizedRows: number
  totalRows: number
  visibleRows: number
  scrollTop: number
  scrollHeight: number
}
