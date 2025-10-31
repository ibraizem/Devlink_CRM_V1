import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/api/emails/outlook';
import { createClient } from '@/lib/utils/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { leadId, to, subject, body } = await request.json();

    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'To, subject, and body required' }, { status: 400 });
    }

    const outlookToken = process.env.OUTLOOK_ACCESS_TOKEN;
    const { data, error } = await sendEmail(to, subject, body, outlookToken);

    if (error || !data) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    if (leadId) {
      const supabase = createClient(cookies());
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('historique_actions').insert({
        lead_id: leadId,
        agent_id: user?.id,
        type_action: 'email',
        description: `Email envoyé à ${to}`,
        metadata: { to, subject, body },
      });

      await supabase
        .from('leads')
        .update({ dernier_contact: new Date().toISOString() })
        .eq('id', leadId);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
