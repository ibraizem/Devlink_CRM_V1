import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/utils/supabase/server'
import { createCalculatedColumn, getCalculatedColumns } from '@/lib/services/calculatedColumnService'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') !== 'false'

    const { data, error } = await getCalculatedColumns(activeOnly)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Get columns error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch columns' },
      { status: 500 }
    )
  }
}

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
    const { column_name, formula, formula_type, result_type, cache_duration } = body

    if (!column_name || !formula) {
      return NextResponse.json(
        { error: 'column_name and formula are required' },
        { status: 400 }
      )
    }

    const { data, error } = await createCalculatedColumn({
      column_name,
      formula,
      formula_type: formula_type || 'calculation',
      result_type: result_type || 'text',
      is_active: true,
      cache_duration: cache_duration ?? 3600
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Create column error:', error)
    return NextResponse.json(
      { error: 'Failed to create column' },
      { status: 500 }
    )
  }
}
