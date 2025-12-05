import { useState, useEffect } from 'react'
import { CalculatedColumn } from '@/lib/services/calculatedColumnService'

export function useCalculatedColumns() {
  const [columns, setColumns] = useState<CalculatedColumn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadColumns()
  }, [])

  const loadColumns = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/calculated-columns')
      if (response.ok) {
        const { data } = await response.json()
        setColumns(data || [])
      } else {
        setError('Failed to load columns')
      }
    } catch (err) {
      setError('Failed to load columns')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const evaluateColumn = async (
    columnId: string,
    leadId: string,
    leadData: Record<string, any>,
    forceRefresh = false
  ): Promise<{ result: any; fromCache: boolean; error: string | null }> => {
    try {
      const response = await fetch(`/api/calculated-columns/${columnId}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, leadData, forceRefresh })
      })

      if (response.ok) {
        const { result, fromCache } = await response.json()
        return { result, fromCache, error: null }
      } else {
        const { error } = await response.json()
        return { result: null, fromCache: false, error }
      }
    } catch (err) {
      return { result: null, fromCache: false, error: 'Evaluation failed' }
    }
  }

  const evaluateColumnsForLeads = async (
    columnId: string,
    leads: Array<{ id: string; data: Record<string, any> }>
  ): Promise<Record<string, any>> => {
    try {
      const response = await fetch(`/api/calculated-columns/${columnId}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads })
      })

      if (response.ok) {
        const { results } = await response.json()
        return results
      }
      return {}
    } catch (err) {
      console.error('Batch evaluation failed:', err)
      return {}
    }
  }

  return {
    columns,
    isLoading,
    error,
    loadColumns,
    evaluateColumn,
    evaluateColumnsForLeads
  }
}
