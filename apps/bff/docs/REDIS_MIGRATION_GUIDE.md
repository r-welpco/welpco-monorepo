# Redis Migration Guide

## Overview

This guide covers migrating in-memory caches to Redis for horizontal scalability in the BFF application.

## Current State

The following services use in-memory caching (single-instance only):

1. **Service Discovery** (`service-discovery.service.ts`)
   - Categories cache (5 min TTL)
   - Impact: Each instance has its own cache; stale data possible after category updates

2. **Geocoding** (`nominatim-geocode.service.ts`)
   - Reverse geocode cache (24h TTL)
   - Forward geocode cache (7 days TTL)
   - Impact: Duplicate API calls across instances; wasted quota

3. **Rate Limiting** (`rate-limiter.service.ts`)
   - In-memory throttling
   - Impact: Each instance enforces limits independently; potential API violations during traffic spikes

## Migration Strategy

### Phase 1: Setup Redis Infrastructure

1. **Install Dependencies**

```bash
cd apps/bff
pnpm add ioredis @nestjs/cache-manager cache-manager cache-manager-ioredis
```

2. **Configure Redis Module**

Create `apps/bff/src/infrastructure/redis/redis.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-ioredis';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        store: redisStore,
        host: config.get('REDIS_HOST', 'localhost'),
        port: config.get('REDIS_PORT', 6379),
        password: config.get('REDIS_PASSWORD'),
        db: config.get('REDIS_DB', 0),
        ttl: 300, // Default 5 minutes
        max: 1000, // Max items in cache
      }),
    }),
  ],
  exports: [CacheModule],
})
export class RedisModule {}
```

3. **Environment Variables**

Add to `.env.local`:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

For production (e.g., Railway, Render):

```env
REDIS_HOST=your-redis-host.railway.app
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0
```

### Phase 2: Migrate Service Discovery Cache

**File:** `apps/bff/src/domains/service-discovery/service-discovery.service.ts`

**Before:**

```typescript
private categoriesCache: CachedCategories | null = null;

private async getCachedCategories(): Promise<ServiceCategory[]> {
  if (this.categoriesCache && this.categoriesCache.expiresAt > Date.now()) {
    return this.categoriesCache.categories;
  }
  const categories = await this.categoriesService.findAll(false);
  this.categoriesCache = {
    categories,
    expiresAt: Date.now() + CATEGORIES_CACHE_TTL_MS,
  };
  return categories;
}
```

**After:**

```typescript
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

constructor(
  @Inject(CACHE_MANAGER) private cacheManager: Cache,
  // ... other dependencies
) {}

private async getCachedCategories(): Promise<ServiceCategory[]> {
  const cacheKey = 'service_discovery:categories';
  
  // Try to get from Redis
  const cached = await this.cacheManager.get<ServiceCategory[]>(cacheKey);
  if (cached) {
    this.logger.debug('Categories cache HIT (Redis)');
    return cached;
  }

  this.logger.debug('Categories cache MISS (Redis)');
  const categories = await this.categoriesService.findAll(false);
  
  // Store in Redis with 5 min TTL
  await this.cacheManager.set(cacheKey, categories, 300000);
  
  return categories;
}

// Add cache invalidation when categories are updated
async invalidateCategoriesCache(): Promise<void> {
  await this.cacheManager.del('service_discovery:categories');
}
```

### Phase 3: Migrate Geocoding Cache

**File:** `apps/bff/src/domains/geocode/nominatim-geocode.service.ts`

**Before:**

```typescript
private readonly reverseCache = new Map<string, CacheEntry>();
private readonly forwardCache = new Map<string, CacheEntry>();
```

**After:**

```typescript
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

constructor(
  @Inject(CACHE_MANAGER) private cacheManager: Cache,
  // ... other dependencies
) {}

async reverse(latitude: number, longitude: number): Promise<GeocodeResultDto> {
  const key = `geocode:reverse:${this.cacheKeyReverse(latitude, longitude)}`;
  
  const cached = await this.cacheManager.get<GeocodeResultDto>(key);
  if (cached) {
    this.logger.debug(`Reverse geocode cache HIT (Redis) for ${key}`);
    return { ...cached, latitude, longitude };
  }

  this.logger.log(`Reverse geocode cache MISS (Redis) for lat=${latitude}, lng=${longitude}`);
  
  // ... fetch from Nominatim ...
  
  // Store in Redis with 24h TTL
  await this.cacheManager.set(key, result, REVERSE_CACHE_TTL_MS);
  
  return result;
}

async forward(postalCode: string, countryCode?: string): Promise<GeocodeResultDto> {
  const key = `geocode:forward:${this.cacheKeyForward(postalCode, countryCode)}`;
  
  const cached = await this.cacheManager.get<GeocodeResultDto>(key);
  if (cached) {
    this.logger.debug(`Forward geocode cache HIT (Redis) for ${key}`);
    return { ...cached };
  }

  this.logger.log(`Forward geocode cache MISS (Redis) for postal=${postalCode}`);
  
  // ... fetch from Nominatim ...
  
  // Store in Redis with 7 day TTL
  await this.cacheManager.set(key, result, FORWARD_CACHE_TTL_MS);
  
  return result;
}
```

### Phase 4: Redis-Based Distributed Rate Limiter

**File:** `apps/bff/src/domains/geocode/rate-limiter.service.ts`

Replace in-memory implementation with Redis-based sliding window:

```typescript
import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisRateLimiterService {
  private readonly logger = new Logger(RedisRateLimiterService.name);
  private readonly minIntervalMs = 1100;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    const currentSecond = Math.floor(now / 1000);
    const key = `rate_limit:geocode:${currentSecond}`;

    // Increment counter for this second
    const count = await this.increment(key);
    
    // Set TTL to 2 seconds (cleanup)
    await this.cacheManager.store.client.expire(key, 2);

    if (count > 1) {
      // Already 1+ requests this second, wait until next second
      const waitTime = 1000 - (now % 1000) + 100; // Add 100ms buffer
      this.logger.debug(`Rate limiter: waiting ${waitTime}ms (count=${count})`);
      await this.sleep(waitTime);
      return this.waitForSlot(); // Retry
    }

    this.logger.debug(`Rate limiter: slot acquired (count=${count})`);
  }

  private async increment(key: string): Promise<number> {
    const redis = (this.cacheManager.store as any).client;
    return await redis.incr(key);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

### Phase 5: Update Module Imports

Update `service-discovery.module.ts` and `geocode.module.ts`:

```typescript
import { RedisModule } from '../../infrastructure/redis/redis.module';

@Module({
  imports: [RedisModule],
  // ... rest
})
```

## Testing

### Local Development

1. **Start Redis with Docker:**

```bash
docker run -d \
  --name welpco-redis \
  -p 6379:6379 \
  redis:7-alpine
```

2. **Test Cache Operations:**

```bash
# Connect to Redis CLI
docker exec -it welpco-redis redis-cli

# Check keys
KEYS *

# Get a cached value
GET "service_discovery:categories"

# Check TTL
TTL "service_discovery:categories"

# Monitor cache operations
MONITOR
```

### Production Deployment

1. **Provision Redis Instance**
   - Railway: Add Redis service
   - Render: Add managed Redis
   - AWS: ElastiCache
   - GCP: Memorystore

2. **Configure Connection**
   - Use connection pooling
   - Enable TLS for production
   - Set appropriate max connections

3. **Monitor Performance**
   - Cache hit ratio
   - Redis memory usage
   - Network latency

## Rollback Plan

If issues occur:

1. **Toggle Feature Flag:**

```typescript
const USE_REDIS_CACHE = config.get('USE_REDIS_CACHE', 'false') === 'true';

if (USE_REDIS_CACHE) {
  // Use Redis cache
} else {
  // Fallback to in-memory cache
}
```

2. **Graceful Degradation:**

```typescript
async getCachedCategories(): Promise<ServiceCategory[]> {
  try {
    // Try Redis first
    return await this.redisCacheGet();
  } catch (error) {
    this.logger.warn('Redis unavailable, using in-memory cache', error);
    return await this.inMemoryCacheGet();
  }
}
```

## Performance Considerations

### Before (In-Memory)

- **Pros:**
  - Fast (no network latency)
  - Simple implementation
  - No external dependency

- **Cons:**
  - Not shared across instances
  - Duplicate cache warming
  - No coordination for rate limiting
  - Memory usage per instance

### After (Redis)

- **Pros:**
  - Shared cache across all instances
  - Single source of truth
  - Effective rate limiting
  - Scalable to multiple pods/containers

- **Cons:**
  - Network latency (1-2ms for local, 5-10ms for remote)
  - External dependency (Redis downtime = impact)
  - Slightly more complex

**Recommendation:** Use Redis for production with fallback to in-memory for local dev.

## Migration Checklist

- [ ] Install Redis dependencies
- [ ] Create Redis module and configuration
- [ ] Add environment variables
- [ ] Migrate service discovery cache
- [ ] Migrate geocoding cache (reverse and forward)
- [ ] Implement Redis-based rate limiter
- [ ] Add cache invalidation logic
- [ ] Update module imports
- [ ] Test locally with Docker Redis
- [ ] Add monitoring and alerts
- [ ] Deploy to staging
- [ ] Load test with multiple instances
- [ ] Deploy to production
- [ ] Monitor cache hit ratios

## Monitoring

Add metrics for:

1. **Cache Performance**
   - Hit ratio per cache type
   - Average latency
   - Memory usage

2. **Rate Limiter**
   - Requests throttled per second
   - Average wait time
   - Max concurrent requests

3. **Redis Health**
   - Connection pool status
   - Network errors
   - Slow queries

## Estimated Effort

- **Phase 1 (Setup):** 2-3 hours
- **Phase 2 (Service Discovery):** 2-3 hours
- **Phase 3 (Geocoding):** 3-4 hours
- **Phase 4 (Rate Limiter):** 2-3 hours
- **Phase 5 (Testing & Deployment):** 4-6 hours

**Total:** 13-19 hours (2-3 days)

## References

- [NestJS Caching Documentation](https://docs.nestjs.com/techniques/caching)
- [ioredis GitHub](https://github.com/redis/ioredis)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/)
