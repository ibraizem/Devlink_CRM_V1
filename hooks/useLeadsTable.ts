'use client';
import { useState, useMemo, useCallback } from 'react';
import { Lead } from '@/lib/types/leads';

type SortDirection = 'asc' | 'desc';

export function useLeadsTable<T extends Lead>(initialData: T[] = []) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<keyof T | ''>('');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Filter data based on search term
  const filtered = useMemo(() => {
    if (!search) return initialData;
    const searchLower = search.toLowerCase();
    return initialData.filter(item =>
      Object.values(item).some(
        value => String(value).toLowerCase().includes(searchLower)
      )
    );
  }, [initialData, search]);

  // Sort data
  const sorted = useMemo(() => {
    if (!sortKey) return [...filtered];
    
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      
      // Handle undefined/null values
      if (aVal == null) return sortDir === 'asc' ? -1 : 1;
      if (bVal == null) return sortDir === 'asc' ? 1 : -1;
      
      // Compare values
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return sorted.slice(start, end);
  }, [sorted, page, pageSize]);

  // Selection handling
  const toggleSelect = useCallback((id: string) => {
    setSelected(prev => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  }, []);

  const toggleSort = useCallback((key: keyof T) => {
    setSortKey(prevKey => {
      if (prevKey === key) {
        setSortDir((prevDir: SortDirection) => (prevDir === 'asc' ? 'desc' : 'asc'));
        return key;
      }
      setSortDir('asc');
      return key;
    });
  }, []);

  return {
    // Search
    search,
    setSearch,
    
    // Sorting
    sortKey,
    sortDir,
    toggleSort,
    
    // Selection
    selected,
    toggleSelect,
    setSelected,
    
    // Pagination
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    
    // Data
    data: paginated,
    allFiltered: filtered,
  };
}
