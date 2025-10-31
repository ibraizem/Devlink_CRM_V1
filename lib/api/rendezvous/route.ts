import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';
import { cookies } from 'next/headers';
import { createCalendlyEvent } from '@/lib/api/rendezvous/calendly';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(cookies());
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');

    let query = supabase.from('rendezvous').select('*');

    if (leadId) {
      query = query.eq('lead_id', leadId);
    }

    const { data, error } = await query.order('date_heure', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(cookies());
    const body = await request.json();
    const { lead_id, date_heure, duree_minutes, canal, notes } = body;

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('rendezvous')
      .insert({
        lead_id,
        agent_id: user?.id,
        date_heure,
        duree_minutes: duree_minutes || 30,
        canal: canal || 'visio',
        notes,
        statut: 'planifie',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await supabase.from('historique_actions').insert({
      lead_id,
      agent_id: user?.id,
      type_action: 'rdv_cree',
      description: `Rendez-vous créé pour le ${new Date(date_heure).toLocaleString('fr-FR')}`,
      metadata: { rdv_id: data.id, date_heure },
    });

    await supabase
      .from('leads')
      .update({ statut: 'rdv_planifie' })
      .eq('id', lead_id);

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
