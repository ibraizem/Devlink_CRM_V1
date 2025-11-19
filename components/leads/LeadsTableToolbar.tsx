'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Columns, Search, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColumnOption {
  key: string;
  label: string;
}

interface LeadsTableToolbarProps {
  search: string;
  setSearch: (value: string) => void;
  selectedCount: number;
  onExport: () => void;
  onColumnsClick: () => void;
  onRefresh?: () => void;
  columns?: ColumnOption[];
  visibleColumns?: string[];
  onVisibleColumnsChange?: (columns: string[]) => void;
  className?: string;
}

export function LeadsTableToolbar({
  search,
  setSearch,
  selectedCount,
  onExport,
  onColumnsClick,
  onRefresh,
  columns = [],
  visibleColumns = [],
  onVisibleColumnsChange,
  className,
}: LeadsTableToolbarProps) {
  const hasColumnSelector = columns.length > 0 && onVisibleColumnsChange;
  
  return (
    <div className={cn("flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-card rounded-lg border", className)}>
      <div className="flex-1 flex flex-col sm:flex-row gap-2 w-full">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher des leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 h-9"
            aria-label="Rechercher des leads"
          />
        </div>
        
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5"
              onClick={onRefresh}
              aria-label="Actualiser"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Actualiser</span>
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        {hasColumnSelector && (
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5"
              onClick={onColumnsClick}
              aria-label="Gérer les colonnes"
            >
              <Columns className="h-4 w-4" />
              <span className="hidden sm:inline">Colonnes</span>
            </Button>
          </div>
        )}
        
        <Button
          variant={selectedCount > 0 ? "default" : "outline"}
          size="sm"
          className="h-9 gap-1.5"
          onClick={onExport}
          disabled={!selectedCount}
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">
            {selectedCount > 0 ? `Exporter (${selectedCount})` : 'Exporter'}
          </span>
        </Button>
      </div>
    </div>
  );
}
