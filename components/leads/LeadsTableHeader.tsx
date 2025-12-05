'use client';
import { TableHead, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { ColumnDefinition } from '@/types/leads';

interface LeadsTableHeaderProps<T> {
  columns: Array<ColumnDefinition<T>>;
  sortKey: string;
  sortDir: 'asc' | 'desc';
  onSort: (key: string) => void;
  renderHeaderCell?: (col: ColumnDefinition<T>) => React.ReactNode | null;
  onSelectAll?: (checked: boolean) => void;
  isAllSelected?: boolean;
  isSomeSelected?: boolean;
}

export function LeadsTableHeader<T>({ 
  columns, 
  sortKey, 
  sortDir, 
  onSort,
  renderHeaderCell,
  onSelectAll,
  isAllSelected = false,
  isSomeSelected = false,
}: LeadsTableHeaderProps<T>) {
  return (
    <TableRow className="bg-gray-100">
      <TableHead className="w-10">
        {onSelectAll && (
          <div className="flex items-center justify-center">
            <Checkbox 
              checked={isAllSelected}
              onCheckedChange={onSelectAll}
              aria-label="Sélectionner toute la page"
              className={isSomeSelected && !isAllSelected ? 'opacity-50' : ''}
            />
          </div>
        )}
      </TableHead>
      {columns.map((col: ColumnDefinition<T>) => {
        const customCell = renderHeaderCell?.(col)
        
        if (customCell !== undefined && customCell !== null) {
          return (
            <TableHead key={String(col.key)} className="w-12">
              {customCell}
            </TableHead>
          )
        }
        
        return (
          <TableHead
            key={String(col.key)}
            className="cursor-pointer select-none"
            onClick={() => onSort(String(col.key))}
          >
            <div className="flex items-center justify-between">
              {col.label}
              {sortKey === col.key ? (
                sortDir === 'asc' ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )
              ) : (
                <ArrowUpDown className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </TableHead>
        )
      })}
    </TableRow>
  );
}
