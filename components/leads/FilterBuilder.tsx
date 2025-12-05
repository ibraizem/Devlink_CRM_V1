'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ViewFilter, FilterOperator, FilterCondition } from '@/types/leads';
import { Plus, Trash2, Filter } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface FilterBuilderProps {
  filters: ViewFilter[];
  availableFields: Array<{ key: string; label: string }>;
  onChange: (filters: ViewFilter[]) => void;
}

const operatorLabels: Record<FilterOperator, string> = {
  equals: 'Égal à',
  contains: 'Contient',
  starts_with: 'Commence par',
  ends_with: 'Finit par',
  greater_than: 'Supérieur à',
  less_than: 'Inférieur à',
  is_empty: 'Est vide',
  is_not_empty: 'N\'est pas vide',
};

const conditionLabels: Record<FilterCondition, string> = {
  and: 'ET',
  or: 'OU',
};

export function FilterBuilder({ filters, availableFields, onChange }: FilterBuilderProps) {
  const handleAddFilter = () => {
    onChange([
      ...filters,
      {
        field: availableFields[0]?.key || '',
        operator: 'equals',
        value: '',
        condition: 'and',
      },
    ]);
  };

  const handleRemoveFilter = (index: number) => {
    onChange(filters.filter((_, i) => i !== index));
  };

  const handleUpdateFilter = (index: number, updates: Partial<ViewFilter>) => {
    onChange(
      filters.map((filter, i) => 
        i === index ? { ...filter, ...updates } : filter
      )
    );
  };

  const needsValue = (operator: FilterOperator) => {
    return operator !== 'is_empty' && operator !== 'is_not_empty';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Filtres</h4>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleAddFilter}>
          <Plus className="h-4 w-4 mr-1" />
          Ajouter un filtre
        </Button>
      </div>

      {filters.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Aucun filtre défini
        </p>
      ) : (
        <div className="space-y-2">
          {filters.map((filter, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-start gap-2">
                {index > 0 && (
                  <Select
                    value={filter.condition}
                    onValueChange={(value) => 
                      handleUpdateFilter(index, { condition: value as FilterCondition })
                    }
                  >
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="and">{conditionLabels.and}</SelectItem>
                      <SelectItem value="or">{conditionLabels.or}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <Select
                    value={filter.field}
                    onValueChange={(value) => handleUpdateFilter(index, { field: value })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Champ" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields.map((field) => (
                        <SelectItem key={field.key} value={field.key}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filter.operator}
                    onValueChange={(value) => 
                      handleUpdateFilter(index, { operator: value as FilterOperator })
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Opérateur" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(operatorLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {needsValue(filter.operator) && (
                    <Input
                      placeholder="Valeur"
                      value={String(filter.value)}
                      onChange={(e) => handleUpdateFilter(index, { value: e.target.value })}
                      className="h-8"
                    />
                  )}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFilter(index)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
