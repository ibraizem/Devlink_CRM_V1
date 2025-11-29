import { WebhookEventType } from '@/types/webhooks';

export async function triggerWebhooks(eventType: WebhookEventType, payload: Record<string, any>): Promise<void> {
  try {
    if (typeof window === 'undefined') {
      return;
    }

    await fetch('/api/webhooks/trigger', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: eventType,
        payload,
      }),
    });
  } catch (error) {
    console.error('Error triggering webhooks:', error);
  }
}
