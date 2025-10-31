// components/crm/LeadsView.tsx
'use client';

import { useState } from 'react';
import FileSelector from './FileSelector';
import { LeadDataGrid } from './LeadDataGrid';
import MappingManager from './MappingManager';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download } from 'lucide-react';
import { LeadStatus } from '@/hooks/useCrmData2';

interface LeadsViewProps {
  selectedFiles: string[];
  availableFiles: any[];
  mergedLeads: any[];
  isLoading: boolean;
  searchQuery?: string;
  statusFilter?: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
  };
  onFileToggle: (fileId: string) => void;
  onClearSelection: () => void;
  onLeadAction: (action: string, leadId: string, data?: any) => void;
  onStatusUpdate: (leadId: string, status: LeadStatus) => void;
  onAddNote?: (leadId: string, note: string) => void;
  onRefresh?: () => void;
  onSearchChange?: (query: string) => void;
  onStatusFilterChange?: React.Dispatch<React.SetStateAction<LeadStatus | 'all'>>;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export function LeadsView({
  selectedFiles,
  availableFiles,
  mergedLeads,
  isLoading,
  onFileToggle,
  onClearSelection,
  onLeadAction,
  onStatusUpdate
}: LeadsViewProps) {
  const [showMapping, setShowMapping] = useState(false);
  const [filters, setFilters] = useState({});

  return (
    <div className="h-full flex flex-col p-6 space-y-4">
      {/* En-tête avec sélecteur de fichiers */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Leads Bruts ({mergedLeads.length})
          </h2>
          <span className="text-sm text-slate-500">
            {selectedFiles.length} fichier(s) sélectionné(s)
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowMapping(!showMapping)}
            disabled={selectedFiles.length === 0}
          >
            Gérer le Mapping
          </Button>
          
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Sélecteur de fichiers */}
      <FileSelector
        files={availableFiles}
        selectedFiles={selectedFiles}
        onFileToggle={onFileToggle}
        onClearSelection={onClearSelection}
      />

      {/* Gestionnaire de mapping (modal) */}
      {showMapping && (
        <MappingManager
          selectedFiles={selectedFiles}
          availableFiles={availableFiles}
          onClose={() => setShowMapping(false)}
        />
      )}

      {/* Grille de données */}
      <div className="flex-1 overflow-hidden">
        <LeadDataGrid
          data={mergedLeads}
          isLoading={isLoading}
          onLeadAction={onLeadAction}
          onStatusChange={onStatusUpdate}
        />
      </div>
    </div>
  );
}