'use client';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Lead, SortDirection } from '@/types/leads';

export function useLeadsTable<T extends Lead>(initialData: T[] = []) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<keyof T | ''>('');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

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
      
      if (aVal == null) return sortDir === 'asc' ? -1 : 1;
      if (bVal == null) return sortDir === 'asc' ? 1 : -1;
      
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

  // Selection handling avec support shift et ctrl
  const toggleSelect = useCallback((id: string, index?: number, event?: { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean }) => {
    setSelected(prev => {
      const newSet = new Set(prev);
      const isCtrlOrMeta = event?.ctrlKey || event?.metaKey;
      
      // Shift-click pour sélection en plage
      if (event?.shiftKey && lastSelectedIndex !== null && index !== undefined) {
        const currentPageData = paginated;
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        
        for (let i = start; i <= end; i++) {
          if (currentPageData[i]) {
            newSet.add(currentPageData[i].id);
          }
        }
        return newSet;
      }
      
      // Ctrl/Cmd-click ou click normal
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      
      if (index !== undefined) {
        setLastSelectedIndex(index);
      }
      
      return newSet;
    });
  }, [lastSelectedIndex, paginated]);

  // Sélectionner/désélectionner toutes les lignes de la page courante
  const toggleSelectAll = useCallback((checked: boolean) => {
    setSelected(prev => {
      const newSet = new Set(prev);
      if (checked) {
        paginated.forEach(item => newSet.add(item.id));
      } else {
        paginated.forEach(item => newSet.delete(item.id));
      }
      return newSet;
    });
  }, [paginated]);

  // Sélectionner toutes les lignes (toutes les pages)
  const selectAllPages = useCallback(() => {
    setSelected(new Set(sorted.map(item => item.id)));
  }, [sorted]);

  // Désélectionner toutes les lignes
  const clearSelection = useCallback(() => {
    setSelected(new Set());
    setLastSelectedIndex(null);
  }, []);

  // Vérifier si toutes les lignes de la page sont sélectionnées
  const isAllPageSelected = useMemo(() => {
    return paginated.length > 0 && paginated.every(item => selected.has(item.id));
  }, [paginated, selected]);

  // Vérifier si certaines lignes (mais pas toutes) sont sélectionnées
  const isSomePageSelected = useMemo(() => {
    return paginated.some(item => selected.has(item.id)) && !isAllPageSelected;
  }, [paginated, selected, isAllPageSelected]);

  const toggleSort = useCallback((key: keyof T) => {
    setSortKey(prevKey => {
      if (prevKey === key) {
        setSortDir(prevDir => (prevDir === 'asc' ? 'desc' : 'asc'));
        return key;
      }
      setSortDir('asc');
      return key;
    });
  }, []);

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+A ou Cmd+A pour tout sélectionner
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !e.shiftKey) {
        const activeElement = document.activeElement;
        const isInputFocused = activeElement?.tagName === 'INPUT' || 
                              activeElement?.tagName === 'TEXTAREA' ||
                              activeElement?.getAttribute('contenteditable') === 'true';
        
        if (!isInputFocused && sorted.length > 0) {
          e.preventDefault();
          setSelected(new Set(sorted.map(item => item.id)));
        }
      }
      
      // Escape pour désélectionner
      if (e.key === 'Escape' && selected.size > 0) {
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sorted, selected.size, clearSelection]);

  return {
    search,
    setSearch,
    sortKey,
    sortDir,
    toggleSort,
    selected,
    toggleSelect,
    toggleSelectAll,
    selectAllPages,
    clearSelection,
    setSelected,
    isAllPageSelected,
    isSomePageSelected,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    data: paginated,
    allFiltered: filtered,
    allSorted: sorted,
  };
}
