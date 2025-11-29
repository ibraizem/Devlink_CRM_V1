import { QuotaConfig, IntegrationUsage } from '../types';

export class QuotaManager {
  private usage: Map<string, IntegrationUsage> = new Map();
  private config: QuotaConfig;

  constructor(config: QuotaConfig) {
    this.config = config;
  }

  async checkQuota(integrationId: string, userId?: string): Promise<boolean> {
    const key = this.getKey(integrationId, userId);
    const usage = this.getUsage(key, integrationId);

    if (this.config.daily && usage.quotaUsed >= this.config.daily) {
      return false;
    }

    if (this.config.monthly && usage.quotaUsed >= (this.config.monthly || 0)) {
      return false;
    }

    if (this.config.perUser && userId && usage.quotaUsed >= this.config.perUser) {
      return false;
    }

    return true;
  }

  async incrementUsage(integrationId: string, userId?: string, amount: number = 1): Promise<void> {
    const key = this.getKey(integrationId, userId);
    const usage = this.getUsage(key, integrationId);

    usage.requestCount++;
    usage.quotaUsed += amount;
    usage.lastRequestAt = new Date();

    this.usage.set(key, usage);
  }

  getUsage(key: string, integrationId: string): IntegrationUsage {
    const existing = this.usage.get(key);
    
    if (existing && new Date() < existing.resetAt) {
      return existing;
    }

    const resetAt = this.calculateResetTime();
    const maxQuota = this.config.daily || this.config.monthly || this.config.perUser || 0;

    const newUsage: IntegrationUsage = {
      integrationId,
      requestCount: 0,
      quotaUsed: 0,
      quotaRemaining: maxQuota,
      resetAt,
    };

    this.usage.set(key, newUsage);
    return newUsage;
  }

  getRemainingQuota(integrationId: string, userId?: string): number {
    const key = this.getKey(integrationId, userId);
    const usage = this.getUsage(key, integrationId);
    
    const maxQuota = this.config.daily || this.config.monthly || this.config.perUser || 0;
    return Math.max(0, maxQuota - usage.quotaUsed);
  }

  getResetTime(integrationId: string, userId?: string): Date {
    const key = this.getKey(integrationId, userId);
    const usage = this.usage.get(key);
    return usage?.resetAt || this.calculateResetTime();
  }

  reset(integrationId: string, userId?: string): void {
    const key = this.getKey(integrationId, userId);
    this.usage.delete(key);
  }

  resetAll(): void {
    this.usage.clear();
  }

  private getKey(integrationId: string, userId?: string): string {
    return userId ? `${integrationId}:${userId}` : integrationId;
  }

  private calculateResetTime(): Date {
    const now = new Date();
    
    if (this.config.daily) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow;
    }

    if (this.config.monthly) {
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);
      nextMonth.setHours(0, 0, 0, 0);
      return nextMonth;
    }

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  getQuotaPercentage(integrationId: string, userId?: string): number {
    const key = this.getKey(integrationId, userId);
    const usage = this.getUsage(key, integrationId);
    const maxQuota = this.config.daily || this.config.monthly || this.config.perUser || 0;
    
    if (maxQuota === 0) return 0;
    return (usage.quotaUsed / maxQuota) * 100;
  }
}
