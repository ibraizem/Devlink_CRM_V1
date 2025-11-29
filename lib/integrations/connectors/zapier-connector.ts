import { BaseIntegrationConnector, IntegrationConfig, ConnectionTestResult, IntegrationCredentials } from '../types';
import { ApiKeyAdapter } from '../auth/api-key-adapter';

export interface ZapierWebhook {
  url: string;
  method?: 'POST' | 'GET' | 'PUT';
  headers?: Record<string, string>;
}

export class ZapierConnector extends BaseIntegrationConnector {
  private apiKeyAdapter?: ApiKeyAdapter;

  constructor(config: IntegrationConfig) {
    super(config);
    
    if (config.credentials?.apiKey) {
      this.apiKeyAdapter = new ApiKeyAdapter({
        key: config.credentials.apiKey,
        headerName: 'X-Api-Key',
      });
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      if (!this.config.webhookUrl) {
        return {
          success: false,
          message: 'No webhook URL configured',
          latency: 0,
        };
      }

      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: true }),
      });

      const latency = Date.now() - startTime;

      if (response.ok || response.status === 200) {
        return {
          success: true,
          message: 'Zapier webhook connection successful',
          latency,
        };
      }

      return {
        success: false,
        message: `Connection failed: ${response.statusText}`,
        latency,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        latency: Date.now() - startTime,
        error: error instanceof Error ? error : undefined,
      };
    }
  }

  async triggerWebhook(data: Record<string, any>, webhookUrl?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const url = webhookUrl || this.config.webhookUrl;
      if (!url) {
        return { success: false, error: 'No webhook URL provided' };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        return { success: true };
      }

      const error = await response.text();
      return { success: false, error };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendLeadData(leadData: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    notes?: string;
    [key: string]: any;
  }): Promise<{ success: boolean; error?: string }> {
    return this.triggerWebhook({
      event: 'lead.created',
      data: leadData,
      timestamp: new Date().toISOString(),
    });
  }

  async sendEventData(eventType: string, eventData: Record<string, any>): Promise<{ success: boolean; error?: string }> {
    return this.triggerWebhook({
      event: eventType,
      data: eventData,
      timestamp: new Date().toISOString(),
    });
  }

  async refreshCredentials(): Promise<IntegrationCredentials> {
    return this.credentials;
  }
}
