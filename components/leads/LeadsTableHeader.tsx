'use client';
import { TableHead, TableRow } from '@/components/ui/table';
import { ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { ColumnDefinition } from '@/types/leads';

interface LeadsTableHeaderProps<T> {
  columns: Array<ColumnDefinition<T>>;
  sortKey: string;
  sortDir: 'asc' | 'desc';
  onSort: (key: string) => void;
}

export function LeadsTableHeader<T>({ 
  columns, 
  sortKey, 
  sortDir, 
  onSort 
}: LeadsTableHeaderProps<T>) {
  return (
    <TableRow className="bg-gray-100">
      <TableHead className="w-10"></TableHead>
      {columns.map((col: ColumnDefinition<T>) => (
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
      ))}
      <TableHead className="text-right w-[70px]">Actions</TableHead>
    </TableRow>
  );
}