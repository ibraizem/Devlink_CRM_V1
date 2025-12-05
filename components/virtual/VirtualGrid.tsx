'use client'

import { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { ResizableColumn } from './ResizableColumn'
import { EditableCell } from './EditableCell'
import { ColumnManager, ColumnConfig } from './ColumnManager'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Settings2 } from 'lucide-react'
import { ZodSchema } from 'zod'

export interface VirtualGridColumn<T = any> {
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
  format?: (value: any) => string
  parse?: (value: string) => any
  validationSchema?: ZodSchema<any>
  type?: 'text' | 'number' | 'email' | 'tel' | 'url'
  className?: string
  headerClassName?: string
  cellClassName?: string
}

export interface VirtualGridProps<T = any> {
  data: T[]
  columns: VirtualGridColumn<T>[]
  rowHeight?: number
  headerHeight?: number
  overscan?: number
  onRowClick?: (row: T, index: number) => void
  onCellUpdate?: (rowIndex: number, columnId: string, newValue: any) => Promise<void>
  onColumnsChange?: (columns: VirtualGridColumn<T>[]) => void
  selectable?: boolean
  selectedRows?: Set<string>
  onSelectionChange?: (selected: Set<string>) => void
  getRowId?: (row: T) => string
  className?: string
  sortBy?: { columnId: string; direction: 'asc' | 'desc' } | null
  onSortChange?: (sortBy: { columnId: string; direction: 'asc' | 'desc' } | null) => void
  enableColumnReordering?: boolean
  enableColumnResizing?: boolean
  enableColumnManagement?: boolean
}

interface SortableHeaderCellProps {
  column: VirtualGridColumn
  width: number
  onResize: (newWidth: number) => void
  sortDirection?: 'asc' | 'desc' | null
  onSort?: () => void
  resizable: boolean
}

function SortableHeaderCell({
  column,
  width,
  onResize,
  sortDirection,
  onSort,
  resizable,
}: SortableHeaderCellProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    disabled: column.locked,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: `${width}px`,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex-shrink-0 relative',
        isDragging && 'opacity-50 z-50'
      )}
    >
      <ResizableColumn
        width={width}
        minWidth={column.minWidth || 80}
        maxWidth={column.maxWidth || 600}
        onResize={onResize}
        resizable={resizable && (column.resizable ?? true)}
      >
        <div
          {...attributes}
          {...listeners}
          className={cn(
            'h-full px-4 py-2 font-medium text-sm border-b bg-muted/50 flex items-center justify-between gap-2',
            column.sortable && 'cursor-pointer hover:bg-muted',
            !column.locked && 'cursor-move',
            column.headerClassName
          )}
          onClick={column.sortable ? onSort : undefined}
        >
          <span className="truncate">{column.label}</span>
          {column.sortable && sortDirection && (
            <span className="flex-shrink-0">
              {sortDirection === 'asc' ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </span>
          )}
        </div>
      </ResizableColumn>
    </div>
  )
}

export function VirtualGrid<T extends Record<string, any>>({
  data,
  columns: initialColumns,
  rowHeight = 52,
  headerHeight = 40,
  overscan = 5,
  onRowClick,
  onCellUpdate,
  onColumnsChange,
  selectable = false,
  selectedRows = new Set(),
  onSelectionChange,
  getRowId = (row) => row.id,
  className,
  sortBy,
  onSortChange,
  enableColumnReordering = true,
  enableColumnResizing = true,
  enableColumnManagement = true,
}: VirtualGridProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState(initialColumns)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    return initialColumns.reduce((acc, col) => {
      acc[col.id] = col.width || 150
      return acc
    }, {} as Record<string, number>)
  })

  useEffect(() => {
    setColumns(initialColumns)
  }, [initialColumns])

  const visibleColumns = useMemo(
    () => columns.filter((col) => col.visible !== false),
    [columns]
  )

  const totalWidth = useMemo(
    () => visibleColumns.reduce((sum, col) => sum + (columnWidths[col.id] || col.width || 150), 0),
    [visibleColumns, columnWidths]
  )

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      if (over && active.id !== over.id) {
        setColumns((cols) => {
          const oldIndex = cols.findIndex((col) => col.id === active.id)
          const newIndex = cols.findIndex((col) => col.id === over.id)
          const newColumns = arrayMove(cols, oldIndex, newIndex)
          onColumnsChange?.(newColumns)
          return newColumns
        })
      }
    },
    [onColumnsChange]
  )

  const handleColumnResize = useCallback((columnId: string, newWidth: number) => {
    setColumnWidths((prev) => ({
      ...prev,
      [columnId]: newWidth,
    }))
  }, [])

  const handleSort = useCallback(
    (columnId: string) => {
      if (!onSortChange) return

      if (sortBy?.columnId === columnId) {
        if (sortBy.direction === 'asc') {
          onSortChange({ columnId, direction: 'desc' })
        } else {
          onSortChange(null)
        }
      } else {
        onSortChange({ columnId, direction: 'asc' })
      }
    },
    [sortBy, onSortChange]
  )

  const handleCellUpdate = useCallback(
    async (rowIndex: number, columnId: string, newValue: any) => {
      await onCellUpdate?.(rowIndex, columnId, newValue)
    },
    [onCellUpdate]
  )

  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return

    if (selectedRows.size === data.length) {
      onSelectionChange(new Set())
    } else {
      onSelectionChange(new Set(data.map((row) => getRowId(row))))
    }
  }, [selectedRows, data, onSelectionChange, getRowId])

  const handleSelectRow = useCallback(
    (rowId: string) => {
      if (!onSelectionChange) return

      const newSelected = new Set(selectedRows)
      if (newSelected.has(rowId)) {
        newSelected.delete(rowId)
      } else {
        newSelected.add(rowId)
      }
      onSelectionChange(newSelected)
    },
    [selectedRows, onSelectionChange]
  )

  const getCellValue = useCallback((row: T, column: VirtualGridColumn<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row)
    }
    return row[column.accessor]
  }, [])

  const handleColumnManagerChange = useCallback(
    (newColumns: ColumnConfig[]) => {
      const updatedColumns = columns.map((col) => {
        const config = newColumns.find((c) => c.id === col.id)
        if (config) {
          return {
            ...col,
            visible: config.visible,
            width: config.width,
          }
        }
        return col
      })

      const reorderedColumns = newColumns
        .map((config) => updatedColumns.find((col) => col.id === config.id))
        .filter(Boolean) as VirtualGridColumn<T>[]

      setColumns(reorderedColumns)
      onColumnsChange?.(reorderedColumns)

      const newWidths = newColumns.reduce((acc, col) => {
        acc[col.id] = col.width
        return acc
      }, {} as Record<string, number>)
      setColumnWidths(newWidths)
    },
    [columns, onColumnsChange]
  )

  const columnConfigs: ColumnConfig[] = useMemo(
    () =>
      columns.map((col) => ({
        id: col.id,
        label: col.label,
        width: columnWidths[col.id] || col.width || 150,
        visible: col.visible !== false,
        locked: col.locked,
        minWidth: col.minWidth,
        maxWidth: col.maxWidth,
      })),
    [columns, columnWidths]
  )

  const handleResetColumns = useCallback(() => {
    setColumns(initialColumns)
    const resetWidths = initialColumns.reduce((acc, col) => {
      acc[col.id] = col.width || 150
      return acc
    }, {} as Record<string, number>)
    setColumnWidths(resetWidths)
    onColumnsChange?.(initialColumns)
  }, [initialColumns, onColumnsChange])

  return (
    <div className={cn('flex flex-col h-full border rounded-lg', className)}>
      {enableColumnManagement && (
        <div className="flex items-center justify-between p-2 border-b bg-muted/30">
          <div className="text-sm text-muted-foreground">
            {data.length.toLocaleString()} ligne{data.length !== 1 ? 's' : ''}
            {selectable && selectedRows.size > 0 && (
              <span className="ml-2">
                ({selectedRows.size} sélectionnée{selectedRows.size !== 1 ? 's' : ''})
              </span>
            )}
          </div>
          <ColumnManager
            columns={columnConfigs}
            onColumnsChange={handleColumnManagerChange}
            onReset={handleResetColumns}
            trigger={
              <Button variant="outline" size="sm">
                <Settings2 className="h-4 w-4 mr-2" />
                Colonnes
              </Button>
            }
          />
        </div>
      )}

      <div
        ref={parentRef}
        className="flex-1 overflow-auto"
        style={{ height: '100%' }}
      >
        <div style={{ width: `${totalWidth + (selectable ? 40 : 0)}px` }}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div
              className="flex sticky top-0 z-10 bg-background"
              style={{ height: `${headerHeight}px` }}
            >
              {selectable && (
                <div
                  className="flex-shrink-0 flex items-center justify-center px-4 border-b bg-muted/50"
                  style={{ width: '40px' }}
                >
                  <Checkbox
                    checked={selectedRows.size === data.length && data.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </div>
              )}
              <SortableContext
                items={visibleColumns.map((col) => col.id)}
                strategy={horizontalListSortingStrategy}
                disabled={!enableColumnReordering}
              >
                {visibleColumns.map((column) => (
                  <SortableHeaderCell
                    key={column.id}
                    column={column}
                    width={columnWidths[column.id] || column.width || 150}
                    onResize={(newWidth) => handleColumnResize(column.id, newWidth)}
                    sortDirection={
                      sortBy?.columnId === column.id ? sortBy.direction : null
                    }
                    onSort={
                      column.sortable ? () => handleSort(column.id) : undefined
                    }
                    resizable={enableColumnResizing}
                  />
                ))}
              </SortableContext>
            </div>
          </DndContext>

          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = data[virtualRow.index]
              const rowId = getRowId(row)
              const isSelected = selectedRows.has(rowId)

              return (
                <div
                  key={virtualRow.index}
                  className={cn(
                    'absolute top-0 left-0 w-full flex border-b hover:bg-muted/50 transition-colors',
                    isSelected && 'bg-primary/5',
                    onRowClick && 'cursor-pointer'
                  )}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  onClick={() => onRowClick?.(row, virtualRow.index)}
                >
                  {selectable && (
                    <div
                      className="flex-shrink-0 flex items-center justify-center px-4"
                      style={{ width: '40px' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSelectRow(rowId)}
                      />
                    </div>
                  )}
                  {visibleColumns.map((column) => {
                    const value = getCellValue(row, column)
                    const width = columnWidths[column.id] || column.width || 150

                    return (
                      <div
                        key={column.id}
                        className={cn(
                          'flex-shrink-0 flex items-center px-4 py-2 overflow-hidden',
                          column.cellClassName
                        )}
                        style={{ width: `${width}px` }}
                        onClick={(e) => column.editable && e.stopPropagation()}
                      >
                        {column.editable ? (
                          <EditableCell
                            value={value}
                            onChange={(newValue) =>
                              handleCellUpdate(virtualRow.index, column.id, newValue)
                            }
                            format={column.format}
                            parse={column.parse}
                            validationSchema={column.validationSchema}
                            type={column.type}
                            className={cn('w-full', column.className)}
                          />
                        ) : (
                          <div className={cn('truncate', column.className)}>
                            {column.format ? column.format(value) : String(value ?? '')}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
