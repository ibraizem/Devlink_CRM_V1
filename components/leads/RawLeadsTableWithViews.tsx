'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import { Table, TableBody } from '@/components/ui/table';
import { LeadsTableHeader } from './LeadsTableHeader';
import { LeadsTableToolbar } from './LeadsTableToolbar';
import { LeadsTableRow } from './LeadsTableRow';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination';
import { toast } from 'sonner';
import { ColumnDefinition, Lead, ColumnConfig } from '@/types/leads';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, SearchX, Settings2 } from 'lucide-react';
import { NoteModal } from './NoteModal';
import { EditLeadDrawer } from './EditLeadDrawer';
import { leadService } from '@/lib/services/leadService';
import { useLeadViews } from '@/hooks/useLeadViews';
import { ViewManager } from './ViewManager';
import { AdvancedViewDialog } from './AdvancedViewDialog';
import { ViewConfigPanel } from './ViewConfigPanel';
import { applyFilters, applySorts, getVisibleColumns } from '@/lib/utils/viewFilters';
import { useUser } from '@clerk/nextjs';

interface RawLeadsTableWithViewsProps<T extends Lead> {
  data: T[];
  columns: Array<ColumnDefinition<T>>;
  onExport: (selectedIds: string[]) => void;
  onRefresh?: () => void;
}

const getLeadName = (lead: Lead) =>
  lead.nom || lead.name || lead.prenom || lead.email || 'Contact inconnu';

export function RawLeadsTableWithViews<T extends Lead>({
  data,
  columns: initialColumns,
  onExport,
  onRefresh,
}: RawLeadsTableWithViewsProps<T>) {
  const { user } = useUser();
  const [leadToNote, setLeadToNote] = useState<T | null>(null);
  const [leadToEdit, setLeadToEdit] = useState<T | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<keyof T | ''>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [advancedDialogOpen, setAdvancedDialogOpen] = useState(false);

  const {
    userViews,
    sharedViews,
    templateViews,
    currentView,
    loading: viewsLoading,
    createView,
    updateView,
    deleteView,
    duplicateView,
    shareViewWithTeam,
    applyView,
    createFromTemplate,
  } = useLeadViews(user?.id || null);

  const [tempColumns, setTempColumns] = useState<ColumnConfig[]>([]);
  const [tempFilters, setTempFilters] = useState(currentView?.filters || []);
  const [tempSorts, setTempSorts] = useState(currentView?.sorts || []);

  useEffect(() => {
    if (currentView) {
      setTempColumns(currentView.columns);
      setTempFilters(currentView.filters);
      setTempSorts(currentView.sorts);
    } else {
      setTempColumns([]);
      setTempFilters([]);
      setTempSorts([]);
    }
  }, [currentView]);

  const columnOptions = useMemo(() => {
    return initialColumns.map((col) => ({
      key: String(col.key),
      label: col.label || String(col.key)
    }));
  }, [initialColumns]);

  const filteredData = useMemo(() => {
    let result = [...data];

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(item =>
        Object.values(item).some(
          value => String(value).toLowerCase().includes(searchLower)
        )
      );
    }

    if (currentView && currentView.filters.length > 0) {
      result = applyFilters(result, currentView.filters);
    }

    return result;
  }, [data, search, currentView]);

  const sortedData = useMemo(() => {
    let result = [...filteredData];

    if (currentView && currentView.sorts.length > 0) {
      result = applySorts(result, currentView.sorts);
    } else if (sortKey) {
      result.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        
        if (aVal == null) return sortDir === 'asc' ? -1 : 1;
        if (bVal == null) return sortDir === 'asc' ? 1 : -1;
        
        if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [filteredData, sortKey, sortDir, currentView]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, page, pageSize]);

  const visibleColumnsData = useMemo(() => {
    if (currentView && currentView.columns.length > 0) {
      const visibleCols = getVisibleColumns(columnOptions, currentView.columns);
      return initialColumns.filter(col => 
        visibleCols.some(vc => vc.key === String(col.key))
      );
    }
    return initialColumns;
  }, [initialColumns, currentView, columnOptions]);

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

  const toggleSelect = useCallback((id: string) => {
    setSelected(prev => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  }, []);

  const handleCall = useCallback((lead: T) => {
    const name = getLeadName(lead);
    toast.info(`📞 Appel de ${name}...`);
  }, []);

  const handleNote = useCallback((lead: T) => setLeadToNote(lead), []);
  const handleEdit = useCallback((lead: T) => setLeadToEdit(lead), []);

  const handleDelete = useCallback(
    async (lead: T) => {
      const name = getLeadName(lead);
      if (!confirm(`Supprimer ${name} ?`)) return;

      try {
        await leadService.deleteLead(lead.id);
        toast.success(`✅ Lead ${name} supprimé`);
        onRefresh?.();
      } catch (error) {
        console.error('Erreur suppression lead:', error);
        toast.error(`❌ Erreur lors de la suppression de ${name}`);
      }
    },
    [onRefresh]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(Math.max(1, Math.min(totalPages, newPage)));
    },
    [totalPages]
  );

  const handleExport = useCallback(() => {
    onExport(Array.from(selected));
  }, [onExport, selected]);

  const handleSaveCurrentView = useCallback(async () => {
    if (!currentView?.id) return;

    try {
      await updateView(currentView.id, {
        columns: tempColumns,
        filters: tempFilters,
        sorts: tempSorts,
      });
      setShowConfigPanel(false);
    } catch (error) {
      console.error('Error saving view:', error);
    }
  }, [currentView, tempColumns, tempFilters, tempSorts, updateView]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <LeadsTableToolbar
          search={search}
          setSearch={setSearch}
          selectedCount={selected.size}
          onExport={handleExport}
          onColumnsClick={() => setShowConfigPanel(!showConfigPanel)}
          onRefresh={onRefresh}
          className="flex-1"
        />
        
        <div className="flex items-center gap-2">
          {currentView && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfigPanel(!showConfigPanel)}
            >
              <Settings2 className="h-4 w-4 mr-2" />
              Configurer
            </Button>
          )}
          
          <ViewManager
            userViews={userViews}
            sharedViews={sharedViews}
            templateViews={templateViews}
            currentView={currentView}
            onCreateView={createView}
            onUpdateView={updateView}
            onDeleteView={deleteView}
            onDuplicateView={duplicateView}
            onShareView={shareViewWithTeam}
            onApplyView={applyView}
            onCreateFromTemplate={createFromTemplate}
          />
          
          <Button
            variant="default"
            size="sm"
            onClick={() => setAdvancedDialogOpen(true)}
          >
            Créer une vue
          </Button>
        </div>
      </div>

      {showConfigPanel && currentView && (
        <ViewConfigPanel
          columns={tempColumns}
          filters={tempFilters}
          sorts={tempSorts}
          availableFields={columnOptions}
          onColumnsChange={setTempColumns}
          onFiltersChange={setTempFilters}
          onSortsChange={setTempSorts}
          onSave={handleSaveCurrentView}
          onClose={() => setShowConfigPanel(false)}
        />
      )}

      <Table>
        <thead>
          <LeadsTableHeader
            columns={visibleColumnsData}
            sortKey={sortKey as string}
            sortDir={sortDir}
            onSort={toggleSort}
          />
        </thead>
        <TableBody>
          {paginatedData.length > 0 ? (
            paginatedData.map((row: T) => (
              <LeadsTableRow<T>
                key={row.id}
                row={row}
                isSelected={selected.has(row.id)}
                onSelect={toggleSelect}
                columns={visibleColumnsData}
                onActions={{
                  call: handleCall,
                  note: handleNote,
                  edit: handleEdit,
                  delete: handleDelete,
                }}
              />
            ))
          ) : (
            <tr>
              <td colSpan={visibleColumnsData.length + 1} className="text-center py-10 text-muted-foreground">
                <div className="flex flex-col items-center justify-center">
                  <SearchX className="h-6 w-6 mb-2 opacity-50" />
                  Aucun lead ne correspond à votre recherche.
                </div>
              </td>
            </tr>
          )}
        </TableBody>
      </Table>

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

      {user && (
        <AdvancedViewDialog
          open={advancedDialogOpen}
          onOpenChange={setAdvancedDialogOpen}
          availableFields={columnOptions}
          onCreate={createView}
          userId={user.id}
        />
      )}
    </div>
  );
}
