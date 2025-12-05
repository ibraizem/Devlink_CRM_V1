import { createClient } from '@/lib/utils/supabase/client';
import { 
  Webhook, 
  WebhookDelivery, 
  WebhookEvent, 
  WebhookEventType, 
  WebhookStats,
  WebhookDeliveryStatus 
} from '@/types/webhooks';

const supabase = createClient();

class WebhookService {
  async getWebhooks(): Promise<Webhook[]> {
    try {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      throw error;
    }
  }

  async getWebhook(id: string): Promise<Webhook | null> {
    try {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching webhook:', error);
      return null;
    }
  }

  async createWebhook(webhook: Omit<Webhook, 'id' | 'created_at' | 'updated_at' | 'secret_key'>, clerkUserId: string): Promise<Webhook> {
    try {
      if (!clerkUserId) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('users_profile')
        .select('id')
        .eq('clerk_user_id', clerkUserId)
        .maybeSingle();
      
      if (!profile) throw new Error('User profile not found');

      const secretKey = this.generateSecretKey();

      const { data, error } = await supabase
        .from('webhooks')
        .insert({
          ...webhook,
          secret_key: secretKey,
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating webhook:', error);
      throw error;
    }
  }

  async updateWebhook(id: string, updates: Partial<Webhook>): Promise<Webhook> {
    try {
      const { data, error } = await supabase
        .from('webhooks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating webhook:', error);
      throw error;
    }
  }

  async deleteWebhook(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting webhook:', error);
      throw error;
    }
  }

  async toggleWebhookStatus(id: string, status: 'active' | 'inactive'): Promise<Webhook> {
    return this.updateWebhook(id, { status });
  }

  async regenerateSecretKey(id: string): Promise<string> {
    const secretKey = this.generateSecretKey();
    await this.updateWebhook(id, { secret_key: secretKey });
    return secretKey;
  }

  async getDeliveries(webhookId: string, limit = 50): Promise<WebhookDelivery[]> {
    try {
      const { data, error } = await supabase
        .from('webhook_deliveries')
        .select('*')
        .eq('webhook_id', webhookId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      throw error;
    }
  }

  async getDelivery(id: string): Promise<WebhookDelivery | null> {
    try {
      const { data, error } = await supabase
        .from('webhook_deliveries')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching delivery:', error);
      return null;
    }
  }

  async getWebhookStats(webhookId: string): Promise<WebhookStats> {
    try {
      const { data, error } = await supabase
        .from('webhook_deliveries')
        .select('status')
        .eq('webhook_id', webhookId);

      if (error) throw error;

      const stats = (data || []).reduce(
        (acc, delivery) => {
          acc.total_deliveries++;
          if (delivery.status === 'success') acc.successful_deliveries++;
          if (delivery.status === 'failed') acc.failed_deliveries++;
          if (delivery.status === 'pending' || delivery.status === 'retrying') acc.pending_deliveries++;
          return acc;
        },
        {
          total_deliveries: 0,
          successful_deliveries: 0,
          failed_deliveries: 0,
          pending_deliveries: 0,
          success_rate: 0,
        }
      );

      stats.success_rate = stats.total_deliveries > 0
        ? (stats.successful_deliveries / stats.total_deliveries) * 100
        : 0;

      return stats;
    } catch (error) {
      console.error('Error fetching webhook stats:', error);
      return {
        total_deliveries: 0,
        successful_deliveries: 0,
        failed_deliveries: 0,
        pending_deliveries: 0,
        success_rate: 0,
      };
    }
  }

  async triggerWebhook(webhookId: string, event: WebhookEvent): Promise<void> {
    try {
      const webhook = await this.getWebhook(webhookId);
      if (!webhook || webhook.status !== 'active') {
        throw new Error('Webhook is not active');
      }

      if (!webhook.events.includes(event.event_type)) {
        return;
      }

      const delivery = await this.createDelivery(webhook, event);
      await this.deliverWebhook(webhook, delivery);
    } catch (error) {
      console.error('Error triggering webhook:', error);
      throw error;
    }
  }

  async triggerWebhooksForEvent(eventType: WebhookEventType, payload: Record<string, any>): Promise<void> {
    try {
      const { data: webhooks, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('status', 'active')
        .contains('events', [eventType]);

      if (error) throw error;
      if (!webhooks || webhooks.length === 0) return;

      const event: WebhookEvent = {
        event_type: eventType,
        payload,
        timestamp: new Date().toISOString(),
      };

      await Promise.all(
        webhooks.map(webhook => this.triggerWebhook(webhook.id, event))
      );
    } catch (error) {
      console.error('Error triggering webhooks for event:', error);
    }
  }

  async retryDelivery(deliveryId: string): Promise<void> {
    try {
      const delivery = await this.getDelivery(deliveryId);
      if (!delivery) throw new Error('Delivery not found');

      const webhook = await this.getWebhook(delivery.webhook_id);
      if (!webhook) throw new Error('Webhook not found');

      await this.deliverWebhook(webhook, delivery);
    } catch (error) {
      console.error('Error retrying delivery:', error);
      throw error;
    }
  }

  private async createDelivery(webhook: Webhook, event: WebhookEvent): Promise<WebhookDelivery> {
    let transformedPayload = event.payload;

    if (webhook.transform_enabled && webhook.transform_script) {
      try {
        transformedPayload = this.transformPayload(event.payload, webhook.transform_script);
      } catch (error) {
        console.error('Error transforming payload:', error);
      }
    }

    const { data, error } = await supabase
      .from('webhook_deliveries')
      .insert({
        webhook_id: webhook.id,
        event_type: event.event_type,
        payload: event.payload,
        transformed_payload: transformedPayload,
        status: 'pending',
        retry_count: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private async deliverWebhook(webhook: Webhook, delivery: WebhookDelivery): Promise<void> {
    try {
      await supabase
        .from('webhook_deliveries')
        .update({ status: 'retrying' })
        .eq('id', delivery.id);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': this.generateSignature(
          delivery.transformed_payload || delivery.payload,
          webhook.secret_key
        ),
        'X-Webhook-Event': delivery.event_type,
        'X-Webhook-Delivery-Id': delivery.id,
        ...webhook.headers,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), webhook.timeout);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(delivery.transformed_payload || delivery.payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseBody = await response.text();
      const status: WebhookDeliveryStatus = response.ok ? 'success' : 'failed';

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
        await this.scheduleRetry(webhook, delivery);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await supabase
        .from('webhook_deliveries')
        .update({
          status: 'failed',
          error_message: errorMessage,
          retry_count: delivery.retry_count + 1,
        })
        .eq('id', delivery.id);

      if (webhook.retry_enabled && delivery.retry_count < webhook.max_retries) {
        await this.scheduleRetry(webhook, delivery);
      } else {
        await supabase
          .from('webhooks')
          .update({ status: 'failed' })
          .eq('id', webhook.id);
      }
    }
  }

  private async scheduleRetry(webhook: Webhook, delivery: WebhookDelivery): Promise<void> {
    const delay = this.calculateRetryDelay(delivery.retry_count, webhook.retry_delay);
    const nextRetryAt = new Date(Date.now() + delay);

    await supabase
      .from('webhook_deliveries')
      .update({
        next_retry_at: nextRetryAt.toISOString(),
        status: 'pending',
      })
      .eq('id', delivery.id);
  }

  private calculateRetryDelay(retryCount: number, baseDelay: number): number {
    return baseDelay * Math.pow(2, retryCount) * 1000;
  }

  private transformPayload(payload: Record<string, any>, script: string): Record<string, any> {
    try {
      const transformFunction = new Function('payload', script);
      return transformFunction(payload);
    } catch (error) {
      console.error('Transform script error:', error);
      return payload;
    }
  }

  private generateSignature(payload: Record<string, any>, secret: string): string {
    const payloadString = JSON.stringify(payload);
    return btoa(`${secret}:${payloadString}`);
  }

  private generateSecretKey(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  async testWebhook(webhookId: string): Promise<{ success: boolean; message: string }> {
    try {
      const webhook = await this.getWebhook(webhookId);
      if (!webhook) {
        return { success: false, message: 'Webhook not found' };
      }

      const testEvent: WebhookEvent = {
        event_type: 'lead.created',
        payload: {
          test: true,
          message: 'This is a test webhook delivery',
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      await this.triggerWebhook(webhookId, testEvent);
      return { success: true, message: 'Test webhook sent successfully' };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to send test webhook' 
      };
    }
  }
}

export const webhookService = new WebhookService();
