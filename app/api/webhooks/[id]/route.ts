import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(cookies());
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching webhook:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(cookies());
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const { data, error } = await supabase
      .from('webhooks')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error updating webhook:', error);
    return NextResponse.json(
      { error: 'Failed to update webhook' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(cookies());
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('webhooks')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return NextResponse.json(
      { error: 'Failed to delete webhook' },
      { status: 500 }
    );
  }
}
