export interface OnOffCallOptions {
  to: string;
  from?: string;
  callerId?: string;
  timeout?: number;
  record?: boolean;
  tags?: string[];
  customData?: Record<string, any>;
}

export interface OnOffCall {
  id: string;
  status: 'initiated' | 'ringing' | 'in-progress' | 'completed' | 'busy' | 'failed' | 'no-answer';
  direction: 'outbound' | 'inbound';
  from: string;
  to: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  recordingUrl?: string;
  tags?: string[];
  customData?: Record<string, any>;
  price?: number;
  priceUnit?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface OnOffCallHistory {
  calls: OnOffCall[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface OnOffRecording {
  id: string;
  callId: string;
  url: string;
  duration: number;
  format: 'mp3' | 'wav';
  createdAt: string;
}
