import { BaseIntegrationConnector, IntegrationConfig, ConnectionTestResult, IntegrationCredentials, AuthType, IntegrationType } from '../types';
import { OAuth2Adapter } from '../auth/oauth2-adapter';

export interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string[];
  body: string;
  date: Date;
  labels: string[];
}

export class GmailConnector extends BaseIntegrationConnector {
  private oauth2Adapter?: OAuth2Adapter;
  private readonly baseUrl = 'https://gmail.googleapis.com/gmail/v1';

  constructor(config: IntegrationConfig) {
    super(config);
    
    if (config.credentials?.clientId && config.credentials?.clientSecret) {
      this.oauth2Adapter = new OAuth2Adapter({
        clientId: config.credentials.clientId,
        clientSecret: config.credentials.clientSecret,
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        redirectUri: config.metadata?.redirectUri || '',
        scope: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly'],
      });
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}/users/me/profile`, {
        headers: this.getHeaders(),
      });

      const latency = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: 'Gmail connection successful',
          latency,
          metadata: { email: data.emailAddress },
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

  async sendEmail(to: string[], subject: string, body: string, html: boolean = false): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const email = this.createEmailMessage(to, subject, body, html);
      const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const response = await fetch(`${this.baseUrl}/users/me/messages/send`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ raw: encodedEmail }),
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, messageId: data.id };
      }

      const error = await response.text();
      return { success: false, error };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getMessages(maxResults: number = 10, query?: string): Promise<GmailMessage[]> {
    try {
      const params = new URLSearchParams({
        maxResults: maxResults.toString(),
        ...(query && { q: query }),
      });

      const response = await fetch(`${this.baseUrl}/users/me/messages?${params}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }

      const data = await response.json();
      const messages: GmailMessage[] = [];

      for (const msg of data.messages || []) {
        const fullMessage = await this.getMessage(msg.id);
        if (fullMessage) {
          messages.push(fullMessage);
        }
      }

      return messages;
    } catch (error) {
      console.error('Error fetching Gmail messages:', error);
      return [];
    }
  }

  async getMessage(messageId: string): Promise<GmailMessage | null> {
    try {
      const response = await fetch(`${this.baseUrl}/users/me/messages/${messageId}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return this.parseMessage(data);
    } catch (error) {
      console.error('Error fetching Gmail message:', error);
      return null;
    }
  }

  async refreshCredentials(): Promise<IntegrationCredentials> {
    if (!this.oauth2Adapter || !this.credentials.refreshToken) {
      throw new Error('OAuth2 adapter not configured or refresh token missing');
    }

    return await this.oauth2Adapter.refreshAccessToken(this.credentials.refreshToken);
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  private createEmailMessage(to: string[], subject: string, body: string, html: boolean): string {
    const headers = [
      `To: ${to.join(', ')}`,
      `Subject: ${subject}`,
      `Content-Type: ${html ? 'text/html' : 'text/plain'}; charset=utf-8`,
    ];

    return headers.join('\r\n') + '\r\n\r\n' + body;
  }

  private parseMessage(data: any): GmailMessage {
    const headers = data.payload?.headers || [];
    const getHeader = (name: string) => headers.find((h: any) => h.name === name)?.value || '';

    return {
      id: data.id,
      threadId: data.threadId,
      subject: getHeader('Subject'),
      from: getHeader('From'),
      to: getHeader('To').split(',').map((email: string) => email.trim()),
      body: this.getMessageBody(data.payload),
      date: new Date(parseInt(data.internalDate)),
      labels: data.labelIds || [],
    };
  }

  private getMessageBody(payload: any): string {
    if (payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
          return Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
      }
    }

    return '';
  }
}
