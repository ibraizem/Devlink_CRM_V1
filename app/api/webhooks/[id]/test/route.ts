import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(cookies());
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: webhook, error: fetchError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError) throw fetchError;
    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const testPayload = {
      test: true,
      message: 'This is a test webhook delivery',
      timestamp: new Date().toISOString(),
    };

    const delivery = await supabase
      .from('webhook_deliveries')
      .insert({
        webhook_id: webhook.id,
        event_type: 'lead.created',
        payload: testPayload,
        transformed_payload: testPayload,
        status: 'pending',
        retry_count: 0,
      })
      .select()
      .single();

    if (delivery.error) throw delivery.error;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Webhook-Event': 'lead.created',
        'X-Webhook-Delivery-Id': delivery.data.id,
        'X-Webhook-Test': 'true',
        ...webhook.headers,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), webhook.timeout || 30000);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(testPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseBody = await response.text();

      await supabase
        .from('webhook_deliveries')
        .update({
          status: response.ok ? 'success' : 'failed',
          response_status: response.status,
          response_body: responseBody.substring(0, 10000),
          delivered_at: new Date().toISOString(),
        })
        .eq('id', delivery.data.id);

      return NextResponse.json({
        success: response.ok,
        message: response.ok ? 'Test webhook sent successfully' : 'Test webhook failed',
        status: response.status,
        response: responseBody.substring(0, 500),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await supabase
        .from('webhook_deliveries')
        .update({
          status: 'failed',
          error_message: errorMessage,
        })
        .eq('id', delivery.data.id);

      return NextResponse.json({
        success: false,
        message: 'Test webhook failed',
        error: errorMessage,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error testing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to test webhook' },
      { status: 500 }
    );
  }
}
