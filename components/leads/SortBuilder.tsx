'use client';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ViewSort, SortDirection } from '@/types/leads';
import { Plus, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface SortBuilderProps {
  sorts: ViewSort[];
  availableFields: Array<{ key: string; label: string }>;
  onChange: (sorts: ViewSort[]) => void;
}

export function SortBuilder({ sorts, availableFields, onChange }: SortBuilderProps) {
  const handleAddSort = () => {
    onChange([
      ...sorts,
      {
        field: availableFields[0]?.key || '',
        direction: 'asc',
      },
    ]);
  };

  const handleRemoveSort = (index: number) => {
    onChange(sorts.filter((_, i) => i !== index));
  };

  const handleUpdateSort = (index: number, updates: Partial<ViewSort>) => {
    onChange(
      sorts.map((sort, i) => 
        i === index ? { ...sort, ...updates } : sort
      )
    );
  };

  const getSortIcon = (direction: SortDirection) => {
    return direction === 'asc' ? ArrowUp : ArrowDown;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Tri</h4>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleAddSort}>
          <Plus className="h-4 w-4 mr-1" />
          Ajouter un tri
        </Button>
      </div>

      {sorts.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Aucun tri défini
        </p>
      ) : (
        <div className="space-y-2">
          {sorts.map((sort, index) => {
            const SortIcon = getSortIcon(sort.direction);
            return (
              <Card key={index} className="p-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-6">
                    {index + 1}.
                  </span>
                  
                  <Select
                    value={sort.field}
                    onValueChange={(value) => handleUpdateSort(index, { field: value })}
                  >
                    <SelectTrigger className="flex-1 h-8">
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

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => 
                      handleUpdateSort(index, { 
                        direction: sort.direction === 'asc' ? 'desc' : 'asc' 
                      })
                    }
                    className="h-8 w-24 gap-1"
                  >
                    <SortIcon className="h-4 w-4" />
                    {sort.direction === 'asc' ? 'Croissant' : 'Décroissant'}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSort(index)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
