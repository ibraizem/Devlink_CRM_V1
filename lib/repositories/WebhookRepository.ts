import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository } from './BaseRepository';
import { Webhook, WebhookDelivery } from '@/types/webhooks';

export class WebhookRepository extends BaseRepository<Webhook> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'webhooks');
  }

  async getAllWebhooks(): Promise<Webhook[]> {
    return this.getAll();
  }

  async getWebhookById(id: string): Promise<Webhook | null> {
    return this.getById(id);
  }

  async createWebhook(data: Omit<Webhook, 'id' | 'created_at' | 'updated_at'>): Promise<Webhook> {
    return this.create(data);
  }

  async updateWebhook(id: string, data: Partial<Webhook>): Promise<Webhook> {
    return this.update(id, data);
  }

  async deleteWebhook(id: string): Promise<boolean> {
    return this.delete(id);
  }

  async getActiveWebhooksForEvent(eventType: string): Promise<Webhook[]> {
    const { data, error } = await this.supabase
      .from('webhooks')
      .select('*')
      .eq('status', 'active')
      .contains('events', [eventType]);

    if (error) throw error;
    return data as Webhook[];
  }
}

export class WebhookDeliveryRepository extends BaseRepository<WebhookDelivery> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'webhook_deliveries');
  }

  async getDeliveriesByWebhookId(webhookId: string, limit = 50): Promise<WebhookDelivery[]> {
    const { data, error } = await this.supabase
      .from('webhook_deliveries')
      .select('*')
      .eq('webhook_id', webhookId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as WebhookDelivery[];
  }

  async getPendingRetries(): Promise<WebhookDelivery[]> {
    const { data, error } = await this.supabase
      .from('webhook_deliveries')
      .select('*')
      .eq('status', 'pending')
      .not('next_retry_at', 'is', null)
      .lte('next_retry_at', new Date().toISOString());

    if (error) throw error;
    return data as WebhookDelivery[];
  }

  async createDelivery(data: Omit<WebhookDelivery, 'id' | 'created_at'>): Promise<WebhookDelivery> {
    return this.create(data);
  }

  async updateDelivery(id: string, data: Partial<WebhookDelivery>): Promise<WebhookDelivery> {
    return this.update(id, data);
  }
}
