'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { TableHead } from '@/components/ui/table';
import { cn } from '@/lib/types/utils';

interface DraggableColumnHeaderProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  isDragging?: boolean;
}

export function DraggableColumnHeader({
  id,
  children,
  className = '',
  isDragging = false,
}: DraggableColumnHeaderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isActuallyDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isActuallyDragging ? 0.8 : 1,
    zIndex: isActuallyDragging ? 50 : 'auto',
    position: 'relative' as const,
  };

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative select-none',
        isActuallyDragging && 'bg-gray-50 shadow-md',
        className
      )}
      {...attributes}
    >
      <div className="flex items-center justify-between">
        {children}
        <button
          type="button"
          className="ml-2 p-1 opacity-0 group-hover:opacity-70 transition-opacity rounded hover:bg-gray-100"
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    </TableHead>
  );
}
