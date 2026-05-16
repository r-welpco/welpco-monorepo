import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { UserAccount } from '../entities/user-account.entity';
import {
  normalizePreferredLocale,
  type UserPreferredLocale,
} from '../../../common/preferred-locale';
import { applyPreferredLocaleIfProvided } from './user-locale.helper';
import { CacheService } from '../cache/cache.service';
import { EventPublisherService } from '../events/event-publisher.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);
  private readonly TOKEN_EXPIRATION_SECONDS = 15 * 60; // 15 minutes
  private readonly MAX_REQUESTS_PER_HOUR = 3;

  constructor(
    @InjectRepository(UserAccount)
    private userRepository: Repository<UserAccount>,
    private cacheService: CacheService,
    private eventPublisher: EventPublisherService,
    private emailService: EmailService,
  ) {}

  /**
   * Wave 2 (BFF): enumeration-safe password reset request.
   *
   * Bible §22.6 contract:
   *  - Always returns successfully (no thrown exceptions ever bubble to the
   *    controller). Both known and unknown emails get the same `200 { ok }`.
   *  - Rate-limit excess for KNOWN accounts is enforced silently (we still
   *    skip the email send + token mint internally, but the caller sees the
   *    same response shape — a 400 here would have leaked "this email exists
   *    AND has been requested 3+ times").
   *  - Email send is fire-and-forget (`void`-returning promise, errors logged
   *    but not awaited) so the response timing for unknown vs known is the
   *    same regardless of how slow the email transport is.
   *
   * The previous behaviour returned 200 for unknown emails but threw 400 for
   * rate-limited known emails — that's a textbook enumeration leak. Wave 2
   * removes the differentiating exception.
   */
  async requestPasswordReset(
    email: string,
    options?: { preferredLocale?: UserPreferredLocale },
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    // Unknown email → return early, but only AFTER the DB roundtrip so the
    // timing is at least similar to the known-email path. Email send happens
    // out-of-band (see below) so its latency doesn't widen the window.
    if (!user) {
      return;
    }

    const localeFromRequest = normalizePreferredLocale(options?.preferredLocale);
    if (localeFromRequest) {
      applyPreferredLocaleIfProvided(user, localeFromRequest);
      await this.userRepository.save(user);
    }

    // Rate limiting (still enforced — we don't want a flood of resets going to
    // a real account from a single attacker), but enforced silently. The
    // caller never sees a "you've hit the rate limit" error because that error
    // alone would tell them the account exists.
    const rateLimitKey = `password-reset:rate-limit:${email}`;
    const requestCount = await this.cacheService.get<number>(rateLimitKey) || 0;
    if (requestCount >= this.MAX_REQUESTS_PER_HOUR) {
      this.logger.warn(
        `Password reset rate-limit reached for ${email}; suppressing email send (response stays uniform).`,
      );
      return;
    }

    // Generate reset token + persist
    const token = randomUUID();
    const tokenKey = `password-reset:token:${token}`;
    await this.cacheService.set(tokenKey, user.id, this.TOKEN_EXPIRATION_SECONDS);
    await this.cacheService.increment(rateLimitKey, 3600); // 1 hour TTL

    // Fire-and-forget the email send + event publish so the HTTP response
    // doesn't wait on the SMTP / event-bus roundtrip. Bible §22.6: timing
    // uniformity is part of the enumeration contract.
    void this.dispatchResetEmail(user, token);
  }

  /**
   * Wave 2 (BFF): out-of-band side-effects for a confirmed reset request.
   * Errors are logged (not rethrown) — the caller already returned 200.
   */
  private async dispatchResetEmail(user: UserAccount, token: string): Promise<void> {
    try {
      await this.emailService.sendPasswordResetEmail(
        user.email,
        token,
        user.preferredLocale,
      );
    } catch (error) {
      this.logger.warn(
        `Password reset email send failed for ${user.email}: ${(error as Error).message}`,
      );
    }
    try {
      await this.eventPublisher.publishPasswordResetRequested({
        userId: user.id,
        email: user.email,
        token,
        expiresAt: new Date(
          Date.now() + this.TOKEN_EXPIRATION_SECONDS * 1000,
        ).toISOString(),
      });
    } catch (error) {
      this.logger.warn(
        `Password reset event publish failed for ${user.email}: ${(error as Error).message}`,
      );
    }
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    const tokenKey = `password-reset:token:${token}`;
    const userId = await this.cacheService.get<string>(tokenKey);

    if (!userId) {
      throw new NotFoundException('Invalid or expired password reset token');
    }

    // Get user
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash new password
    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    user.passwordHash = passwordHash;
    await this.userRepository.save(user);

    // Delete token (invalidate after use)
    await this.cacheService.del(tokenKey);

    // Publish event
    await this.eventPublisher.publishPasswordResetCompleted({
      userId: user.id,
      email: user.email,
      timestamp: new Date().toISOString(),
    });
  }
}

