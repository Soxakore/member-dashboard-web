/**
 * Simple in-memory token bucket rate limiter for WOS API calls
 * WOS API allows ~30 requests per 60 seconds
 */
class RateLimiter {
  private tokens: number;
  private maxTokens: number;
  private refillIntervalMs: number;
  private lastRefill: number;

  constructor(maxTokens: number, refillIntervalMs: number) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.refillIntervalMs = refillIntervalMs;
    this.lastRefill = Date.now();
  }

  private refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = Math.floor((elapsed / this.refillIntervalMs) * this.maxTokens);
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  canAcquire(): boolean {
    this.refill();
    return this.tokens > 0;
  }

  async acquire(): Promise<void> {
    while (!this.canAcquire()) {
      await new Promise((r) => setTimeout(r, 500));
    }
    this.tokens--;
  }

  getTokens(): number {
    this.refill();
    return this.tokens;
  }
}

// Global rate limiter for WOS API: 30 requests per 60 seconds
export const wosApiLimiter = new RateLimiter(30, 60000);
