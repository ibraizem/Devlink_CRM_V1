'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings2, Check, X } from 'lucide-react';
import { useColumnConfig } from '@/contexts/ColumnConfigContext';

export function ColumnCustomizer() {
  const { 
    availableColumns, 
    visibleColumns, 
    updateColumnVisibility,
    resetToDefault 
  } = useColumnConfig();
  const [open, setOpen] = useState(false);
  const [localVisibleColumns, setLocalVisibleColumns] = useState<string[]>(visibleColumns);

  const handleSave = () => {
    updateColumnVisibility(localVisibleColumns);
    setOpen(false);
  };

  const handleReset = () => {
    resetToDefault();
    setLocalVisibleColumns(
      availableColumns
        .filter(col => col.isVisible)
        .map(col => col.key)
    );
  };

  const toggleColumn = (columnKey: string) => {
    setLocalVisibleColumns(prev => 
      prev.includes(columnKey)
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto h-8">
          <Settings2 className="mr-2 h-4 w-4" />
          Personnaliser les colonnes
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium leading-none">Colonnes visibles</h4>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleReset}
              className="text-xs h-8"
            >
              Réinitialiser
            </Button>
          </div>
          <div className="space-y-2">
            {availableColumns.map((column) => (
              <div key={column.key} className="flex items-center space-x-2">
                <Checkbox
                  id={`col-${column.key}`}
                  checked={localVisibleColumns.includes(column.key)}
                  onCheckedChange={() => toggleColumn(column.key)}
                />
                <label
                  htmlFor={`col-${column.key}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {column.label}
                </label>
                {column.isCustom && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    Personnalisé
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setOpen(false)}
            >
              <X className="mr-2 h-4 w-4" />
              Annuler
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Check className="mr-2 h-4 w-4" />
              Enregistrer
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
