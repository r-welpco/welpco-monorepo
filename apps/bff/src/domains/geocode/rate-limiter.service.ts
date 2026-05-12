import { Injectable, Logger } from '@nestjs/common';

/**
 * Rate limiter for geocoding API calls (Google Maps).
 *
 * Current implementation: In-memory (single instance)
 * Production TODO: Implement Redis-based distributed rate limiter
 *
 * Google Maps Geocoding API allows up to 50 QPS.
 * We use a conservative 100 ms minimum interval (~10 QPS).
 */
@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);
  
  // In-memory implementation (works for single instance only)
  private lastRequestTime = 0;
  private readonly minIntervalMs: number;
  private readonly maxConcurrent: number;
  private activeRequests = 0;

  constructor() {
    // Google Maps allows ~50 QPS; 100 ms interval is conservative (~10 QPS)
    this.minIntervalMs = 100;
    // Allow more concurrent requests than Nominatim did
    this.maxConcurrent = 10;
  }

  /**
   * Wait until it's safe to make the next request.
   * Enforces minimum interval between requests.
   */
  async waitForSlot(): Promise<void> {
    // Check concurrent request limit (log once per wait, not every 100ms)
    let loggedWait = false;
    while (this.activeRequests >= this.maxConcurrent) {
      if (!loggedWait) {
        this.logger.debug(`Rate limiter: waiting for concurrent slot (current: ${this.activeRequests})`);
        loggedWait = true;
      }
      await this.sleep(100);
    }

    // Check time-based rate limit
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    
    if (elapsed < this.minIntervalMs) {
      const waitTime = this.minIntervalMs - elapsed;
      this.logger.debug(`Rate limiter: throttling for ${waitTime}ms`);
      await this.sleep(waitTime);
    }

    this.lastRequestTime = Date.now();
    this.activeRequests++;
  }

  /**
   * Release a request slot after completion.
   */
  releaseSlot(): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
  }

  /**
   * Get current rate limiter stats.
   */
  getStats(): { activeRequests: number; lastRequestTime: number } {
    return {
      activeRequests: this.activeRequests,
      lastRequestTime: this.lastRequestTime,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Redis-based distributed rate limiter (for production).
 * 
 * Implementation guide:
 * 1. Install ioredis: pnpm add ioredis
 * 2. Add RedisModule to geocode.module.ts
 * 3. Inject Redis client into this service
 * 4. Use Redis sliding window algorithm:
 *    - Key: `geocode:rate_limit:{timestamp_bucket}`
 *    - Increment on each request
 *    - Check if count exceeds limit
 *    - Expire keys after window duration
 * 
 * Example Redis implementation:
 * 
 * ```typescript
 * import { Injectable, Inject } from '@nestjs/common';
 * import Redis from 'ioredis';
 * 
 * @Injectable()
 * export class RedisRateLimiterService {
 *   constructor(@Inject('REDIS_CLIENT') private redis: Redis) {}
 * 
 *   async waitForSlot(): Promise<void> {
 *     const key = `geocode:rate_limit:${Math.floor(Date.now() / 1000)}`;
 *     const count = await this.redis.incr(key);
 *     await this.redis.expire(key, 2); // 2 second window
 *     
 *     if (count > 1) {
 *       // Already 1 request this second, wait until next second
 *       const waitTime = 1000 - (Date.now() % 1000);
 *       await this.sleep(waitTime);
 *       return this.waitForSlot(); // Retry
 *     }
 *   }
 * }
 * ```
 */
