import { useState, useCallback, useEffect, useMemo } from 'react'
import { Lead } from '@/types/leads'

export interface AdvancedTableFilters {
  columnFilters: Record<string, string[]>
  search: string
  dateRange?: {
    from: string
    to: string
  }
}

export function useAdvancedTableInteractions<T extends Lead>(data: T[]) {
  const [filters, setFilters] = useState<AdvancedTableFilters>({
    columnFilters: {},
    search: ''
  })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<keyof T | ''>('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const filteredData = useMemo(() => {
    let result = [...data]

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchLower)
        )
      )
    }

    if (Object.keys(filters.columnFilters).length > 0) {
      result = result.filter(item =>
        Object.entries(filters.columnFilters).every(([key, values]) => {
          if (values.length === 0) return true
          const itemValue = String(item[key as keyof T] || '')
          return values.includes(itemValue)
        })
      )
    }

    if (sortKey) {
      result.sort((a, b) => {
        const aVal = a[sortKey]
        const bVal = b[sortKey]
        
        if (aVal === bVal) return 0
        
        const comparison = aVal < bVal ? -1 : 1
        return sortDir === 'asc' ? comparison : -comparison
      })
    }

    return result
  }, [data, filters, sortKey, sortDir])

  const toggleSort = useCallback((key: keyof T) => {
    setSortDir(prev => 
      sortKey === key ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'
    )
    setSortKey(key)
  }, [sortKey])

  const toggleSelect = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelected(new Set(filteredData.map(item => item.id)))
  }, [filteredData])

  const clearSelection = useCallback(() => {
    setSelected(new Set())
  }, [])

  const updateColumnFilter = useCallback((column: string, values: string[]) => {
    setFilters(prev => ({
      ...prev,
      columnFilters: {
        ...prev.columnFilters,
        [column]: values
      }
    }))
  }, [])

  const clearColumnFilter = useCallback((column: string) => {
    setFilters(prev => {
      const { [column]: _, ...rest } = prev.columnFilters
      return {
        ...prev,
        columnFilters: rest
      }
    })
  }, [])

  const clearAllFilters = useCallback(() => {
    setFilters({
      columnFilters: {},
      search: ''
    })
  }, [])

  const updateSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }))
  }, [])

  return {
    filteredData,
    filters,
    selected,
    sortKey,
    sortDir,
    toggleSort,
    toggleSelect,
    selectAll,
    clearSelection,
    updateColumnFilter,
    clearColumnFilter,
    clearAllFilters,
    updateSearch,
    setFilters
  }
}
