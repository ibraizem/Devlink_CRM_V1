export enum IntegrationType {
  EMAIL = 'email',
  CALENDAR = 'calendar',
  MESSAGING = 'messaging',
  AUTOMATION = 'automation',
  CRM = 'crm',
  SOCIAL = 'social',
  COMMUNICATION = 'communication',
}

export enum AuthType {
  OAUTH2 = 'oauth2',
  API_KEY = 'api_key',
  JWT = 'jwt',
  BASIC = 'basic',
  BEARER = 'bearer',
}

export interface IntegrationCredentials {
  type: AuthType;
  accessToken?: string;
  refreshToken?: string;
  apiKey?: string;
  apiSecret?: string;
  clientId?: string;
  clientSecret?: string;
  expiresAt?: Date;
  scope?: string[];
  metadata?: Record<string, any>;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  strategy?: 'fixed' | 'sliding' | 'token-bucket';
}

export interface QuotaConfig {
  daily?: number;
  monthly?: number;
  perUser?: number;
}

export interface IntegrationConfig {
  id: string;
  name: string;
  type: IntegrationType;
  authType: AuthType;
  enabled: boolean;
  credentials?: IntegrationCredentials;
  rateLimit?: RateLimitConfig;
  quota?: QuotaConfig;
  baseUrl?: string;
  webhookUrl?: string;
  metadata?: Record<string, any>;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latency?: number;
  metadata?: Record<string, any>;
  error?: Error;
}

export interface IntegrationEvent {
  id: string;
  integrationId: string;
  type: 'request' | 'response' | 'error' | 'quota_exceeded' | 'rate_limit';
  timestamp: Date;
  data?: any;
  error?: Error;
}

export interface IntegrationUsage {
  integrationId: string;
  requestCount: number;
  quotaUsed: number;
  quotaRemaining: number;
  resetAt: Date;
  lastRequestAt?: Date;
}

export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  redirectUri: string;
  scope: string[];
  state?: string;
}

export interface OAuth2TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

export interface ApiKeyConfig {
  key: string;
  headerName?: string;
  queryParamName?: string;
  prefix?: string;
}

export interface JWTConfig {
  secret: string;
  algorithm?: string;
  expiresIn?: string | number;
  issuer?: string;
  audience?: string;
}

export abstract class BaseIntegrationConnector {
  protected config: IntegrationConfig;
  protected credentials: IntegrationCredentials;

  constructor(config: IntegrationConfig) {
    this.config = config;
    this.credentials = config.credentials || {} as IntegrationCredentials;
  }

  abstract testConnection(): Promise<ConnectionTestResult>;
  abstract refreshCredentials?(): Promise<IntegrationCredentials>;
  
  getConfig(): IntegrationConfig {
    return this.config;
  }

  getCredentials(): IntegrationCredentials {
    return this.credentials;
  }

  updateCredentials(credentials: IntegrationCredentials): void {
    this.credentials = credentials;
    this.config.credentials = credentials;
  }
}
