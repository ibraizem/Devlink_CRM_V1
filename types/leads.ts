export type SortDirection = 'asc' | 'desc';

export interface ColumnDefinition<T> {
  key: keyof T;
  label: string;
  // Add any other column-specific properties here
}

export interface Lead {
  id: string;
  [key: string]: any; // This allows for dynamic properties
}

export interface LeadsTableProps<T> {
  data: T[];
  columns: ColumnDefinition<T>[];
  onExport: (selectedIds: string[]) => void;
}

export interface LeadsTableHeaderProps<T> {
  columns: ColumnDefinition<T>[];
  sortKey: keyof T | '';
  sortDir: SortDirection;
  onSort: (key: keyof T) => void;
}

export interface LeadsTableRowProps<T> {
  row: T;
  isSelected: boolean;
  onSelect: (id: string) => void;
  columns: ColumnDefinition<T>[];
}

export interface LeadsTableToolbarProps {
  search: string;
  setSearch: (value: string) => void;
  selectedCount: number;
  onExport: () => void;
  onColumnsClick: () => void;
}
