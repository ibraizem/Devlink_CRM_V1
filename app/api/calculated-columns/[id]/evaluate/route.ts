import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/utils/supabase/server'
import { evaluateColumnForLead, evaluateColumnForLeads } from '@/lib/services/calculatedColumnService'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { leadId, leadData, leads, forceRefresh } = body

    if (leads && Array.isArray(leads)) {
      const results = await evaluateColumnForLeads(params.id, leads)
      const resultsObj = Object.fromEntries(results)
      
      return NextResponse.json({
        success: true,
        results: resultsObj
      })
    }

    if (!leadId || !leadData) {
      return NextResponse.json(
        { error: 'leadId and leadData are required' },
        { status: 400 }
      )
    }

    const { data, error, fromCache } = await evaluateColumnForLead(
      params.id,
      leadId,
      leadData,
      forceRefresh
    )

    if (error) {
      return NextResponse.json(
        { error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      result: data,
      fromCache
    })
  } catch (error) {
    console.error('Evaluate column error:', error)
    return NextResponse.json(
      { error: 'Failed to evaluate column' },
      { status: 500 }
    )
  }
}
