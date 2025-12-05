'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { GripVertical } from 'lucide-react'

interface ResizableColumnProps {
  width: number
  minWidth?: number
  maxWidth?: number
  onResize: (newWidth: number) => void
  children: React.ReactNode
  className?: string
  resizable?: boolean
}

export function ResizableColumn({
  width,
  minWidth = 80,
  maxWidth = 600,
  onResize,
  children,
  className,
  resizable = true,
}: ResizableColumnProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(width)
  const columnRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!resizable) return
    
    e.preventDefault()
    e.stopPropagation()
    
    setIsDragging(true)
    setStartX(e.clientX)
    setStartWidth(width)
  }, [resizable, width])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return

      const delta = e.clientX - startX
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + delta))
      
      onResize(newWidth)
    },
    [isDragging, startX, startWidth, minWidth, maxWidth, onResize]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div
      ref={columnRef}
      className={cn('relative flex-shrink-0', className)}
      style={{ width: `${width}px` }}
    >
      {children}
      {resizable && (
        <div
          className={cn(
            'absolute top-0 right-0 bottom-0 w-1 cursor-col-resize group hover:bg-primary/20 transition-colors',
            isDragging && 'bg-primary/30'
          )}
          onMouseDown={handleMouseDown}
        >
          <div
            className={cn(
              'absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity',
              isDragging && 'opacity-100'
            )}
          >
            <div className="bg-background border rounded p-0.5 shadow-sm">
              <GripVertical className="h-3 w-3 text-muted-foreground" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
