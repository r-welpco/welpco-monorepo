import { Injectable } from '@nestjs/common';
import type { ServiceCategory } from '../../domains/content-management/entities/service-category.entity';

const TTL_MS = 5 * 60 * 1000;

/**
 * Shared in-memory cache for active categories used by service discovery search results.
 * Invalidated when CategoriesService mutates categories.
 */
@Injectable()
export class DiscoveryCategoriesCacheService {
  private cache: { categories: ServiceCategory[]; expiresAt: number } | null = null;

  get(): ServiceCategory[] | null {
    if (this.cache && this.cache.expiresAt > Date.now()) {
      return this.cache.categories;
    }
    return null;
  }

  set(categories: ServiceCategory[]): void {
    this.cache = {
      categories,
      expiresAt: Date.now() + TTL_MS,
    };
  }

  invalidate(): void {
    this.cache = null;
  }
}
