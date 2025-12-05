'use client';

import { useCallback, useMemo, useState } from 'react';
import { Table, TableBody } from '@/components/ui/table';
import { LeadsTableHeader } from './LeadsTableHeader';
import { LeadsTableToolbar } from './LeadsTableToolbar';
import { LeadsTableRow } from './LeadsTableRow';
import { BulkActionsBar } from './BulkActionsBar';
import { useLeadsTable } from '@/hooks/useLeadsTable';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination';
import { toast } from 'sonner';
import { ColumnDefinition, Lead } from '@/types/leads';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ColumnSelector } from './ColumnSelector';
import { ChevronLeft, ChevronRight, SearchX, Download } from 'lucide-react';
import { NoteModal } from './NoteModal';
import { EditLeadDrawer } from './EditLeadDrawer';
import { BulkAssignModal } from './BulkAssignModal';
import { BulkEmailModal } from './BulkEmailModal';
import { BulkSmsModal } from './BulkSmsModal';
import { BulkDeleteConfirmDialog } from './BulkDeleteConfirmDialog';
import { BulkActionProgress } from './BulkActionProgress';
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
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
  const [showBulkSmsModal, setShowBulkSmsModal] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  
  // États pour la progression des actions groupées
  const [bulkActionProgress, setBulkActionProgress] = useState<{
    show: boolean;
    action: string;
    current: number;
    total: number;
    status: 'processing' | 'success' | 'error';
    message?: string;
  }>({
    show: false,
    action: '',
    current: 0,
    total: 0,
    status: 'processing',
  });
  
  // Préparer les colonnes pour le sélecteur
  const columnOptions = useMemo(() => {
    return initialColumns.map((col) => ({
      key: String(col.key),
      label: col.label || String(col.key)
    }));
  }, [initialColumns]);
  
  // Fonction pour s'assurer qu'il y a toujours au moins 3 colonnes visibles
  const getSafeVisibleColumns = useCallback((cols: string[]) => {
    // Colonnes essentielles qui doivent toujours être visibles
    const essentialColumns = ['name', 'firstname', 'phone', 'email', 'company'];
    // Si moins de 3 colonnes sont sélectionnées, on ajoute les colonnes essentielles manquantes
    if (cols.length < 3) {
      const missingColumns = essentialColumns
        .filter(col => !cols.includes(col) && columnOptions.some(c => c.key === col))
        .slice(0, 3 - cols.length);
      return Array.from(new Set([...cols, ...missingColumns]));
    }
    return cols;
  }, [columnOptions]);
  
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
    toggleSelectAll,
    selectAllPages,
    clearSelection,
    isAllPageSelected,
    isSomePageSelected,
    page,
    setPage,
    totalPages,
    data: paginated,
    allSorted,
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

  // Gestion des actions groupées
  const handleBulkDeleteClick = useCallback(() => {
    setShowBulkDeleteConfirm(true);
  }, []);

  const handleBulkDeleteConfirm = useCallback(async () => {
    const selectedIds = Array.from(selected);

    setBulkActionProgress({
      show: true,
      action: 'Suppression des leads',
      current: 0,
      total: selectedIds.length,
      status: 'processing',
    });

    try {
      const result = await leadService.deleteMultipleLeads(
        selectedIds,
        (current, total) => {
          setBulkActionProgress(prev => ({
            ...prev,
            current,
            total,
          }));
        }
      );

      setBulkActionProgress(prev => ({
        ...prev,
        status: 'success',
        message: `${result.success} supprimé(s), ${result.failed} échec(s)`,
      }));

      setTimeout(() => {
        setBulkActionProgress(prev => ({ ...prev, show: false }));
      }, 2000);

      toast.success(`✅ ${result.success} lead(s) supprimé(s)`);
      if (result.failed > 0) {
        toast.warning(`⚠️ ${result.failed} lead(s) n'ont pas pu être supprimés`);
      }
      
      clearSelection();
      onRefresh?.();
    } catch (error) {
      console.error('Erreur suppression groupée:', error);
      setBulkActionProgress(prev => ({
        ...prev,
        status: 'error',
        message: 'Erreur lors de la suppression',
      }));
      setTimeout(() => {
        setBulkActionProgress(prev => ({ ...prev, show: false }));
      }, 3000);
      toast.error('❌ Erreur lors de la suppression');
    }
  }, [selected, clearSelection, onRefresh]);

  const handleBulkStatusChange = useCallback(async (status: string) => {
    const selectedIds = Array.from(selected);
    
    setBulkActionProgress({
      show: true,
      action: 'Mise à jour du statut',
      current: 0,
      total: selectedIds.length,
      status: 'processing',
    });

    try {
      const result = await leadService.updateMultipleLeadsStatus(
        selectedIds,
        status as any,
        (current, total) => {
          setBulkActionProgress(prev => ({
            ...prev,
            current,
            total,
          }));
        }
      );

      setBulkActionProgress(prev => ({
        ...prev,
        status: 'success',
        message: `${result.success} mis à jour, ${result.failed} échec(s)`,
      }));

      setTimeout(() => {
        setBulkActionProgress(prev => ({ ...prev, show: false }));
      }, 2000);

      toast.success(`✅ Statut mis à jour pour ${result.success} lead(s)`);
      if (result.failed > 0) {
        toast.warning(`⚠️ ${result.failed} lead(s) n'ont pas pu être mis à jour`);
      }
      
      onRefresh?.();
    } catch (error) {
      console.error('Erreur changement statut groupé:', error);
      setBulkActionProgress(prev => ({
        ...prev,
        status: 'error',
        message: 'Erreur lors de la mise à jour',
      }));
      setTimeout(() => {
        setBulkActionProgress(prev => ({ ...prev, show: false }));
      }, 3000);
      toast.error('❌ Erreur lors de la mise à jour du statut');
    }
  }, [selected, onRefresh]);

  const handleBulkEmail = useCallback(() => {
    setShowBulkEmailModal(true);
  }, []);

  const handleBulkSms = useCallback(() => {
    setShowBulkSmsModal(true);
  }, []);

  const handleBulkAssign = useCallback(() => {
    setShowBulkAssignModal(true);
  }, []);

  const handleBulkEmailSend = useCallback(async (subject: string, message: string) => {
    const selectedIds = Array.from(selected);
    console.log('Envoi email groupé:', { selectedIds, subject, message });
  }, [selected]);

  const handleBulkSmsSend = useCallback(async (message: string) => {
    const selectedIds = Array.from(selected);
    console.log('Envoi SMS groupé:', { selectedIds, message });
  }, [selected]);

  const handleBulkAssignUser = useCallback(async (userId: string) => {
    const selectedIds = Array.from(selected);
    
    setBulkActionProgress({
      show: true,
      action: 'Attribution des leads',
      current: 0,
      total: selectedIds.length,
      status: 'processing',
    });

    try {
      const result = await leadService.assignMultipleLeads(
        selectedIds,
        userId,
        (current, total) => {
          setBulkActionProgress(prev => ({
            ...prev,
            current,
            total,
          }));
        }
      );

      setBulkActionProgress(prev => ({
        ...prev,
        status: 'success',
        message: `${result.success} attribué(s), ${result.failed} échec(s)`,
      }));

      setTimeout(() => {
        setBulkActionProgress(prev => ({ ...prev, show: false }));
      }, 2000);

      toast.success(`✅ ${result.success} lead(s) attribué(s)`);
      if (result.failed > 0) {
        toast.warning(`⚠️ ${result.failed} lead(s) n'ont pas pu être attribués`);
      }
      
      onRefresh?.();
    } catch (error) {
      console.error('Erreur attribution groupée:', error);
      setBulkActionProgress(prev => ({
        ...prev,
        status: 'error',
        message: 'Erreur lors de l\'attribution',
      }));
      setTimeout(() => {
        setBulkActionProgress(prev => ({ ...prev, show: false }));
      }, 3000);
      toast.error('❌ Erreur lors de l\'attribution');
    }
  }, [selected, onRefresh]);

  return (
    <div className="space-y-4">
      {/* Indicateur de progression des actions groupées */}
      <BulkActionProgress
        show={bulkActionProgress.show}
        action={bulkActionProgress.action}
        current={bulkActionProgress.current}
        total={bulkActionProgress.total}
        status={bulkActionProgress.status}
        message={bulkActionProgress.message}
      />

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

      {/* Barre d'actions groupées */}
      {selected.size > 0 && (
        <BulkActionsBar
          selectedCount={selected.size}
          totalCount={allSorted.length}
          onSelectAll={selectAllPages}
          onClearSelection={clearSelection}
          onExport={handleExport}
          onDelete={handleBulkDeleteClick}
          onStatusChange={handleBulkStatusChange}
          onEmail={handleBulkEmail}
          onSms={handleBulkSms}
          onAssign={handleBulkAssign}
        />
      )}
      
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

      {/* Info: Raccourcis clavier */}
      {selected.size === 0 && (
        <div className="text-xs text-muted-foreground flex items-center gap-4 px-1">
          <span>💡 Astuces : Ctrl+A pour tout sélectionner, Shift+Click pour sélection en plage</span>
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
            onSelectAll={toggleSelectAll}
            isAllSelected={isAllPageSelected}
            isSomeSelected={isSomePageSelected}
          />
        </thead>
        <TableBody>
          {paginated.length > 0 ? (
            paginated.map((row: T, index: number) => (
              <LeadsTableRow<T>
                key={row.id}
                row={row}
                index={index}
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
              <td colSpan={visibleColumnsData.length + 2} className="text-center py-10 text-muted-foreground">
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

      <BulkAssignModal
        open={showBulkAssignModal}
        onOpenChange={setShowBulkAssignModal}
        selectedCount={selected.size}
        onAssign={handleBulkAssignUser}
      />

      <BulkEmailModal
        open={showBulkEmailModal}
        onOpenChange={setShowBulkEmailModal}
        selectedCount={selected.size}
        onSend={handleBulkEmailSend}
      />

      <BulkSmsModal
        open={showBulkSmsModal}
        onOpenChange={setShowBulkSmsModal}
        selectedCount={selected.size}
        onSend={handleBulkSmsSend}
      />

      <BulkDeleteConfirmDialog
        open={showBulkDeleteConfirm}
        onOpenChange={setShowBulkDeleteConfirm}
        selectedCount={selected.size}
        onConfirm={handleBulkDeleteConfirm}
      />
    </div>
  );
}
