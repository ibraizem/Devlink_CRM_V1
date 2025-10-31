import { OnOffCall, OnOffCallHistory, OnOffCallOptions, OnOffRecording } from './types';

export class OnOffClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(apiKey: string) {
    this.baseUrl = process.env.NEXT_PUBLIC_ONOFF_API_URL || 'https://api.onoff.io';
    this.apiKey = apiKey;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `OnOff API error: ${response.status} ${response.statusText} - ${error.message || 'Unknown error'}`
      );
    }

    return response.json();
  }

  /**
   * Passer un appel téléphonique
   */
  async makeCall(options: OnOffCallOptions): Promise<OnOffCall> {
    return this.request<OnOffCall>('/v1/calls', {
      method: 'POST',
      body: JSON.stringify({
        to: options.to,
        from: options.from,
        caller_id: options.callerId,
        timeout: options.timeout || 30,
        record: options.record || false,
        tags: options.tags || [],
        custom_data: options.customData || {},
      }),
    });
  }

  /**
   * Obtenir les détails d'un appel
   */
  async getCall(callId: string): Promise<OnOffCall> {
    return this.request<OnOffCall>(`/v1/calls/${callId}`);
  }

  /**
   * Terminer un appel en cours
   */
  async endCall(callId: string): Promise<OnOffCall> {
    return this.request<OnOffCall>(`/v1/calls/${callId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Obtenir l'historique des appels
   */
  async getCallHistory(params: {
    page?: number;
    pageSize?: number;
    from?: string;
    to?: string;
    status?: string;
    direction?: 'inbound' | 'outbound';
  } = {}): Promise<OnOffCallHistory> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.pageSize) query.append('page_size', params.pageSize.toString());
    if (params.from) query.append('from', params.from);
    if (params.to) query.append('to', params.to);
    if (params.status) query.append('status', params.status);
    if (params.direction) query.append('direction', params.direction);

    return this.request<OnOffCallHistory>(`/v1/calls?${query.toString()}`);
  }

  /**
   * Télécharger l'enregistrement d'un appel
   */
  async downloadRecording(callId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/v1/calls/${callId}/recording`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download recording: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Ajouter une note à un appel
   */
  async addCallNote(callId: string, note: string): Promise<OnOffCall> {
    return this.request<OnOffCall>(`/v1/calls/${callId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content: note }),
    });
  }

  /**
   * Mettre à jour les tags d'un appel
   */
  async updateCallTags(callId: string, tags: string[]): Promise<OnOffCall> {
    return this.request<OnOffCall>(`/v1/calls/${callId}/tags`, {
      method: 'PUT',
      body: JSON.stringify({ tags }),
    });
  }
}
