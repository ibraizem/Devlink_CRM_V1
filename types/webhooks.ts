export type WebhookStatus = 'active' | 'inactive' | 'failed';
export type WebhookDeliveryStatus = 'pending' | 'success' | 'failed' | 'retrying';
export type WebhookEventType = 
  | 'lead.created'
  | 'lead.updated'
  | 'lead.deleted'
  | 'lead.status_changed'
  | 'appointment.created'
  | 'appointment.updated'
  | 'appointment.cancelled'
  | 'file.uploaded'
  | 'file.deleted';

export interface Webhook {
  id: string;
  name: string;
  url: string;
  description?: string;
  status: WebhookStatus;
  secret_key: string;
  events: WebhookEventType[];
  headers?: Record<string, string>;
  transform_enabled: boolean;
  transform_script?: string;
  retry_enabled: boolean;
  max_retries: number;
  retry_delay: number;
  timeout: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  last_triggered_at?: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: WebhookEventType;
  payload: Record<string, any>;
  transformed_payload?: Record<string, any>;
  status: WebhookDeliveryStatus;
  response_status?: number;
  response_body?: string;
  error_message?: string;
  retry_count: number;
  next_retry_at?: string;
  delivered_at?: string;
  created_at: string;
}

export interface WebhookEvent {
  event_type: WebhookEventType;
  payload: Record<string, any>;
  timestamp: string;
}

export interface WebhookStats {
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  pending_deliveries: number;
  success_rate: number;
}
