import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  TooManyRequestsException,
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
  private readonly MAX_REQUESTS_PER_HOUR = 5;

  constructor(
    @InjectRepository(UserAccount)
    private userRepository: Repository<UserAccount>,
    private cacheService: CacheService,
    private eventPublisher: EventPublisherService,
    private emailService: EmailService,
  ) {}

  /**
   * Operational password reset request.
   *
   * We intentionally surface unknown email and rate-limit errors so the user
   * can fix the problem immediately from the reset form.
   */
  async requestPasswordReset(
    email: string,
    options?: { preferredLocale?: UserPreferredLocale },
  ): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new NotFoundException('No account found for this email address');
    }

    const localeFromRequest = normalizePreferredLocale(options?.preferredLocale);
    if (localeFromRequest) {
      applyPreferredLocaleIfProvided(user, localeFromRequest);
      await this.userRepository.save(user);
    }

    const rateLimitKey = `password-reset:rate-limit:${normalizedEmail}`;
    const requestCount = await this.cacheService.get<number>(rateLimitKey) || 0;
    if (requestCount >= this.MAX_REQUESTS_PER_HOUR) {
      throw new TooManyRequestsException(
        'Too many password reset requests. Please try again later.',
      );
    }

    // Generate reset token + persist
    const token = randomUUID();
    const tokenKey = `password-reset:token:${token}`;
    await this.cacheService.set(tokenKey, user.id, this.TOKEN_EXPIRATION_SECONDS);
    await this.cacheService.increment(rateLimitKey, 3600); // 1 hour TTL

    await this.dispatchResetEmail(user, token);
  }

  private async dispatchResetEmail(user: UserAccount, token: string): Promise<void> {
    await this.emailService.sendPasswordResetEmail(
      user.email,
      token,
      user.preferredLocale,
    );

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
      throw new BadRequestException('Invalid or expired password reset token');
    }

    // Get user
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    // Hash new password
    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    user.passwordHash = passwordHash;
    user.authVersion = (user.authVersion ?? 0) + 1;
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
