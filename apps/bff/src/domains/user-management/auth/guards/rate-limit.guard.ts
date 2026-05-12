import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { CacheService } from '../../cache/cache.service';
import { RATE_LIMIT_KEY, RateLimitOptions } from '../decorators/rate-limit.decorator';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private cacheService: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    if (!options) {
      return true; // No rate limit configured
    }

    // Skip rate limiting in test environment or when explicitly disabled
    // This allows E2E tests to run without hitting rate limits
    if (process.env.NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMIT === 'true') {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const key = this.generateKey(request, options);

    // In development, use much higher limits (10x) to allow for testing
    // In production, use the configured limit
    const effectiveLimit = process.env.NODE_ENV === 'development' 
      ? options.limit * 10 
      : options.limit;

    const current = await this.cacheService.get<number>(key) || 0;

    if (current >= effectiveLimit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests, please try again later',
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment counter
    await this.cacheService.increment(key, options.ttl);

    return true;
  }

  private generateKey(request: Request, options: RateLimitOptions): string {
    if (options.keyGenerator) {
      return options.keyGenerator(request);
    }

    // Default: use IP address and route
    const ip = request.ip || request.connection.remoteAddress || 'unknown';
    const route = request.route?.path || request.path;
    return `rate-limit:${route}:${ip}`;
  }
}

