'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { GripVertical, Eye, EyeOff, RotateCcw } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface ColumnConfig {
  id: string
  label: string
  width: number
  visible: boolean
  locked?: boolean
  minWidth?: number
  maxWidth?: number
}

interface ColumnManagerProps {
  columns: ColumnConfig[]
  onColumnsChange: (columns: ColumnConfig[]) => void
  onReset?: () => void
  trigger?: React.ReactNode
}

interface SortableColumnItemProps {
  column: ColumnConfig
  onToggleVisibility: (id: string) => void
  onWidthChange: (id: string, width: number) => void
}

function SortableColumnItem({ column, onToggleVisibility, onWidthChange }: SortableColumnItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: column.id,
    disabled: column.locked
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 p-2 rounded-md border bg-card',
        isDragging && 'opacity-50 ring-2 ring-primary',
        column.locked && 'opacity-60'
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className={cn(
          'cursor-grab active:cursor-grabbing',
          column.locked && 'cursor-not-allowed opacity-30'
        )}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <Checkbox
        checked={column.visible}
        onCheckedChange={() => onToggleVisibility(column.id)}
        disabled={column.locked}
        className="shrink-0"
      />
      
      <div className="flex-1 flex items-center justify-between gap-2">
        <span className={cn('text-sm', !column.visible && 'text-muted-foreground')}>
          {column.label}
        </span>
        {column.visible ? (
          <Eye className="h-4 w-4 text-muted-foreground" />
        ) : (
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <input
          type="number"
          value={column.width}
          onChange={(e) => {
            const newWidth = parseInt(e.target.value) || column.width
            const clampedWidth = Math.max(
              column.minWidth || 80,
              Math.min(column.maxWidth || 600, newWidth)
            )
            onWidthChange(column.id, clampedWidth)
          }}
          className="w-16 px-2 py-1 text-right border rounded"
          min={column.minWidth || 80}
          max={column.maxWidth || 600}
          disabled={column.locked}
        />
        <span>px</span>
      </div>
    </div>
  )
}

export function ColumnManager({ 
  columns, 
  onColumnsChange, 
  onReset,
  trigger 
}: ColumnManagerProps) {
  const [localColumns, setLocalColumns] = useState(columns)
  const [open, setOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setLocalColumns((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }, [])

  const handleToggleVisibility = useCallback((id: string) => {
    setLocalColumns((cols) =>
      cols.map((col) =>
        col.id === id ? { ...col, visible: !col.visible } : col
      )
    )
  }, [])

  const handleWidthChange = useCallback((id: string, width: number) => {
    setLocalColumns((cols) =>
      cols.map((col) =>
        col.id === id ? { ...col, width } : col
      )
    )
  }, [])

  const handleApply = useCallback(() => {
    onColumnsChange(localColumns)
    setOpen(false)
  }, [localColumns, onColumnsChange])

  const handleReset = useCallback(() => {
    onReset?.()
    setOpen(false)
  }, [onReset])

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (newOpen) {
      setLocalColumns(columns)
    }
    setOpen(newOpen)
  }, [columns])

  const visibleCount = localColumns.filter((col) => col.visible).length
  const totalCount = localColumns.length

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            Gérer les colonnes
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Gestion des colonnes</SheetTitle>
          <SheetDescription>
            Organisez, redimensionnez et affichez/masquez les colonnes.
            {visibleCount} / {totalCount} colonnes visibles.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-12rem)] mt-6 pr-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localColumns.map((col) => col.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {localColumns.map((column) => (
                  <SortableColumnItem
                    key={column.id}
                    column={column}
                    onToggleVisibility={handleToggleVisibility}
                    onWidthChange={handleWidthChange}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </ScrollArea>

        <div className="flex items-center justify-between pt-6 border-t mt-6">
          {onReset && (
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
          )}
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button size="sm" onClick={handleApply}>
              Appliquer
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
