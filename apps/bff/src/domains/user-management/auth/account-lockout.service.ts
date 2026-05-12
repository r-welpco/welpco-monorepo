import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class AccountLockoutService {
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_SECONDS = 15 * 60; // 15 minutes

  constructor(private cacheService: CacheService) {}

  async recordFailedAttempt(email: string): Promise<number> {
    const key = this.getLockoutKey(email);
    const attempts = await this.cacheService.increment(
      key,
      this.LOCKOUT_DURATION_SECONDS,
    );

    return attempts;
  }

  async checkLockout(email: string): Promise<void> {
    const key = this.getLockoutKey(email);
    const attempts = await this.cacheService.get<number>(key) || 0;

    if (attempts >= this.MAX_FAILED_ATTEMPTS) {
      throw new UnauthorizedException(
        'Account is temporarily locked due to too many failed login attempts. Please try again in 15 minutes.',
      );
    }
  }

  async clearFailedAttempts(email: string): Promise<void> {
    const key = this.getLockoutKey(email);
    await this.cacheService.del(key);
  }

  async getRemainingAttempts(email: string): Promise<number> {
    const key = this.getLockoutKey(email);
    const attempts = await this.cacheService.get<number>(key) || 0;
    return Math.max(0, this.MAX_FAILED_ATTEMPTS - attempts);
  }

  async isLocked(email: string): Promise<boolean> {
    const key = this.getLockoutKey(email);
    const attempts = await this.cacheService.get<number>(key) || 0;
    return attempts >= this.MAX_FAILED_ATTEMPTS;
  }

  private getLockoutKey(email: string): string {
    return `account-lockout:${email.toLowerCase().trim()}`;
  }
}

