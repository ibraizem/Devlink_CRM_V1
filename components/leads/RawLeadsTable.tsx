'use client';

import { useCallback, useMemo, useState } from 'react';
import { Table, TableBody } from '@/components/ui/table';
import { LeadsTableHeader } from './LeadsTableHeader';
import { LeadsTableToolbar } from './LeadsTableToolbar';
import { LeadsTableRow } from './LeadsTableRow';
import { useLeadsTable } from '@/hooks/useLeadsTable';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination';
import { toast } from 'sonner';
import { ColumnDefinition, Lead } from '@/lib/types/leads';
import { Button } from '@/components/ui/button';
import { ColumnSelector } from './ColumnSelector';
import { ChevronLeft, ChevronRight, SearchX } from 'lucide-react';
import { NoteModal } from './NoteModal';
import { EditLeadDrawer } from './EditLeadDrawer';
import { leadService } from '@/lib/services/leadService';

// --- types ---
interface RawLeadsTableProps<T extends Lead> {
  data: T[];
  columns: Array<ColumnDefinition<T>>;
  onExport: (selectedIds: string[]) => void;
  onRefresh?: () => void;
}

// --- helpers ---
const getLeadName = (lead: Lead) =>
  lead.nom || lead.name || lead.prenom || lead.email || 'Contact inconnu';

export function RawLeadsTable<T extends Lead>({
  data,
  columns: initialColumns,
  onExport,
  onRefresh,
}: RawLeadsTableProps<T>) {
  // États pour la gestion des modales
  const [leadToNote, setLeadToNote] = useState<T | null>(null);
  const [leadToEdit, setLeadToEdit] = useState<T | null>(null);
  
  // Préparer les colonnes pour le sélecteur
  const columnOptions = useMemo(() => {
    return initialColumns.map((col) => ({
      key: String(col.key),
      label: col.header || String(col.key)
    }));
  }, [initialColumns]);
  
  // Colonnes essentielles qui doivent toujours être visibles
  const essentialColumns = ['name', 'firstname', 'phone', 'email', 'company'];
  
  // Fonction pour s'assurer qu'il y a toujours au moins 3 colonnes visibles
  const getSafeVisibleColumns = useCallback((cols: string[]) => {
    // Si moins de 3 colonnes sont sélectionnées, on ajoute les colonnes essentielles manquantes
    if (cols.length < 3) {
      const missingColumns = essentialColumns
        .filter(col => !cols.includes(col) && columnOptions.some(c => c.key === col))
        .slice(0, 3 - cols.length);
      return Array.from(new Set([...cols, ...missingColumns]));
    }
    return cols;
  }, [columnOptions, essentialColumns]);
  
  // État pour les colonnes visibles
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => 
    getSafeVisibleColumns(columnOptions.slice(0, 3).map(col => col.key))
  );
  
  // Mise à jour des colonnes visibles avec vérification du nombre minimum
  const handleVisibleColumnsChange = useCallback((columns: string[]) => {
    setVisibleColumns(getSafeVisibleColumns(columns));
  }, [getSafeVisibleColumns]);
  
  // Utilisation du hook useLeadsTable pour la gestion du tableau
  const {
    search,
    setSearch,
    sortKey,
    sortDir,
    toggleSort,
    selected,
    toggleSelect,
    page,
    setPage,
    totalPages,
    data: paginated,
  } = useLeadsTable<T>(data);
  
  // Filtrer les colonnes visibles
  const visibleColumnsData = useMemo(() => {
    return initialColumns.filter(col => visibleColumns.includes(String(col.key)));
  }, [initialColumns, visibleColumns]);

  // --- ACTIONS ---
  const handleCall = useCallback((lead: T) => {
    const name = getLeadName(lead);
    toast.info(`📞 Appel de ${name}...`);
    // TODO: déclencher module VOIP interne
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

  // --- PAGINATION ---
  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(Math.max(1, Math.min(totalPages, newPage)));
    },
    [setPage, totalPages]
  );

  // --- RENDER ---
  // Gestion de l'export
  const handleExport = useCallback(() => {
    onExport(Array.from(selected));
  }, [onExport, selected]);

  // Gestion de l'ouverture du sélecteur de colonnes
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  const toggleColumnSelector = useCallback(() => {
    setIsColumnSelectorOpen(prev => !prev);
  }, []);

  // Gestion du rafraîchissement
  const handleRefresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  return (
    <div className="space-y-4">
      {/* Barre d'outils */}
      <LeadsTableToolbar
        search={search}
        setSearch={setSearch}
        selectedCount={selected.size}
        onExport={handleExport}
        onColumnsClick={toggleColumnSelector}
        onRefresh={onRefresh ? handleRefresh : undefined}
        columns={columnOptions}
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={setVisibleColumns}
      />
      
      {/* Sélecteur de colonnes (affiché/masqué via l'état) */}
      {isColumnSelectorOpen && (
        <div className="bg-card p-4 rounded-lg border">
          <ColumnSelector
            columns={columnOptions}
            visibleColumns={visibleColumns}
            onVisibleColumnsChange={handleVisibleColumnsChange}
          />
        </div>
      )}

      {/* Tableau */}
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
          {paginated.length > 0 ? (
            paginated.map((row: T, index: number) => {
              // Créer un ID unique pour chaque ligne en combinant l'ID existant avec l'index
              // Cela garantit que même si l'ID est manquant ou en double, la clé sera unique
              const uniqueKey = row?.id ? `${row.id}_${index}` : `row_${index}`;
              
              return (
                <LeadsTableRow<T>
                  key={uniqueKey}
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
              );
            })
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

      {/* Pagination */}
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

      {/* Modales / Drawers */}
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
    </div>
  );
}
