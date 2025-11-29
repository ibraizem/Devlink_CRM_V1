import { BaseIntegrationConnector, IntegrationConfig, ConnectionTestResult, IntegrationCredentials } from '../types';
import { OAuth2Adapter } from '../auth/oauth2-adapter';

export interface OutlookMessage {
  id: string;
  subject: string;
  from: string;
  to: string[];
  body: string;
  bodyPreview: string;
  receivedDateTime: Date;
  isRead: boolean;
}

export interface OutlookEvent {
  id: string;
  subject: string;
  start: Date;
  end: Date;
  attendees: string[];
  location?: string;
  body?: string;
}

export class OutlookConnector extends BaseIntegrationConnector {
  private oauth2Adapter?: OAuth2Adapter;
  private readonly baseUrl = 'https://graph.microsoft.com/v1.0';

  constructor(config: IntegrationConfig) {
    super(config);
    
    if (config.credentials?.clientId && config.credentials?.clientSecret) {
      this.oauth2Adapter = new OAuth2Adapter({
        clientId: config.credentials.clientId,
        clientSecret: config.credentials.clientSecret,
        authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        redirectUri: config.metadata?.redirectUri || '',
        scope: ['Mail.Send', 'Mail.Read', 'Calendars.ReadWrite', 'User.Read'],
      });
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}/me`, {
        headers: this.getHeaders(),
      });

      const latency = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: 'Outlook connection successful',
          latency,
          metadata: { email: data.mail || data.userPrincipalName },
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

  async sendEmail(to: string[], subject: string, body: string, isHtml: boolean = false): Promise<{ success: boolean; error?: string }> {
    try {
      const message = {
        message: {
          subject,
          body: {
            contentType: isHtml ? 'HTML' : 'Text',
            content: body,
          },
          toRecipients: to.map(email => ({
            emailAddress: { address: email },
          })),
        },
        saveToSentItems: true,
      };

      const response = await fetch(`${this.baseUrl}/me/sendMail`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(message),
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

  async getMessages(top: number = 10, filter?: string): Promise<OutlookMessage[]> {
    try {
      const params = new URLSearchParams({
        $top: top.toString(),
        $orderby: 'receivedDateTime DESC',
        ...(filter && { $filter: filter }),
      });

      const response = await fetch(`${this.baseUrl}/me/messages?${params}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }

      const data = await response.json();
      return (data.value || []).map((msg: any) => this.parseMessage(msg));
    } catch (error) {
      console.error('Error fetching Outlook messages:', error);
      return [];
    }
  }

  async createEvent(
    subject: string,
    start: Date,
    end: Date,
    attendees: string[],
    body?: string,
    location?: string
  ): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      const event = {
        subject,
        start: {
          dateTime: start.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: end.toISOString(),
          timeZone: 'UTC',
        },
        attendees: attendees.map(email => ({
          emailAddress: { address: email },
          type: 'required',
        })),
        ...(body && { body: { contentType: 'HTML', content: body } }),
        ...(location && { location: { displayName: location } }),
      };

      const response = await fetch(`${this.baseUrl}/me/events`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(event),
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, eventId: data.id };
      }

      const error = await response.text();
      return { success: false, error };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getEvents(top: number = 10): Promise<OutlookEvent[]> {
    try {
      const params = new URLSearchParams({
        $top: top.toString(),
        $orderby: 'start/dateTime',
      });

      const response = await fetch(`${this.baseUrl}/me/events?${params}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.statusText}`);
      }

      const data = await response.json();
      return (data.value || []).map((event: any) => this.parseEvent(event));
    } catch (error) {
      console.error('Error fetching Outlook events:', error);
      return [];
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

  private parseMessage(data: any): OutlookMessage {
    return {
      id: data.id,
      subject: data.subject || '',
      from: data.from?.emailAddress?.address || '',
      to: (data.toRecipients || []).map((r: any) => r.emailAddress.address),
      body: data.body?.content || '',
      bodyPreview: data.bodyPreview || '',
      receivedDateTime: new Date(data.receivedDateTime),
      isRead: data.isRead || false,
    };
  }

  private parseEvent(data: any): OutlookEvent {
    return {
      id: data.id,
      subject: data.subject || '',
      start: new Date(data.start.dateTime),
      end: new Date(data.end.dateTime),
      attendees: (data.attendees || []).map((a: any) => a.emailAddress.address),
      location: data.location?.displayName,
      body: data.body?.content,
    };
  }
}
