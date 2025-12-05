import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/utils/supabase/server'
import { validateFormula } from '@/lib/formula-engine/evaluator'

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
    const { formula } = body

    if (!formula) {
      return NextResponse.json(
        { error: 'Formula is required' },
        { status: 400 }
      )
    }

    const validation = validateFormula(formula)

    return NextResponse.json(validation)
  } catch (error) {
    console.error('Formula validation error:', error)
    return NextResponse.json(
      {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      },
      { status: 500 }
    )
  }
}
