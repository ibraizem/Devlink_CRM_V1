'use client'

import { useState, useEffect } from 'react'
import { useCalculatedColumns } from '@/lib/hooks/useCalculatedColumns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sparkles, RefreshCw } from 'lucide-react'

interface LeadsTableWithCalculatedProps {
  leads: any[]
  onLeadUpdate?: () => void
}

export default function LeadsTableWithCalculated({
  leads,
  onLeadUpdate
}: LeadsTableWithCalculatedProps) {
  const { columns, evaluateColumnsForLeads } = useCalculatedColumns()
  const [calculatedValues, setCalculatedValues] = useState<Record<string, Record<string, any>>>({})
  const [isEvaluating, setIsEvaluating] = useState(false)

  const activeColumns = columns.filter(col => col.is_active)

  useEffect(() => {
    if (activeColumns.length > 0 && leads.length > 0) {
      evaluateAllColumns()
    }
  }, [activeColumns.length, leads.length])

  const evaluateAllColumns = async () => {
    setIsEvaluating(true)
    const newValues: Record<string, Record<string, any>> = {}

    for (const column of activeColumns) {
      const leadsData = leads.map(lead => ({
        id: lead.id,
        data: lead
      }))

      const results = await evaluateColumnsForLeads(column.id, leadsData)
      
      for (const [leadId, value] of Object.entries(results)) {
        if (!newValues[leadId]) {
          newValues[leadId] = {}
        }
        newValues[leadId][column.column_name] = value
      }
    }

    setCalculatedValues(newValues)
    setIsEvaluating(false)
  }

  const getCalculatedValue = (leadId: string, columnName: string) => {
    return calculatedValues[leadId]?.[columnName]
  }

  const renderValue = (value: any, resultType: string) => {
    if (value === null || value === undefined) {
      return <span className='text-muted-foreground'>-</span>
    }

    if (resultType === 'boolean') {
      return value ? '✓' : '✗'
    }

    if (resultType === 'number' && typeof value === 'number') {
      return value.toLocaleString()
    }

    return String(value)
  }

  if (activeColumns.length === 0) {
    return null
  }

  return (
    <div className='mt-4 border rounded-lg p-4 bg-muted/30'>
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-2'>
          <Sparkles className='h-5 w-5 text-primary' />
          <h3 className='text-lg font-semibold'>Calculated Columns</h3>
          <Badge variant='secondary'>{activeColumns.length} active</Badge>
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={evaluateAllColumns}
          disabled={isEvaluating}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isEvaluating ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className='overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='border-b'>
              <th className='text-left p-2 font-medium'>Lead</th>
              {activeColumns.map(column => (
                <th key={column.id} className='text-left p-2 font-medium'>
                  <div className='flex items-center gap-1'>
                    {column.formula_type === 'ai_enrichment' && (
                      <Sparkles className='h-3 w-3 text-primary' />
                    )}
                    {column.column_name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.slice(0, 10).map(lead => (
              <tr key={lead.id} className='border-b'>
                <td className='p-2'>
                  {lead.nom || lead.firstName || lead.prenom || 'Lead'}
                </td>
                {activeColumns.map(column => (
                  <td key={column.id} className='p-2'>
                    {isEvaluating ? (
                      <span className='text-muted-foreground'>...</span>
                    ) : (
                      renderValue(
                        getCalculatedValue(lead.id, column.column_name),
                        column.result_type
                      )
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {leads.length > 10 && (
        <div className='text-sm text-muted-foreground mt-2 text-center'>
          Showing first 10 leads. Full evaluation available in exports.
        </div>
      )}
    </div>
  )
}
