import { ViewFilter, ViewSort, Lead, FilterOperator } from '@/types/leads';

export function applyFilters<T extends Lead>(data: T[], filters: ViewFilter[]): T[] {
  if (filters.length === 0) return data;

  return data.filter(item => {
    let result = true;
    let previousCondition: 'and' | 'or' | undefined;

    for (const filter of filters) {
      const fieldValue = getNestedValue(item, filter.field);
      const matchResult = matchesFilter(fieldValue, filter.operator, filter.value);

      if (previousCondition === 'or') {
        result = result || matchResult;
      } else if (previousCondition === 'and' || previousCondition === undefined) {
        result = result && matchResult;
      }

      previousCondition = filter.condition;
    }

    return result;
  });
}

export function applySorts<T extends Lead>(data: T[], sorts: ViewSort[]): T[] {
  if (sorts.length === 0) return data;

  return [...data].sort((a, b) => {
    for (const sort of sorts) {
      const aValue = getNestedValue(a, sort.field);
      const bValue = getNestedValue(b, sort.field);

      if (aValue == null && bValue == null) continue;
      if (aValue == null) return sort.direction === 'asc' ? -1 : 1;
      if (bValue == null) return sort.direction === 'asc' ? 1 : -1;

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      if (comparison !== 0) {
        return sort.direction === 'asc' ? comparison : -comparison;
      }
    }
    return 0;
  });
}

function getNestedValue(obj: any, path: string): any {
  if (path.includes('.')) {
    const parts = path.split('.');
    let value = obj;
    for (const part of parts) {
      value = value?.[part];
      if (value === undefined) return undefined;
    }
    return value;
  }
  return obj[path];
}

function matchesFilter(value: any, operator: FilterOperator, filterValue: any): boolean {
  const strValue = String(value || '').toLowerCase();
  const strFilterValue = String(filterValue || '').toLowerCase();

  switch (operator) {
    case 'equals':
      if (typeof value === 'number' && typeof filterValue === 'number') {
        return value === filterValue;
      }
      return strValue === strFilterValue;

    case 'contains':
      return strValue.includes(strFilterValue);

    case 'starts_with':
      return strValue.startsWith(strFilterValue);

    case 'ends_with':
      return strValue.endsWith(strFilterValue);

    case 'greater_than':
      const numValue = parseFloat(String(value));
      const numFilterValue = parseFloat(String(filterValue));
      return !isNaN(numValue) && !isNaN(numFilterValue) && numValue > numFilterValue;

    case 'less_than':
      const numValueLt = parseFloat(String(value));
      const numFilterValueLt = parseFloat(String(filterValue));
      return !isNaN(numValueLt) && !isNaN(numFilterValueLt) && numValueLt < numFilterValueLt;

    case 'is_empty':
      return value === null || value === undefined || strValue === '';

    case 'is_not_empty':
      return value !== null && value !== undefined && strValue !== '';

    default:
      return false;
  }
}

export function getVisibleColumns(
  allColumns: Array<{ key: string; label: string }>,
  columnConfig: Array<{ key: string; visible: boolean; order: number; width?: number }>
): Array<{ key: string; label: string; width?: number }> {
  if (columnConfig.length === 0) {
    return allColumns;
  }

  const visibleConfigs = columnConfig
    .filter(c => c.visible)
    .sort((a, b) => a.order - b.order);

  const result: Array<{ key: string; label: string; width?: number }> = [];
  
  for (const config of visibleConfigs) {
    const column = allColumns.find(c => c.key === config.key);
    if (column) {
      result.push({
        ...column,
        width: config.width,
      });
    }
  }

  return result;
}
