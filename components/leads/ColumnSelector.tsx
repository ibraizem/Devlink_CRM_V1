'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export function ColumnSelector<T>({ 
  columns, 
  visibleColumns, 
  onVisibleColumnsChange 
}: { 
  columns: Array<{ key: string; label: string }>; 
  visibleColumns: string[]; 
  onVisibleColumnsChange: (columns: string[]) => void 
}) {
  const [open, setOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(visibleColumns);

  const handleToggleColumn = (key: string) => {
    setSelectedColumns(prev => 
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  const handleApply = () => {
    onVisibleColumnsChange(selectedColumns);
    setOpen(false);
  };

  const handleReset = () => {
    setSelectedColumns(columns.map(col => col.key));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Colonnes
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gérer les colonnes</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            {columns.map(column => (
              <div key={column.key} className="flex items-center space-x-2">
                <Checkbox
                  id={`col-${column.key}`}
                  checked={selectedColumns.includes(column.key)}
                  onCheckedChange={() => handleToggleColumn(column.key)}
                />
                <Label htmlFor={`col-${column.key}`} className="text-sm">
                  {column.label}
                </Label>
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleReset}>
              Réinitialiser
            </Button>
            <Button onClick={handleApply}>Appliquer</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
