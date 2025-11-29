import { 
  IntegrationConfig, 
  IntegrationEvent, 
  BaseIntegrationConnector,
  ConnectionTestResult,
  IntegrationCredentials 
} from './types';
import { RateLimiter } from './utils/rate-limiter';
import { QuotaManager } from './utils/quota-manager';
import { ConnectionTester } from './utils/connection-tester';
import { 
  GmailConnector, 
  OutlookConnector, 
  LinkedInConnector,
  ZapierConnector,
  MakeConnector,
  WhatsAppConnector 
} from './connectors';

export class IntegrationManager {
  private integrations: Map<string, IntegrationConfig> = new Map();
  private connectors: Map<string, BaseIntegrationConnector> = new Map();
  private rateLimiters: Map<string, RateLimiter> = new Map();
  private quotaManagers: Map<string, QuotaManager> = new Map();
  private connectionTester: ConnectionTester;
  private eventListeners: Map<string, Array<(event: IntegrationEvent) => void>> = new Map();

  constructor() {
    this.connectionTester = new ConnectionTester();
  }

  registerIntegration(config: IntegrationConfig): void {
    this.integrations.set(config.id, config);

    if (config.rateLimit) {
      this.rateLimiters.set(config.id, new RateLimiter(config.rateLimit));
    }

    if (config.quota) {
      this.quotaManagers.set(config.id, new QuotaManager(config.quota));
    }

    const connector = this.createConnector(config);
    if (connector) {
      this.connectors.set(config.id, connector);
    }
  }

  unregisterIntegration(integrationId: string): void {
    this.integrations.delete(integrationId);
    this.connectors.delete(integrationId);
    this.rateLimiters.delete(integrationId);
    this.quotaManagers.delete(integrationId);
    this.eventListeners.delete(integrationId);
  }

  getIntegration(integrationId: string): IntegrationConfig | undefined {
    return this.integrations.get(integrationId);
  }

  getConnector<T extends BaseIntegrationConnector>(integrationId: string): T | undefined {
    return this.connectors.get(integrationId) as T;
  }

  getAllIntegrations(): IntegrationConfig[] {
    return Array.from(this.integrations.values());
  }

  getEnabledIntegrations(): IntegrationConfig[] {
    return this.getAllIntegrations().filter(config => config.enabled);
  }

  async testConnection(integrationId: string): Promise<ConnectionTestResult> {
    const connector = this.connectors.get(integrationId);
    if (!connector) {
      return {
        success: false,
        message: 'Integration not found',
      };
    }

    return await connector.testConnection();
  }

  async testAllConnections(): Promise<Map<string, ConnectionTestResult>> {
    const results = new Map<string, ConnectionTestResult>();

    await Promise.all(
      Array.from(this.connectors.entries()).map(async ([id, connector]) => {
        const result = await connector.testConnection();
        results.set(id, result);
      })
    );

    return results;
  }

  async checkRateLimit(integrationId: string, userId?: string): Promise<boolean> {
    const rateLimiter = this.rateLimiters.get(integrationId);
    if (!rateLimiter) {
      return true;
    }

    const key = userId ? `${integrationId}:${userId}` : integrationId;
    const allowed = await rateLimiter.checkLimit(key);

    if (!allowed) {
      this.emitEvent({
        id: this.generateEventId(),
        integrationId,
        type: 'rate_limit',
        timestamp: new Date(),
      });
    }

    return allowed;
  }

  async checkQuota(integrationId: string, userId?: string): Promise<boolean> {
    const quotaManager = this.quotaManagers.get(integrationId);
    if (!quotaManager) {
      return true;
    }

    const allowed = await quotaManager.checkQuota(integrationId, userId);

    if (!allowed) {
      this.emitEvent({
        id: this.generateEventId(),
        integrationId,
        type: 'quota_exceeded',
        timestamp: new Date(),
      });
    }

    return allowed;
  }

  async incrementUsage(integrationId: string, userId?: string, amount: number = 1): Promise<void> {
    const quotaManager = this.quotaManagers.get(integrationId);
    if (quotaManager) {
      await quotaManager.incrementUsage(integrationId, userId, amount);
    }
  }

  getRemainingQuota(integrationId: string, userId?: string): number {
    const quotaManager = this.quotaManagers.get(integrationId);
    if (!quotaManager) {
      return Infinity;
    }

    return quotaManager.getRemainingQuota(integrationId, userId);
  }

  getRemainingRequests(integrationId: string, userId?: string): number {
    const rateLimiter = this.rateLimiters.get(integrationId);
    if (!rateLimiter) {
      return Infinity;
    }

    const key = userId ? `${integrationId}:${userId}` : integrationId;
    return rateLimiter.getRemainingRequests(key);
  }

  async updateCredentials(integrationId: string, credentials: IntegrationCredentials): Promise<void> {
    const config = this.integrations.get(integrationId);
    if (config) {
      config.credentials = credentials;
      this.integrations.set(integrationId, config);
    }

    const connector = this.connectors.get(integrationId);
    if (connector) {
      connector.updateCredentials(credentials);
    }
  }

  async refreshCredentials(integrationId: string): Promise<IntegrationCredentials | null> {
    const connector = this.connectors.get(integrationId);
    if (!connector || !connector.refreshCredentials) {
      return null;
    }

    try {
      const newCredentials = await connector.refreshCredentials();
      await this.updateCredentials(integrationId, newCredentials);
      return newCredentials;
    } catch (error) {
      this.emitEvent({
        id: this.generateEventId(),
        integrationId,
        type: 'error',
        timestamp: new Date(),
        error: error instanceof Error ? error : new Error(String(error)),
      });
      return null;
    }
  }

  addEventListener(integrationId: string, listener: (event: IntegrationEvent) => void): void {
    const listeners = this.eventListeners.get(integrationId) || [];
    listeners.push(listener);
    this.eventListeners.set(integrationId, listeners);
  }

  removeEventListener(integrationId: string, listener: (event: IntegrationEvent) => void): void {
    const listeners = this.eventListeners.get(integrationId) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(integrationId, listeners);
    }
  }

  private emitEvent(event: IntegrationEvent): void {
    const listeners = this.eventListeners.get(event.integrationId) || [];
    listeners.forEach(listener => listener(event));

    const globalListeners = this.eventListeners.get('*') || [];
    globalListeners.forEach(listener => listener(event));
  }

  private createConnector(config: IntegrationConfig): BaseIntegrationConnector | null {
    switch (config.name.toLowerCase()) {
      case 'gmail':
        return new GmailConnector(config);
      case 'outlook':
        return new OutlookConnector(config);
      case 'linkedin':
        return new LinkedInConnector(config);
      case 'zapier':
        return new ZapierConnector(config);
      case 'make':
      case 'make.com':
        return new MakeConnector(config);
      case 'whatsapp':
        return new WhatsAppConnector(config);
      default:
        return null;
    }
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

export const integrationManager = new IntegrationManager();
