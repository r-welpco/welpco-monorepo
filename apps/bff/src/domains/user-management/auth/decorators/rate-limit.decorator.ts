import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rateLimit';

export interface RateLimitOptions {
  ttl: number; // Time window in seconds
  limit: number; // Maximum number of requests
  keyGenerator?: (request: any) => string; // Custom key generator
}

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

