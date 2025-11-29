import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(cookies());
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { event_type, payload } = body;

    if (!event_type || !payload) {
      return NextResponse.json(
        { error: 'Missing event_type or payload' },
        { status: 400 }
      );
    }

    const { data: webhooks, error: webhooksError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('status', 'active')
      .contains('events', [event_type]);

    if (webhooksError) throw webhooksError;

    if (!webhooks || webhooks.length === 0) {
      return NextResponse.json({ 
        message: 'No active webhooks found for this event',
        triggered: 0 
      });
    }

    const deliveryPromises = webhooks.map(async (webhook) => {
      let transformedPayload = payload;

      if (webhook.transform_enabled && webhook.transform_script) {
        try {
          const transformFunction = new Function('payload', `return (${webhook.transform_script})(payload);`);
          transformedPayload = transformFunction(payload);
        } catch (error) {
          console.error('Transform error for webhook', webhook.id, error);
        }
      }

      const { data: delivery, error: deliveryError } = await supabase
        .from('webhook_deliveries')
        .insert({
          webhook_id: webhook.id,
          event_type,
          payload,
          transformed_payload: transformedPayload,
          status: 'pending',
          retry_count: 0,
        })
        .select()
        .single();

      if (deliveryError) {
        console.error('Error creating delivery:', deliveryError);
        return null;
      }

      deliverWebhookAsync(webhook, delivery);
      return delivery.id;
    });

    const deliveryIds = await Promise.all(deliveryPromises);
    const successfulDeliveries = deliveryIds.filter(id => id !== null);

    return NextResponse.json({
      message: 'Webhooks triggered successfully',
      triggered: successfulDeliveries.length,
      delivery_ids: successfulDeliveries,
    });
  } catch (error) {
    console.error('Error triggering webhooks:', error);
    return NextResponse.json(
      { error: 'Failed to trigger webhooks' },
      { status: 500 }
    );
  }
}

async function deliverWebhookAsync(webhook: any, delivery: any) {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': generateSignature(
        delivery.transformed_payload || delivery.payload,
        webhook.secret_key
      ),
      'X-Webhook-Event': delivery.event_type,
      'X-Webhook-Delivery-Id': delivery.id,
      ...webhook.headers,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), webhook.timeout || 30000);

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(delivery.transformed_payload || delivery.payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseBody = await response.text();
    const status = response.ok ? 'success' : 'failed';

    const supabase = createClient(cookies());
    await supabase
      .from('webhook_deliveries')
      .update({
        status,
        response_status: response.status,
        response_body: responseBody.substring(0, 10000),
        delivered_at: new Date().toISOString(),
        retry_count: delivery.retry_count + 1,
      })
      .eq('id', delivery.id);

    await supabase
      .from('webhooks')
      .update({ last_triggered_at: new Date().toISOString() })
      .eq('id', webhook.id);

    if (!response.ok && webhook.retry_enabled && delivery.retry_count < webhook.max_retries) {
      const delay = calculateRetryDelay(delivery.retry_count, webhook.retry_delay);
      const nextRetryAt = new Date(Date.now() + delay);
      
      await supabase
        .from('webhook_deliveries')
        .update({
          next_retry_at: nextRetryAt.toISOString(),
          status: 'pending',
        })
        .eq('id', delivery.id);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    const supabase = createClient(cookies());
    await supabase
      .from('webhook_deliveries')
      .update({
        status: 'failed',
        error_message: errorMessage,
        retry_count: delivery.retry_count + 1,
      })
      .eq('id', delivery.id);

    if (webhook.retry_enabled && delivery.retry_count < webhook.max_retries) {
      const delay = calculateRetryDelay(delivery.retry_count, webhook.retry_delay);
      const nextRetryAt = new Date(Date.now() + delay);
      
      await supabase
        .from('webhook_deliveries')
        .update({
          next_retry_at: nextRetryAt.toISOString(),
          status: 'pending',
        })
        .eq('id', delivery.id);
    }
  }
}

function calculateRetryDelay(retryCount: number, baseDelay: number): number {
  return baseDelay * Math.pow(2, retryCount) * 1000;
}

function generateSignature(payload: Record<string, any>, secret: string): string {
  const payloadString = JSON.stringify(payload);
  return btoa(`${secret}:${payloadString}`);
}
