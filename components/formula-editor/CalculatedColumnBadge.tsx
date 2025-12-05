'use client'

import { Badge } from '@/components/ui/badge'
import { Sparkles, Calculator, Loader2 } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface CalculatedColumnBadgeProps {
  columnName: string
  formulaType: 'calculation' | 'ai_enrichment'
  value: any
  isLoading?: boolean
  fromCache?: boolean
  error?: string | null
}

export default function CalculatedColumnBadge({
  columnName,
  formulaType,
  value,
  isLoading = false,
  fromCache = false,
  error = null
}: CalculatedColumnBadgeProps) {
  const renderValue = () => {
    if (isLoading) {
      return <Loader2 className='h-3 w-3 animate-spin' />
    }

    if (error) {
      return <span className='text-destructive text-xs'>Error</span>
    }

    if (value === null || value === undefined) {
      return <span className='text-muted-foreground'>-</span>
    }

    if (typeof value === 'boolean') {
      return value ? '✓' : '✗'
    }

    if (typeof value === 'number') {
      return value.toLocaleString()
    }

    const stringValue = String(value)
    return stringValue.length > 30 ? stringValue.substring(0, 30) + '...' : stringValue
  }

  const icon = formulaType === 'ai_enrichment' ? (
    <Sparkles className='h-3 w-3' />
  ) : (
    <Calculator className='h-3 w-3' />
  )

  const tooltipContent = (
    <div className='space-y-1'>
      <div className='font-semibold'>{columnName}</div>
      <div className='text-xs'>
        Type: {formulaType === 'ai_enrichment' ? 'AI Enrichment' : 'Calculation'}
      </div>
      {fromCache && <div className='text-xs text-muted-foreground'>Cached result</div>}
      {error && <div className='text-xs text-destructive'>{error}</div>}
    </div>
  )

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={error ? 'destructive' : 'secondary'}
            className='flex items-center gap-1 cursor-help'
          >
            {icon}
            <span>{renderValue()}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{tooltipContent}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
