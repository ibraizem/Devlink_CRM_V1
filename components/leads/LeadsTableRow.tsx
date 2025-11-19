'use client';
import { TableRow, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { LeadsTableActionsMenu } from './LeadsTableActionsMenu';
import { ColumnDefinition } from '@/lib/types/leads';

interface LeadsTableRowProps<T> {
  row: T;
  isSelected: boolean;
  onSelect: (id: string) => void;
  columns: Array<ColumnDefinition<T>>;
  onActions: {
    call: (row: T) => void;
    note: (row: T) => void;
    edit: (row: T) => void;
    delete: (row: T) => void;
  };
}

export function LeadsTableRow<T extends { id: string }>({ 
  row, 
  isSelected, 
  onSelect, 
  columns,
  onActions 
}: LeadsTableRowProps<T>) {
  return (
    <TableRow
      onClick={() => onSelect(row.id)}
      className={`cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50' : 'hover:bg-gray-100'
      }`}
    >
      <TableCell>
        <Checkbox checked={isSelected} onCheckedChange={() => onSelect(row.id)} />
      </TableCell>

      {columns.map((col: ColumnDefinition<T>) => (
        <TableCell 
          key={String(col.key)}
          className="truncate max-w-[200px]"
          title={String((row as any)[col.key] ?? '')}
        >
          {(row as any)[col.key] != null ? String((row as any)[col.key]) : '-'}
        </TableCell>
      ))}

      <TableCell className="text-right">
        <LeadsTableActionsMenu
          onCall={() => onActions.call(row)}
          onNote={() => onActions.note(row)}
          onEdit={() => onActions.edit(row)}
          onDelete={() => onActions.delete(row)}
        />
      </TableCell>
    </TableRow>
  );
}
