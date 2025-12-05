'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Download, 
  Trash2, 
  RefreshCcw, 
  Filter,
  X 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

export interface VirtualGridToolbarProps {
  searchValue?: string
  onSearchChange?: (value: string) => void
  selectedCount?: number
  totalCount?: number
  onExport?: () => void
  onDelete?: () => void
  onRefresh?: () => void
  onClearSelection?: () => void
  filters?: Array<{
    id: string
    label: string
    active: boolean
    onToggle: () => void
  }>
  actions?: Array<{
    label: string
    icon?: React.ReactNode
    onClick: () => void
    variant?: 'default' | 'destructive' | 'outline' | 'secondary'
    disabled?: boolean
  }>
  className?: string
}

export function VirtualGridToolbar({
  searchValue = '',
  onSearchChange,
  selectedCount = 0,
  totalCount = 0,
  onExport,
  onDelete,
  onRefresh,
  onClearSelection,
  filters = [],
  actions = [],
  className,
}: VirtualGridToolbarProps) {
  const activeFiltersCount = filters.filter((f) => f.active).length

  return (
    <div className={cn('flex items-center gap-2 p-3 border-b bg-muted/30', className)}>
      <div className="flex-1 flex items-center gap-2">
        {onSearchChange && (
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 h-9"
            />
            {searchValue && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {filters.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                Filtres
                {activeFiltersCount > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="ml-2 px-1.5 py-0 h-5 min-w-[20px]"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {filters.map((filter) => (
                <DropdownMenuItem
                  key={filter.id}
                  onClick={filter.onToggle}
                  className="flex items-center justify-between"
                >
                  <span>{filter.label}</span>
                  {filter.active && (
                    <Badge variant="secondary" className="ml-2">
                      Actif
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex items-center gap-2">
        {selectedCount > 0 ? (
          <>
            <div className="text-sm text-muted-foreground px-2">
              {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
            </div>
            
            {onClearSelection && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
              >
                Tout désélectionner
              </Button>
            )}

            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            )}

            {onDelete && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            )}
          </>
        ) : (
          <>
            <div className="text-sm text-muted-foreground px-2">
              {totalCount.toLocaleString('fr-FR')} ligne{totalCount > 1 ? 's' : ''}
            </div>

            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            )}

            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
