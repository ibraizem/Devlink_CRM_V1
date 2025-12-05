'use client'

import { useState, useMemo, useEffect } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Filter, X, Search } from 'lucide-react'
import { Lead, ColumnDefinition } from '@/types/leads'
import { cn } from '@/lib/utils'

interface ColumnFiltersProps<T extends Lead> {
  data: T[]
  columns: ColumnDefinition<T>[]
  filters: Record<string, string[]>
  onFiltersChange: (filters: Record<string, string[]>) => void
}

export function ColumnFilters<T extends Lead>({
  data,
  columns,
  filters,
  onFiltersChange
}: ColumnFiltersProps<T>) {
  const [openColumn, setOpenColumn] = useState<string | null>(null)
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({})

  const uniqueValues = useMemo(() => {
    const values: Record<string, Array<{ value: string; count: number }>> = {}
    
    columns.forEach((col) => {
      const key = String(col.key)
      const valueMap = new Map<string, number>()
      
      data.forEach((row) => {
        const value = row[col.key]
        if (value !== undefined && value !== null && value !== '') {
          const strValue = String(value)
          valueMap.set(strValue, (valueMap.get(strValue) || 0) + 1)
        }
      })
      
      values[key] = Array.from(valueMap.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count)
    })
    
    return values
  }, [data, columns])

  const filteredValues = useMemo(() => {
    const filtered: Record<string, Array<{ value: string; count: number }>> = {}
    
    Object.entries(uniqueValues).forEach(([key, values]) => {
      const searchTerm = searchTerms[key]?.toLowerCase() || ''
      filtered[key] = searchTerm
        ? values.filter(({ value }) => value.toLowerCase().includes(searchTerm))
        : values
    })
    
    return filtered
  }, [uniqueValues, searchTerms])

  const handleToggleValue = (columnKey: string, value: string) => {
    const currentFilters = filters[columnKey] || []
    const newFilters = currentFilters.includes(value)
      ? currentFilters.filter(v => v !== value)
      : [...currentFilters, value]
    
    onFiltersChange({
      ...filters,
      [columnKey]: newFilters
    })
  }

  const handleClearColumn = (columnKey: string) => {
    const newFilters = { ...filters }
    delete newFilters[columnKey]
    onFiltersChange(newFilters)
  }

  const handleClearAll = () => {
    onFiltersChange({})
    setSearchTerms({})
  }

  const activeFilterCount = Object.values(filters).flat().length

  return (
    <div className="flex items-center gap-2">
      {Object.entries(filters).map(([key, values]) => 
        values.length > 0 && (
          <Badge key={key} variant="secondary" className="gap-1">
            {columns.find(c => String(c.key) === key)?.label || key}: {values.length}
            <button
              onClick={() => handleClearColumn(key)}
              className="ml-1 hover:bg-muted rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )
      )}
      
      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearAll}
          className="h-7 px-2 text-xs"
        >
          Effacer tout
        </Button>
      )}
      
      <Popover
        open={openColumn !== null}
        onOpenChange={(open) => !open && setOpenColumn(null)}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 gap-1",
              activeFilterCount > 0 && "border-primary"
            )}
          >
            <Filter className="h-4 w-4" />
            Filtres
            {activeFilterCount > 0 && (
              <Badge variant="default" className="h-5 px-1 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="flex flex-col h-[400px]">
            <div className="p-3 border-b">
              <h4 className="font-medium text-sm mb-3">Filtrer par colonne</h4>
              <div className="grid grid-cols-2 gap-2">
                {columns.map((col) => {
                  const key = String(col.key)
                  const activeCount = filters[key]?.length || 0
                  
                  return (
                    <Button
                      key={key}
                      variant={openColumn === key ? "default" : "outline"}
                      size="sm"
                      onClick={() => setOpenColumn(openColumn === key ? null : key)}
                      className="justify-between h-auto py-2"
                    >
                      <span className="truncate">{col.label}</span>
                      {activeCount > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 px-1 text-xs">
                          {activeCount}
                        </Badge>
                      )}
                    </Button>
                  )
                })}
              </div>
            </div>
            
            {openColumn && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-3 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchTerms[openColumn] || ''}
                      onChange={(e) => setSearchTerms({
                        ...searchTerms,
                        [openColumn]: e.target.value
                      })}
                      className="pl-8 h-8"
                    />
                  </div>
                </div>
                
                <ScrollArea className="flex-1">
                  <div className="p-3 space-y-2">
                    {filteredValues[openColumn]?.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Aucune valeur trouvée
                      </p>
                    ) : (
                      filteredValues[openColumn]?.map(({ value, count }) => {
                        const isChecked = filters[openColumn]?.includes(value) || false
                        
                        return (
                          <div
                            key={value}
                            className="flex items-center space-x-2 py-1.5 px-2 rounded hover:bg-muted cursor-pointer"
                            onClick={() => handleToggleValue(openColumn, value)}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => handleToggleValue(openColumn, value)}
                            />
                            <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                              <span className="text-sm truncate">{value}</span>
                              <Badge variant="outline" className="text-xs">
                                {count}
                              </Badge>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </ScrollArea>
                
                {filters[openColumn]?.length > 0 && (
                  <div className="p-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleClearColumn(openColumn)}
                      className="w-full"
                    >
                      Effacer les filtres de cette colonne
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
