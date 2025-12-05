import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/utils/supabase/server'
import { evaluateFormula } from '@/lib/formula-engine/evaluator'

export async function POST(request: NextRequest) {
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
    const { formula, context } = body

    if (!formula) {
      return NextResponse.json(
        { error: 'Formula is required' },
        { status: 400 }
      )
    }

    const result = await evaluateFormula(formula, context || {})

    return NextResponse.json({
      success: true,
      result
    })
  } catch (error) {
    console.error('Formula evaluation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Evaluation failed'
      },
      { status: 500 }
    )
  }
}
