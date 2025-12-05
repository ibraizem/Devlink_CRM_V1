'use client'

import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { VirtualGridColumnFull } from '@/types/virtual-grid'

interface VirtualGridContextValue<T = any> {
  columns: VirtualGridColumnFull<T>[]
  setColumns: (columns: VirtualGridColumnFull<T>[]) => void
  selectedRows: Set<string>
  setSelectedRows: (rows: Set<string>) => void
  sortBy: { columnId: string; direction: 'asc' | 'desc' } | null
  setSortBy: (sort: { columnId: string; direction: 'asc' | 'desc' } | null) => void
  searchValue: string
  setSearchValue: (value: string) => void
  registerColumn: (column: VirtualGridColumnFull<T>) => void
  unregisterColumn: (columnId: string) => void
  updateColumn: (columnId: string, updates: Partial<VirtualGridColumnFull<T>>) => void
  toggleColumnVisibility: (columnId: string) => void
  resizeColumn: (columnId: string, width: number) => void
  reorderColumns: (fromIndex: number, toIndex: number) => void
}

const VirtualGridContext = createContext<VirtualGridContextValue | null>(null)

export function useVirtualGridContext<T = any>() {
  const context = useContext(VirtualGridContext) as VirtualGridContextValue<T> | null
  if (!context) {
    throw new Error('useVirtualGridContext must be used within VirtualGridProvider')
  }
  return context
}

interface VirtualGridProviderProps<T = any> {
  children: React.ReactNode
  initialColumns?: VirtualGridColumnFull<T>[]
  initialSelectedRows?: Set<string>
}

export function VirtualGridProvider<T = any>({
  children,
  initialColumns = [],
  initialSelectedRows = new Set(),
}: VirtualGridProviderProps<T>) {
  const [columns, setColumns] = useState<VirtualGridColumnFull<T>[]>(initialColumns)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(initialSelectedRows)
  const [sortBy, setSortBy] = useState<{ columnId: string; direction: 'asc' | 'desc' } | null>(null)
  const [searchValue, setSearchValue] = useState('')

  const registerColumn = useCallback((column: VirtualGridColumnFull<T>) => {
    setColumns((prev) => {
      const exists = prev.some((col) => col.id === column.id)
      if (exists) return prev
      return [...prev, column]
    })
  }, [])

  const unregisterColumn = useCallback((columnId: string) => {
    setColumns((prev) => prev.filter((col) => col.id !== columnId))
  }, [])

  const updateColumn = useCallback(
    (columnId: string, updates: Partial<VirtualGridColumnFull<T>>) => {
      setColumns((prev) =>
        prev.map((col) =>
          col.id === columnId ? { ...col, ...updates } : col
        )
      )
    },
    []
  )

  const toggleColumnVisibility = useCallback((columnId: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    )
  }, [])

  const resizeColumn = useCallback((columnId: string, width: number) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, width } : col
      )
    )
  }, [])

  const reorderColumns = useCallback((fromIndex: number, toIndex: number) => {
    setColumns((prev) => {
      const newColumns = [...prev]
      const [removed] = newColumns.splice(fromIndex, 1)
      newColumns.splice(toIndex, 0, removed)
      return newColumns
    })
  }, [])

  const value = useMemo(
    () => ({
      columns,
      setColumns,
      selectedRows,
      setSelectedRows,
      sortBy,
      setSortBy,
      searchValue,
      setSearchValue,
      registerColumn,
      unregisterColumn,
      updateColumn,
      toggleColumnVisibility,
      resizeColumn,
      reorderColumns,
    }),
    [
      columns,
      selectedRows,
      sortBy,
      searchValue,
      registerColumn,
      unregisterColumn,
      updateColumn,
      toggleColumnVisibility,
      resizeColumn,
      reorderColumns,
    ]
  )

  return (
    <VirtualGridContext.Provider value={value}>
      {children}
    </VirtualGridContext.Provider>
  )
}
