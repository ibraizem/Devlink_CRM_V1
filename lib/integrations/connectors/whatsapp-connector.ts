import { BaseIntegrationConnector, IntegrationConfig, ConnectionTestResult, IntegrationCredentials } from '../types';
import { ApiKeyAdapter } from '../auth/api-key-adapter';

export interface WhatsAppMessage {
  to: string;
  body: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'document' | 'audio';
}

export interface WhatsAppTemplate {
  name: string;
  language: string;
  parameters?: string[];
}

export class WhatsAppConnector extends BaseIntegrationConnector {
  private apiKeyAdapter?: ApiKeyAdapter;
  private readonly baseUrl = 'https://graph.facebook.com/v18.0';

  constructor(config: IntegrationConfig) {
    super(config);
    
    if (config.credentials?.apiKey) {
      this.apiKeyAdapter = new ApiKeyAdapter({
        key: config.credentials.apiKey,
        queryParamName: 'access_token',
      });
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      const phoneNumberId = this.config.metadata?.phoneNumberId;
      if (!phoneNumberId) {
        return {
          success: false,
          message: 'Phone number ID not configured',
          latency: 0,
        };
      }

      const url = this.apiKeyAdapter 
        ? this.apiKeyAdapter.appendToUrl(`${this.baseUrl}/${phoneNumberId}`)
        : `${this.baseUrl}/${phoneNumberId}`;

      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      const latency = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          message: 'WhatsApp connection successful',
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

  async sendMessage(message: WhatsAppMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const phoneNumberId = this.config.metadata?.phoneNumberId;
      if (!phoneNumberId) {
        return { success: false, error: 'Phone number ID not configured' };
      }

      const payload: any = {
        messaging_product: 'whatsapp',
        to: message.to,
        type: message.mediaUrl ? message.mediaType || 'image' : 'text',
      };

      if (message.mediaUrl) {
        payload[message.mediaType || 'image'] = {
          link: message.mediaUrl,
        };
        if (message.body) {
          payload[message.mediaType || 'image'].caption = message.body;
        }
      } else {
        payload.text = { body: message.body };
      }

      const url = this.apiKeyAdapter 
        ? this.apiKeyAdapter.appendToUrl(`${this.baseUrl}/${phoneNumberId}/messages`)
        : `${this.baseUrl}/${phoneNumberId}/messages`;

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, messageId: data.messages?.[0]?.id };
      }

      const error = await response.text();
      return { success: false, error };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendTemplate(to: string, template: WhatsAppTemplate): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const phoneNumberId = this.config.metadata?.phoneNumberId;
      if (!phoneNumberId) {
        return { success: false, error: 'Phone number ID not configured' };
      }

      const payload = {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: template.name,
          language: { code: template.language },
          ...(template.parameters && {
            components: [{
              type: 'body',
              parameters: template.parameters.map(p => ({ type: 'text', text: p })),
            }],
          }),
        },
      };

      const url = this.apiKeyAdapter 
        ? this.apiKeyAdapter.appendToUrl(`${this.baseUrl}/${phoneNumberId}/messages`)
        : `${this.baseUrl}/${phoneNumberId}/messages`;

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, messageId: data.messages?.[0]?.id };
      }

      const error = await response.text();
      return { success: false, error };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async refreshCredentials(): Promise<IntegrationCredentials> {
    return this.credentials;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...(this.apiKeyAdapter && !this.config.metadata?.useQueryParam ? this.apiKeyAdapter.getAuthHeaders() : {}),
    };
  }
}
