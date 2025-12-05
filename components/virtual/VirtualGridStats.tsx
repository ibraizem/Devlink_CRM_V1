'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'

export interface VirtualGridStat {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
  color?: string
  className?: string
}

export interface VirtualGridStatsProps {
  stats: VirtualGridStat[]
  className?: string
}

export function VirtualGridStats({ stats, className }: VirtualGridStatsProps) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      {stats.map((stat, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={cn('text-2xl font-bold', stat.className)}>
                {typeof stat.value === 'number'
                  ? stat.value.toLocaleString('fr-FR')
                  : stat.value}
              </p>
              {stat.trend && (
                <p
                  className={cn(
                    'text-xs flex items-center gap-1',
                    stat.trend.direction === 'up'
                      ? 'text-green-600'
                      : 'text-red-600'
                  )}
                >
                  {stat.trend.direction === 'up' ? '↑' : '↓'}
                  {Math.abs(stat.trend.value)}%
                </p>
              )}
            </div>
            {stat.icon && (
              <div
                className={cn(
                  'p-2 rounded-lg',
                  stat.color || 'bg-primary/10 text-primary'
                )}
              >
                {stat.icon}
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}

export function useVirtualGridStats<T>(
  data: T[],
  selectedRows: Set<string>,
  getRowId: (row: T) => string
) {
  return useMemo(() => {
    const total = data.length
    const selected = selectedRows.size
    const unselected = total - selected

    return {
      total,
      selected,
      unselected,
      selectedPercentage: total > 0 ? Math.round((selected / total) * 100) : 0,
    }
  }, [data, selectedRows])
}
