import { NextRequest, NextResponse } from 'next/server';
import { createClient, getUserProfileId } from '@/lib/utils/supabase/server';
import { cookies } from 'next/headers';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const supabase = createClient(await cookies());

    const { data, error } = await supabase
      .from('webhooks')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching webhooks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch webhooks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const profileId = await getUserProfileId();
    if (!profileId) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const supabase = createClient(await cookies());
    const body = await request.json();

    const secretKey = generateSecretKey()

    const { data, error } = await supabase
      .from('webhooks')
      .insert({
        ...body,
        secret_key: secretKey,
        created_by: profileId,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error creating webhook:', error)
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    )
  }
}

function generateSecretKey(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}
