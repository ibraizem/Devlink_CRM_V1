import { NextRequest, NextResponse } from 'next/server'
import { makeCall } from '@/lib/api/calls/onoff'
import { createClient } from '@/lib/utils/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { leadId, phoneNumber } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
    }

    const onoffApiKey = process.env.ONOFF_API_KEY
    const { data, error } = await makeCall(phoneNumber, onoffApiKey)

    if (error || !data) {
      return NextResponse.json({ error: 'Failed to make call' }, { status: 500 })
    }

    if (leadId) {
      const supabase = createClient(await cookies())
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('historique_actions').insert({
        lead_id: leadId,
        agent_id: user?.id,
        type_action: 'appel',
        description: `Appel vers ${phoneNumber}`,
        metadata: { phone: phoneNumber, call_data: data },
      })

      await supabase
        .from('leads')
        .update({ dernier_contact: new Date().toISOString() })
        .eq('id', leadId)
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
