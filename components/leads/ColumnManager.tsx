'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ColumnConfig } from '@/types/leads';
import { GripVertical, Columns, Eye, EyeOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ColumnManagerProps {
  columns: ColumnConfig[];
  availableFields: Array<{ key: string; label: string }>;
  onChange: (columns: ColumnConfig[]) => void;
}

interface SortableColumnItemProps {
  column: ColumnConfig;
  field: { key: string; label: string };
  onToggle: (key: string) => void;
  onWidthChange: (key: string, width: number) => void;
}

function SortableColumnItem({ column, field, onToggle, onWidthChange }: SortableColumnItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="p-3">
      <div className="flex items-center gap-2">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        <Checkbox
          checked={column.visible}
          onCheckedChange={() => onToggle(column.key)}
        />

        <div className="flex-1 flex items-center gap-2">
          {column.visible ? (
            <Eye className="h-4 w-4 text-muted-foreground" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">{field.label}</span>
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Largeur"
            value={column.width || ''}
            onChange={(e) => onWidthChange(column.key, parseInt(e.target.value) || 0)}
            className="w-20 h-8"
            min={50}
            max={500}
          />
          <span className="text-xs text-muted-foreground">px</span>
        </div>
      </div>
    </Card>
  );
}

export function ColumnManager({ columns, availableFields, onChange }: ColumnManagerProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleToggleColumn = (key: string) => {
    const exists = columns.find(c => c.key === key);
    if (exists) {
      onChange(
        columns.map(c => 
          c.key === key ? { ...c, visible: !c.visible } : c
        )
      );
    } else {
      onChange([
        ...columns,
        {
          key,
          visible: true,
          order: columns.length,
        },
      ]);
    }
  };

  const handleWidthChange = (key: string, width: number) => {
    onChange(
      columns.map(c => 
        c.key === key ? { ...c, width } : c
      )
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = columns.findIndex(c => c.key === active.id);
      const newIndex = columns.findIndex(c => c.key === over.id);

      const newColumns = arrayMove(columns, oldIndex, newIndex);
      onChange(
        newColumns.map((item, index) => ({ ...item, order: index }))
      );
    }
  };

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Columns className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-medium">Colonnes</h4>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Sélectionnez les colonnes à afficher et réorganisez-les
        </p>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedColumns.map(c => c.key)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {sortedColumns.map((column) => {
                const field = availableFields.find(f => f.key === column.key);
                if (!field) return null;

                return (
                  <SortableColumnItem
                    key={column.key}
                    column={column}
                    field={field}
                    onToggle={handleToggleColumn}
                    onWidthChange={handleWidthChange}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>

        <div className="pt-2">
          <p className="text-xs font-medium mb-2">Colonnes disponibles</p>
          <div className="flex flex-wrap gap-2">
            {availableFields
              .filter(field => !columns.some(c => c.key === field.key))
              .map(field => (
                <Button
                  key={field.key}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleColumn(field.key)}
                  className="h-7 text-xs"
                >
                  {field.label}
                </Button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
