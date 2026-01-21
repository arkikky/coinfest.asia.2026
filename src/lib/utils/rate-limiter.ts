interface RateLimitRecord {
    count: number;
    resetTime: number;
  }
  
  interface RateLimitConfig {
    limit: number;
    windowMs: number;
  }
  
  class RateLimiter {
    private store: Map<string, RateLimitRecord>;
  
    constructor() {
      this.store = new Map();
      setInterval(() => this.cleanup(), 60 * 60 * 1000);
    }
  
    // @check if request is allowed based on rate limit
    check(identifier: string, config: RateLimitConfig): boolean {
      const now = Date.now();
      const record = this.store.get(identifier);
  
      if (!record || now > record.resetTime) {
        this.store.set(identifier, {
          count: 1,
          resetTime: now + config.windowMs,
        });
        return true;
      }

      if (record.count >= config.limit) {
        return false;
      }
  
      record.count++;
      return true;
    }
  
    getRemaining(identifier: string, limit: number): number {
      const record = this.store.get(identifier);
      if (!record || Date.now() > record.resetTime) {
        return limit;
      }
      return Math.max(0, limit - record.count);
    }
  

    getResetTime(identifier: string): number | null {
      const record = this.store.get(identifier);
      if (!record) return null;
  
      const now = Date.now();
      if (now > record.resetTime) return null;
  
      return record.resetTime - now;
    }
  
    // @reset(rate limit for specific identifier)
    reset(identifier: string): void {
      this.store.delete(identifier);
    }
  
    // @cleanup(cleanup expired records)
    private cleanup(): void {
      const now = Date.now();
      for (const [key, record] of this.store.entries()) {
        if (now > record.resetTime) {
          this.store.delete(key);
        }
      }
    }
  
    // @get-store-size(get current store size)
    getStoreSize(): number {
      return this.store.size;
    }
  }
  
  export const rateLimiter = new RateLimiter();
  
  export const RATE_LIMIT_CONFIGS = {
    LOGIN: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
    REGISTER: { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
    FORGOT_PASSWORD: { limit: 3, windowMs: 15 * 60 * 1000 }, // 3 attempts per 15 minutes
    RESET_PASSWORD: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
    VERIFY_EMAIL: { limit: 10, windowMs: 60 * 60 * 1000 }, // 10 attempts per hour
    
    API_GENERAL: { limit: 100, windowMs: 60 * 1000 }, // 100 requests per minute
    API_STRICT: { limit: 10, windowMs: 60 * 1000 }, // 10 requests per minute
  } as const;
  
  // @helper(format remaining time)
  export function formatResetTime(ms: number): string {
    const minutes = Math.ceil(ms / 60000);
    if (minutes < 60) {
      return `${minutes} menit`;
    }
    const hours = Math.ceil(minutes / 60);
    return `${hours} jam`;
  }