export type SortDirection = 'asc' | 'desc';

export interface ColumnDefinition<T> {
  key: keyof T;
  label: string;
}

export interface Lead {
  id: string;
  score?: number;
  campaign_id?: string;
  [key: string]: any;
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
