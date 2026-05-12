import { Injectable } from '@nestjs/common';

interface CacheEntry {
  value: string;
  expiresAt?: number;
}

/**
 * In-memory cache implementation matching the previous Redis-backed interface.
 * Used for sessions, password-reset tokens, account lockout, and rate limiting.
 * Not shared across multiple backend instances; acceptable for single-instance or sticky-session deployment.
 */
@Injectable()
export class MemoryCacheService {
  private readonly store = new Map<string, CacheEntry>();

  private isExpired(entry: CacheEntry): boolean {
    return entry.expiresAt != null && Date.now() > entry.expiresAt;
  }

  private getEntry(key: string): CacheEntry | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (this.isExpired(entry)) {
      this.store.delete(key);
      return null;
    }
    return entry;
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.getEntry(key);
    if (!entry) return null;
    try {
      return JSON.parse(entry.value) as T;
    } catch {
      return entry.value as unknown as T;
    }
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    const expiresAt = ttl ? Date.now() + ttl * 1000 : undefined;
    this.store.set(key, { value: serialized, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.getEntry(key) !== null;
  }

  async expire(key: string, seconds: number): Promise<void> {
    const entry = this.store.get(key);
    if (!entry) return;
    this.store.set(key, {
      ...entry,
      expiresAt: Date.now() + seconds * 1000,
    });
  }

  async increment(key: string, ttl?: number): Promise<number> {
    const entry = this.getEntry(key);
    const current = entry ? parseInt(entry.value, 10) || 0 : 0;
    const next = current + 1;
    if (entry) {
      // Preserve the original TTL — don't reset expiry on each increment
      const serialized = JSON.stringify(next);
      this.store.set(key, { value: serialized, expiresAt: entry.expiresAt });
    } else {
      await this.set(key, next, ttl);
    }
    return next;
  }

  async decrement(key: string, ttl?: number): Promise<number> {
    const entry = this.getEntry(key);
    const current = entry ? parseInt(entry.value, 10) || 0 : 0;
    const next = current - 1;
    await this.set(key, next, ttl);
    return next;
  }

  /**
   * Returns keys matching pattern. Supports * as wildcard (e.g. "prefix:*").
   */
  async keys(pattern: string): Promise<string[]> {
    const regexSource =
      '^' +
      pattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*') +
      '$';
    const regex = new RegExp(regexSource);
    const result: string[] = [];
    for (const key of this.store.keys()) {
      const entry = this.getEntry(key);
      if (entry != null && regex.test(key)) result.push(key);
    }
    return result;
  }

  async flushAll(): Promise<void> {
    this.store.clear();
  }
}
