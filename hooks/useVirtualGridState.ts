'use client'

import { useState, useCallback, useMemo } from 'react'
import { VirtualGridColumn } from '@/components/virtual'

export interface UseVirtualGridStateOptions<T> {
  initialColumns: VirtualGridColumn<T>[]
  data: T[]
  getRowId?: (row: T) => string
  onDataChange?: (data: T[]) => void
}

export function useVirtualGridState<T extends Record<string, any>>({
  initialColumns,
  data,
  getRowId = (row) => row.id,
  onDataChange,
}: UseVirtualGridStateOptions<T>) {
  const [columns, setColumns] = useState(initialColumns)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<{ columnId: string; direction: 'asc' | 'desc' } | null>(null)

  const sortedData = useMemo(() => {
    if (!sortBy) return data

    const column = columns.find((col) => col.id === sortBy.columnId)
    if (!column) return data

    return [...data].sort((a, b) => {
      const aValue = typeof column.accessor === 'function' 
        ? column.accessor(a) 
        : a[column.accessor]
      const bValue = typeof column.accessor === 'function'
        ? column.accessor(b)
        : b[column.accessor]

      if (aValue == null && bValue == null) return 0
      if (aValue == null) return sortBy.direction === 'asc' ? 1 : -1
      if (bValue == null) return sortBy.direction === 'asc' ? -1 : 1

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      return sortBy.direction === 'asc' ? comparison : -comparison
    })
  }, [data, sortBy, columns])

  const handleCellUpdate = useCallback(
    async (rowIndex: number, columnId: string, newValue: any) => {
      const column = columns.find((col) => col.id === columnId)
      if (!column) return

      const updatedData = [...data]
      const row = updatedData[rowIndex]

      if (typeof column.accessor === 'string') {
        (row as any)[column.accessor] = newValue
      }

      onDataChange?.(updatedData)
    },
    [columns, data, onDataChange]
  )

  const handleColumnsChange = useCallback((newColumns: VirtualGridColumn<T>[]) => {
    setColumns(newColumns)
  }, [])

  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedRows(newSelection)
  }, [])

  const handleSortChange = useCallback(
    (newSort: { columnId: string; direction: 'asc' | 'desc' } | null) => {
      setSortBy(newSort)
    },
    []
  )

  const clearSelection = useCallback(() => {
    setSelectedRows(new Set())
  }, [])

  const selectAll = useCallback(() => {
    setSelectedRows(new Set(data.map((row) => getRowId(row))))
  }, [data, getRowId])

  const getSelectedData = useCallback(() => {
    return data.filter((row) => selectedRows.has(getRowId(row)))
  }, [data, selectedRows, getRowId])

  return {
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
  }
}
