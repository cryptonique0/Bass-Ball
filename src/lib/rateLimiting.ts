/**
 * Rate limiting and throttling utilities
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // time window in milliseconds
}

export interface RateLimitData {
  requests: number[];
  blocked: boolean;
  resetTime: number;
}

export class RateLimiter {
  private limits: Map<string, RateLimitData> = new Map();
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      maxRequests: config.maxRequests || 100,
      windowMs: config.windowMs || 60000, // 1 minute
    };
  }

  /**
   * Check if request is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    let data = this.limits.get(key);

    if (!data) {
      data = { requests: [now], blocked: false, resetTime: now + this.config.windowMs };
      this.limits.set(key, data);
      return true;
    }

    // Clear old requests outside window
    data.requests = data.requests.filter((time) => now - time < this.config.windowMs);

    if (data.requests.length >= this.config.maxRequests) {
      data.blocked = true;
      data.resetTime = Math.max(...data.requests) + this.config.windowMs;
      return false;
    }

    data.requests.push(now);
    data.blocked = false;
    return true;
  }

  /**
   * Get remaining requests
   */
  getRemaining(key: string): number {
    const now = Date.now();
    const data = this.limits.get(key);

    if (!data) return this.config.maxRequests;

    const recent = data.requests.filter((time) => now - time < this.config.windowMs);
    return Math.max(0, this.config.maxRequests - recent.length);
  }

  /**
   * Get reset time
   */
  getResetTime(key: string): number {
    const data = this.limits.get(key);
    return data?.resetTime || Date.now() + this.config.windowMs;
  }

  /**
   * Reset limit for key
   */
  reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Clear all limits
   */
  clear(): void {
    this.limits.clear();
  }
}

export class Throttle {
  private lastCall: Map<string, number> = new Map();
  private delay: number;

  constructor(delay: number) {
    this.delay = delay;
  }

  /**
   * Check if action should be throttled
   */
  shouldExecute(key: string): boolean {
    const now = Date.now();
    const last = this.lastCall.get(key) || 0;

    if (now - last >= this.delay) {
      this.lastCall.set(key, now);
      return true;
    }

    return false;
  }

  /**
   * Execute function with throttling
   */
  execute<T>(key: string, fn: () => T): T | null {
    if (this.shouldExecute(key)) {
      return fn();
    }
    return null;
  }

  /**
   * Reset throttle
   */
  reset(key: string): void {
    this.lastCall.delete(key);
  }
}

export class Debounce {
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private delay: number;

  constructor(delay: number) {
    this.delay = delay;
  }

  /**
   * Debounce function execution
   */
  execute<T>(key: string, fn: () => T): void {
    const existing = this.timers.get(key);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      fn();
      this.timers.delete(key);
    }, this.delay);

    this.timers.set(key, timer);
  }

  /**
   * Cancel pending execution
   */
  cancel(key: string): void {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }

  /**
   * Cancel all
   */
  cancelAll(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
  }
}
