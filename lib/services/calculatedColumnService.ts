import { createClient } from '@/lib/utils/supabase/client'
import { evaluateFormula, validateFormula } from '@/lib/formula-engine/evaluator'

export interface CalculatedColumn {
  id: string
  user_id: string
  column_name: string
  formula: string
  formula_type: 'calculation' | 'ai_enrichment'
  result_type: 'text' | 'number' | 'boolean'
  is_active: boolean
  cache_duration: number | null
  created_at: string
  updated_at: string
}

export interface CalculatedResult {
  id: string
  column_id: string
  lead_id: string
  result_value: any
  computed_at: string
  expires_at: string | null
}

export async function createCalculatedColumn(
  columnData: Omit<CalculatedColumn, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<{ data: CalculatedColumn | null; error: any }> {
  const supabase = createClient()

  const validation = validateFormula(columnData.formula)
  if (!validation.valid) {
    return {
      data: null,
      error: { message: `Invalid formula: ${validation.error}` }
    }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } }
  }

  const { data, error } = await supabase
    .from('calculated_columns')
    .insert({
      user_id: user.id,
      ...columnData
    })
    .select()
    .single()

  return { data, error }
}

export async function updateCalculatedColumn(
  columnId: string,
  updates: Partial<Omit<CalculatedColumn, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<{ data: CalculatedColumn | null; error: any }> {
  const supabase = createClient()

  if (updates.formula) {
    const validation = validateFormula(updates.formula)
    if (!validation.valid) {
      return {
        data: null,
        error: { message: `Invalid formula: ${validation.error}` }
      }
    }
  }

  const { data, error } = await supabase
    .from('calculated_columns')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', columnId)
    .select()
    .single()

  if (!error && data) {
    await supabase
      .from('calculated_results')
      .delete()
      .eq('column_id', columnId)
  }

  return { data, error }
}

export async function deleteCalculatedColumn(
  columnId: string
): Promise<{ error: any }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('calculated_columns')
    .delete()
    .eq('id', columnId)

  return { error }
}

export async function getCalculatedColumns(
  activeOnly: boolean = true
): Promise<{ data: CalculatedColumn[] | null; error: any }> {
  const supabase = createClient()

  let query = supabase
    .from('calculated_columns')
    .select('*')
    .order('created_at', { ascending: false })

  if (activeOnly) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  return { data, error }
}

export async function getCalculatedColumn(
  columnId: string
): Promise<{ data: CalculatedColumn | null; error: any }> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('calculated_columns')
    .select('*')
    .eq('id', columnId)
    .single()

  return { data, error }
}

export async function evaluateColumnForLead(
  columnId: string,
  leadId: string,
  leadData: Record<string, any>,
  forceRefresh: boolean = false
): Promise<{ data: any; error: any; fromCache: boolean }> {
  const supabase = createClient()

  if (!forceRefresh) {
    const { data: cachedResult } = await supabase
      .from('calculated_results')
      .select('*')
      .eq('column_id', columnId)
      .eq('lead_id', leadId)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (cachedResult) {
      return {
        data: cachedResult.result_value,
        error: null,
        fromCache: true
      }
    }
  }

  const { data: column, error: columnError } = await getCalculatedColumn(columnId)
  if (columnError || !column) {
    return { data: null, error: columnError || 'Column not found', fromCache: false }
  }

  try {
    const result = await evaluateFormula(column.formula, leadData)

    const expiresAt = column.cache_duration
      ? new Date(Date.now() + column.cache_duration * 1000).toISOString()
      : null

    await supabase.from('calculated_results').upsert({
      column_id: columnId,
      lead_id: leadId,
      result_value: result,
      computed_at: new Date().toISOString(),
      expires_at: expiresAt
    })

    return { data: result, error: null, fromCache: false }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Evaluation failed',
      fromCache: false
    }
  }
}

export async function evaluateColumnForLeads(
  columnId: string,
  leads: Array<{ id: string; data: Record<string, any> }>
): Promise<Map<string, any>> {
  const results = new Map<string, any>()

  await Promise.all(
    leads.map(async (lead) => {
      const { data, error } = await evaluateColumnForLead(
        columnId,
        lead.id,
        lead.data
      )
      if (!error) {
        results.set(lead.id, data)
      }
    })
  )

  return results
}

export async function getLeadCalculatedValues(
  leadId: string
): Promise<{ data: Record<string, any> | null; error: any }> {
  const supabase = createClient()

  const { data: results, error } = await supabase
    .from('calculated_results')
    .select(`
      *,
      calculated_columns(column_name, is_active)
    `)
    .eq('lead_id', leadId)

  if (error) {
    return { data: null, error }
  }

  const values: Record<string, any> = {}
  if (results) {
    for (const result of results) {
      const col = result.calculated_columns as any
      if (col && col.is_active) {
        values[col.column_name] = result.result_value
      }
    }
  }

  return { data: values, error: null }
}

export async function clearExpiredCache(): Promise<{ deleted: number; error: any }> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('calculated_results')
    .delete()
    .lt('expires_at', new Date().toISOString())

  return { deleted: data?.length || 0, error }
}

export async function clearColumnCache(columnId: string): Promise<{ error: any }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('calculated_results')
    .delete()
    .eq('column_id', columnId)

  return { error }
}
