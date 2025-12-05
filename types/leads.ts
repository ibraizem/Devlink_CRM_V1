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

export type FilterOperator = 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
export type FilterCondition = 'and' | 'or';

export interface ViewFilter {
  field: string;
  operator: FilterOperator;
  value: string | number | boolean;
  condition?: FilterCondition;
}

export interface ViewSort {
  field: string;
  direction: SortDirection;
}

export interface ColumnConfig {
  key: string;
  visible: boolean;
  width?: number;
  order: number;
}

export interface LeadViewConfig {
  id?: string;
  name: string;
  description?: string;
  user_id: string;
  is_template?: boolean;
  template_type?: 'status' | 'agent' | 'channel' | 'custom';
  is_shared?: boolean;
  shared_with_team?: boolean;
  shared_with_users?: string[];
  columns: ColumnConfig[];
  filters: ViewFilter[];
  sorts: ViewSort[];
  created_at?: string;
  updated_at?: string;
}

export interface ViewTemplate {
  id: string;
  name: string;
  description: string;
  type: 'status' | 'agent' | 'channel' | 'custom';
  icon?: string;
  config: Omit<LeadViewConfig, 'id' | 'user_id' | 'name' | 'description'>;
}
