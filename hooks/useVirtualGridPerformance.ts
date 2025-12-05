'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export interface PerformanceMetrics {
  renderTime: number
  lastRenderTime: number
  averageRenderTime: number
  totalRenders: number
  frameDrops: number
  memoryUsage?: number
}

export interface UseVirtualGridPerformanceOptions {
  enabled?: boolean
  sampleSize?: number
  warningThreshold?: number
  onSlowRender?: (metrics: PerformanceMetrics) => void
}

export function useVirtualGridPerformance({
  enabled = process.env.NODE_ENV === 'development',
  sampleSize = 60,
  warningThreshold = 16,
  onSlowRender,
}: UseVirtualGridPerformanceOptions = {}) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    totalRenders: 0,
    frameDrops: 0,
  })

  const renderTimesRef = useRef<number[]>([])
  const renderStartRef = useRef<number>(0)
  const isEnabledRef = useRef(enabled)

  useEffect(() => {
    isEnabledRef.current = enabled
  }, [enabled])

  const startMeasure = useCallback(() => {
    if (!isEnabledRef.current) return
    renderStartRef.current = performance.now()
  }, [])

  const endMeasure = useCallback(() => {
    if (!isEnabledRef.current || renderStartRef.current === 0) return

    const renderTime = performance.now() - renderStartRef.current
    renderStartRef.current = 0

    renderTimesRef.current.push(renderTime)
    if (renderTimesRef.current.length > sampleSize) {
      renderTimesRef.current.shift()
    }

    const averageRenderTime =
      renderTimesRef.current.reduce((sum, time) => sum + time, 0) /
      renderTimesRef.current.length

    const frameDrops = renderTimesRef.current.filter(
      (time) => time > warningThreshold
    ).length

    const newMetrics: PerformanceMetrics = {
      renderTime,
      lastRenderTime: renderTime,
      averageRenderTime,
      totalRenders: metrics.totalRenders + 1,
      frameDrops,
    }

    if ('memory' in performance && (performance as any).memory) {
      newMetrics.memoryUsage = (performance as any).memory.usedJSHeapSize / 1048576
    }

    setMetrics(newMetrics)

    if (renderTime > warningThreshold && onSlowRender) {
      onSlowRender(newMetrics)
    }
  }, [sampleSize, warningThreshold, onSlowRender, metrics.totalRenders])

  const reset = useCallback(() => {
    renderTimesRef.current = []
    setMetrics({
      renderTime: 0,
      lastRenderTime: 0,
      averageRenderTime: 0,
      totalRenders: 0,
      frameDrops: 0,
    })
  }, [])

  const getReport = useCallback(() => {
    const report = {
      ...metrics,
      samples: renderTimesRef.current.length,
      minRenderTime: Math.min(...renderTimesRef.current),
      maxRenderTime: Math.max(...renderTimesRef.current),
      medianRenderTime: [...renderTimesRef.current]
        .sort((a, b) => a - b)
        [Math.floor(renderTimesRef.current.length / 2)] || 0,
      p95RenderTime: [...renderTimesRef.current]
        .sort((a, b) => a - b)
        [Math.floor(renderTimesRef.current.length * 0.95)] || 0,
    }
    return report
  }, [metrics])

  useEffect(() => {
    if (!enabled) return

    const logInterval = setInterval(() => {
      if (renderTimesRef.current.length > 0) {
        const report = getReport()
        console.debug('[VirtualGrid Performance]', {
          avg: `${report.averageRenderTime.toFixed(2)}ms`,
          last: `${report.lastRenderTime.toFixed(2)}ms`,
          min: `${report.minRenderTime.toFixed(2)}ms`,
          max: `${report.maxRenderTime.toFixed(2)}ms`,
          p95: `${report.p95RenderTime.toFixed(2)}ms`,
          renders: report.totalRenders,
          drops: report.frameDrops,
          memory: report.memoryUsage ? `${report.memoryUsage.toFixed(2)}MB` : 'N/A',
        })
      }
    }, 10000)

    return () => clearInterval(logInterval)
  }, [enabled, getReport])

  return {
    metrics,
    startMeasure,
    endMeasure,
    reset,
    getReport,
    isEnabled: enabled,
  }
}
