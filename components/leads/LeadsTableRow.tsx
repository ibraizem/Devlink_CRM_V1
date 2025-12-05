'use client';
import { TableRow, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { LeadsTableActionsMenu } from './LeadsTableActionsMenu';
import { ColumnDefinition } from '@/types/leads';

interface LeadsTableRowProps<T> {
  row: T;
  index: number;
  isSelected: boolean;
  onSelect: (id: string, index: number, event?: { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean }) => void;
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
  index,
  isSelected, 
  onSelect, 
  columns,
  onActions 
}: LeadsTableRowProps<T>) {
  const handleRowClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a')) {
      return;
    }
    onSelect(row.id, index, {
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      metaKey: e.metaKey,
    });
  };

  const handleCheckboxChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(row.id, index, {
      shiftKey: (e as any).shiftKey,
      ctrlKey: (e as any).ctrlKey,
      metaKey: (e as any).metaKey,
    });
  };

  return (
    <TableRow
      onClick={handleRowClick}
      className={`cursor-pointer transition-all duration-150 ${
        isSelected 
          ? 'bg-blue-50 border-l-2 border-l-blue-500' 
          : 'hover:bg-gray-100'
      }`}
    >
      <TableCell onClick={(e) => e.stopPropagation()}>
        <div onClick={handleCheckboxChange}>
          <Checkbox checked={isSelected} />
        </div>
      </TableCell>

      {columns.map((col: ColumnDefinition<T>) => (
        <TableCell 
          key={String(col.key)}
          className="truncate max-w-[200px]"
          title={String(row[col.key] ?? '')}
        >
          {row[col.key] != null ? String(row[col.key]) : '-'}
        </TableCell>
      ))}

      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
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
