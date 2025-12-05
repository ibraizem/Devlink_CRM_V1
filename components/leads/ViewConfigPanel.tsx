'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColumnConfig, ViewFilter, ViewSort } from '@/types/leads';
import { ColumnManager } from './ColumnManager';
import { FilterBuilder } from './FilterBuilder';
import { SortBuilder } from './SortBuilder';
import { Settings2, X, Save } from 'lucide-react';

interface ViewConfigPanelProps {
  columns: ColumnConfig[];
  filters: ViewFilter[];
  sorts: ViewSort[];
  availableFields: Array<{ key: string; label: string }>;
  onColumnsChange: (columns: ColumnConfig[]) => void;
  onFiltersChange: (filters: ViewFilter[]) => void;
  onSortsChange: (sorts: ViewSort[]) => void;
  onSave?: () => void;
  onClose?: () => void;
  className?: string;
}

export function ViewConfigPanel({
  columns,
  filters,
  sorts,
  availableFields,
  onColumnsChange,
  onFiltersChange,
  onSortsChange,
  onSave,
  onClose,
  className,
}: ViewConfigPanelProps) {
  return (
    <Card className={className}>
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          <h3 className="font-semibold">Configuration de la vue</h3>
        </div>
        <div className="flex items-center gap-2">
          {onSave && (
            <Button size="sm" onClick={onSave}>
              <Save className="h-4 w-4 mr-1" />
              Sauvegarder
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="columns" className="p-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="columns">Colonnes</TabsTrigger>
          <TabsTrigger value="filters">Filtres</TabsTrigger>
          <TabsTrigger value="sorts">Tri</TabsTrigger>
        </TabsList>

        <TabsContent value="columns" className="mt-4">
          <ColumnManager
            columns={columns}
            availableFields={availableFields}
            onChange={onColumnsChange}
          />
        </TabsContent>

        <TabsContent value="filters" className="mt-4">
          <FilterBuilder
            filters={filters}
            availableFields={availableFields}
            onChange={onFiltersChange}
          />
        </TabsContent>

        <TabsContent value="sorts" className="mt-4">
          <SortBuilder
            sorts={sorts}
            availableFields={availableFields}
            onChange={onSortsChange}
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
