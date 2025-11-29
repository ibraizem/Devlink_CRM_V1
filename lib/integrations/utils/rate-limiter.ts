import { RateLimitConfig } from '../types';

interface RateLimitEntry {
  count: number;
  resetAt: number;
  tokens?: number;
}

export class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async checkLimit(key: string): Promise<boolean> {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now >= entry.resetAt) {
      this.limits.set(key, {
        count: 1,
        resetAt: now + this.config.windowMs,
        tokens: this.config.maxRequests - 1,
      });
      return true;
    }

    switch (this.config.strategy) {
      case 'token-bucket':
        return this.checkTokenBucket(key, entry, now);
      case 'sliding':
        return this.checkSlidingWindow(key, entry, now);
      case 'fixed':
      default:
        return this.checkFixedWindow(key, entry);
    }
  }

  private checkFixedWindow(key: string, entry: RateLimitEntry): boolean {
    if (entry.count >= this.config.maxRequests) {
      return false;
    }

    entry.count++;
    this.limits.set(key, entry);
    return true;
  }

  private checkSlidingWindow(key: string, entry: RateLimitEntry, now: number): boolean {
    const windowProgress = (now - (entry.resetAt - this.config.windowMs)) / this.config.windowMs;
    const allowedRequests = Math.floor(this.config.maxRequests * (1 - windowProgress) + this.config.maxRequests);

    if (entry.count >= allowedRequests) {
      return false;
    }

    entry.count++;
    this.limits.set(key, entry);
    return true;
  }

  private checkTokenBucket(key: string, entry: RateLimitEntry, now: number): boolean {
    const tokensToAdd = Math.floor(
      ((now - (entry.resetAt - this.config.windowMs)) / this.config.windowMs) * this.config.maxRequests
    );
    
    const currentTokens = Math.min(
      this.config.maxRequests,
      (entry.tokens || 0) + tokensToAdd
    );

    if (currentTokens < 1) {
      return false;
    }

    this.limits.set(key, {
      ...entry,
      tokens: currentTokens - 1,
      count: entry.count + 1,
    });
    return true;
  }

  getRemainingRequests(key: string): number {
    const entry = this.limits.get(key);
    if (!entry) {
      return this.config.maxRequests;
    }

    const now = Date.now();
    if (now >= entry.resetAt) {
      return this.config.maxRequests;
    }

    return Math.max(0, this.config.maxRequests - entry.count);
  }

  getResetTime(key: string): Date | null {
    const entry = this.limits.get(key);
    return entry ? new Date(entry.resetAt) : null;
  }

  reset(key: string): void {
    this.limits.delete(key);
  }

  resetAll(): void {
    this.limits.clear();
  }
}
