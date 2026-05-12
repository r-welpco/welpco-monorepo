import { Injectable } from '@nestjs/common';
import { MemoryCacheService } from './memory-cache.service';

@Injectable()
export class CacheService {
  constructor(private memoryCacheService: MemoryCacheService) {}

  async get<T>(key: string): Promise<T | null> {
    return this.memoryCacheService.get<T>(key);
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    await this.memoryCacheService.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.memoryCacheService.del(key);
  }

  async reset(): Promise<void> {
    await this.memoryCacheService.flushAll();
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  async increment(key: string, ttl?: number): Promise<number> {
    return this.memoryCacheService.increment(key, ttl);
  }

  async decrement(key: string, ttl?: number): Promise<number> {
    return this.memoryCacheService.decrement(key, ttl);
  }

  async exists(key: string): Promise<boolean> {
    return this.memoryCacheService.exists(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.memoryCacheService.expire(key, seconds);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.memoryCacheService.keys(pattern);
  }
}

