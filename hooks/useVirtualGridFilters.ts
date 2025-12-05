'use client'

import { useState, useMemo, useCallback } from 'react'
import { VirtualGridColumn } from '@/components/virtual'

export interface FilterCondition<T = any> {
  id: string
  columnId: string
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte' | 'isEmpty' | 'isNotEmpty'
  value: any
  active: boolean
}

export interface UseVirtualGridFiltersOptions<T> {
  data: T[]
  columns: VirtualGridColumn<T>[]
  searchableColumns?: string[]
}

export function useVirtualGridFilters<T extends Record<string, any>>({
  data,
  columns,
  searchableColumns,
}: UseVirtualGridFiltersOptions<T>) {
  const [searchValue, setSearchValue] = useState('')
  const [filters, setFilters] = useState<FilterCondition[]>([])

  const searchColumns = useMemo(() => {
    if (searchableColumns) {
      return columns.filter((col) => searchableColumns.includes(col.id))
    }
    return columns
  }, [columns, searchableColumns])

  const getColumnValue = useCallback(
    (row: T, column: VirtualGridColumn<T>) => {
      if (typeof column.accessor === 'function') {
        return column.accessor(row)
      }
      return row[column.accessor]
    },
    []
  )

  const matchesFilter = useCallback(
    (value: any, filter: FilterCondition): boolean => {
      const strValue = String(value ?? '').toLowerCase()
      const filterValue = String(filter.value ?? '').toLowerCase()

      switch (filter.operator) {
        case 'equals':
          return strValue === filterValue
        case 'contains':
          return strValue.includes(filterValue)
        case 'startsWith':
          return strValue.startsWith(filterValue)
        case 'endsWith':
          return strValue.endsWith(filterValue)
        case 'gt':
          return Number(value) > Number(filter.value)
        case 'lt':
          return Number(value) < Number(filter.value)
        case 'gte':
          return Number(value) >= Number(filter.value)
        case 'lte':
          return Number(value) <= Number(filter.value)
        case 'isEmpty':
          return value == null || strValue === ''
        case 'isNotEmpty':
          return value != null && strValue !== ''
        default:
          return true
      }
    },
    []
  )

  const filteredData = useMemo(() => {
    let result = data

    if (searchValue) {
      const search = searchValue.toLowerCase()
      result = result.filter((row) =>
        searchColumns.some((column) => {
          const value = getColumnValue(row, column)
          return String(value ?? '').toLowerCase().includes(search)
        })
      )
    }

    const activeFilters = filters.filter((f) => f.active)
    if (activeFilters.length > 0) {
      result = result.filter((row) =>
        activeFilters.every((filter) => {
          const column = columns.find((col) => col.id === filter.columnId)
          if (!column) return true
          const value = getColumnValue(row, column)
          return matchesFilter(value, filter)
        })
      )
    }

    return result
  }, [data, searchValue, filters, searchColumns, columns, getColumnValue, matchesFilter])

  const addFilter = useCallback((filter: Omit<FilterCondition, 'id' | 'active'>) => {
    setFilters((prev) => [
      ...prev,
      {
        ...filter,
        id: `filter-${Date.now()}-${Math.random()}`,
        active: true,
      },
    ])
  }, [])

  const removeFilter = useCallback((filterId: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== filterId))
  }, [])

  const toggleFilter = useCallback((filterId: string) => {
    setFilters((prev) =>
      prev.map((f) => (f.id === filterId ? { ...f, active: !f.active } : f))
    )
  }, [])

  const clearFilters = useCallback(() => {
    setFilters([])
  }, [])

  const clearSearch = useCallback(() => {
    setSearchValue('')
  }, [])

  const clearAll = useCallback(() => {
    setSearchValue('')
    setFilters([])
  }, [])

  const activeFilterCount = useMemo(
    () => filters.filter((f) => f.active).length,
    [filters]
  )

  return {
    searchValue,
    setSearchValue,
    filters,
    filteredData,
    addFilter,
    removeFilter,
    toggleFilter,
    clearFilters,
    clearSearch,
    clearAll,
    activeFilterCount,
    hasActiveFilters: activeFilterCount > 0 || searchValue !== '',
  }
}
