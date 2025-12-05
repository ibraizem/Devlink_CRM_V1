'use client'

import { useEffect, useState } from 'react'
import { useVirtualGridPerformance } from '@/hooks/useVirtualGridPerformance'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Activity, TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VirtualGridPerformanceMonitorProps {
  enabled?: boolean
  compact?: boolean
  className?: string
}

export function VirtualGridPerformanceMonitor({
  enabled = process.env.NODE_ENV === 'development',
  compact = false,
  className,
}: VirtualGridPerformanceMonitorProps) {
  const { metrics, reset, getReport, isEnabled } = useVirtualGridPerformance({
    enabled,
    warningThreshold: 16,
    onSlowRender: (metrics) => {
      console.warn('[VirtualGrid] Slow render detected:', metrics)
    },
  })

  const [report, setReport] = useState<ReturnType<typeof getReport> | null>(null)

  useEffect(() => {
    if (!isEnabled) return

    const interval = setInterval(() => {
      setReport(getReport())
    }, 1000)

    return () => clearInterval(interval)
  }, [isEnabled, getReport])

  if (!isEnabled) return null

  const getFpsColor = (renderTime: number) => {
    if (renderTime < 16) return 'text-green-600'
    if (renderTime < 33) return 'text-orange-600'
    return 'text-red-600'
  }

  const fps = metrics.lastRenderTime > 0 ? Math.round(1000 / metrics.lastRenderTime) : 60

  if (compact) {
    return (
      <Badge
        variant="outline"
        className={cn('fixed bottom-4 right-4 z-50', className)}
      >
        <Activity className="h-3 w-3 mr-1" />
        <span className={getFpsColor(metrics.lastRenderTime)}>{fps} FPS</span>
        {metrics.frameDrops > 0 && (
          <>
            <span className="mx-1">·</span>
            <span className="text-red-600">{metrics.frameDrops} drops</span>
          </>
        )}
      </Badge>
    )
  }

  return (
    <Card className={cn('fixed bottom-4 right-4 p-4 z-50 w-80', className)}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <h3 className="font-semibold text-sm">Performance Monitor</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={reset}>
            <RefreshCcw className="h-3 w-3" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-muted-foreground">FPS</div>
            <div className={cn('text-lg font-bold', getFpsColor(metrics.lastRenderTime))}>
              {fps}
            </div>
          </div>

          <div>
            <div className="text-muted-foreground">Renders</div>
            <div className="text-lg font-bold">{metrics.totalRenders}</div>
          </div>

          <div>
            <div className="text-muted-foreground">Last Render</div>
            <div className={cn('text-sm font-semibold', getFpsColor(metrics.lastRenderTime))}>
              {metrics.lastRenderTime.toFixed(2)}ms
            </div>
          </div>

          <div>
            <div className="text-muted-foreground">Average</div>
            <div className={cn('text-sm font-semibold', getFpsColor(metrics.averageRenderTime))}>
              {metrics.averageRenderTime.toFixed(2)}ms
            </div>
          </div>

          {report && (
            <>
              <div>
                <div className="text-muted-foreground">Min</div>
                <div className="text-sm font-semibold text-green-600">
                  {report.minRenderTime.toFixed(2)}ms
                </div>
              </div>

              <div>
                <div className="text-muted-foreground">Max</div>
                <div className="text-sm font-semibold text-red-600">
                  {report.maxRenderTime.toFixed(2)}ms
                </div>
              </div>

              <div>
                <div className="text-muted-foreground">P95</div>
                <div className={cn('text-sm font-semibold', getFpsColor(report.p95RenderTime))}>
                  {report.p95RenderTime.toFixed(2)}ms
                </div>
              </div>

              <div>
                <div className="text-muted-foreground">Frame Drops</div>
                <div className="text-sm font-semibold text-red-600">
                  {metrics.frameDrops}
                </div>
              </div>
            </>
          )}

          {metrics.memoryUsage && (
            <div className="col-span-2">
              <div className="text-muted-foreground">Memory</div>
              <div className="text-sm font-semibold">
                {metrics.memoryUsage.toFixed(2)} MB
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1 text-xs">
            {metrics.lastRenderTime < 16 ? (
              <>
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600">Excellent</span>
              </>
            ) : metrics.lastRenderTime < 33 ? (
              <>
                <TrendingDown className="h-3 w-3 text-orange-600" />
                <span className="text-orange-600">Acceptable</span>
              </>
            ) : (
              <>
                <TrendingDown className="h-3 w-3 text-red-600" />
                <span className="text-red-600">Slow</span>
              </>
            )}
          </div>
          
          {report && (
            <div className="text-xs text-muted-foreground">
              {report.samples} samples
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
