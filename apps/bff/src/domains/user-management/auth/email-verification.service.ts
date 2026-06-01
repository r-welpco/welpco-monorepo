import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, IsNull } from 'typeorm';
import { randomUUID, randomInt } from 'crypto';
import {
  UserAccount,
  AccountStatus,
  AccountType,
} from '../entities/user-account.entity';
import { EmailVerificationToken } from '../entities/email-verification-token.entity';
import { VerificationStatus } from '../entities/verification-status.entity';
import { EventPublisherService } from '../events/event-publisher.service';
import { EmailService } from '../email/email.service';
import { emailLocaleForUser } from './user-locale.helper';

@Injectable()
export class EmailVerificationService {
  private readonly TOKEN_EXPIRATION_HOURS = 24;

  constructor(
    @InjectRepository(EmailVerificationToken)
    private tokenRepository: Repository<EmailVerificationToken>,
    @InjectRepository(UserAccount)
    private userRepository: Repository<UserAccount>,
    @InjectRepository(VerificationStatus)
    private verificationRepository: Repository<VerificationStatus>,
    private eventPublisher: EventPublisherService,
    private emailService: EmailService,
  ) {}

  /**
   * Generate a verification token for the user (e.g. after registration).
   * @param manager - Optional EntityManager to run in an existing transaction so user_id FK is visible.
   */
  async generateVerificationToken(userId: string, manager?: EntityManager): Promise<string> {
    const repo = manager ? manager.getRepository(EmailVerificationToken) : this.tokenRepository;

    await repo.delete({
      userId,
      usedAt: IsNull(),
    });

    const token = randomInt(100000, 999999).toString();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.TOKEN_EXPIRATION_HOURS);

    const verificationToken = repo.create({
      userId,
      token,
      expiresAt,
    });

    await repo.save(verificationToken);

    const userRepo = manager ? manager.getRepository(UserAccount) : this.userRepository;
    const user = await userRepo.findOne({ where: { id: userId } });
    if (user) {
      try {
        // Send email via EmailService (Resend when RESEND_API_KEY is set, else SMTP/MailHog)
        await this.emailService.sendVerificationEmail(
          user.email,
          token,
          emailLocaleForUser(user),
        );
      } catch (error) {
        // Log error but don't fail token generation
        console.error('Failed to send verification email:', error);
      }

      // Also publish event for Notification domain (for production/event-driven architecture)
      await this.eventPublisher.publishEmailVerificationRequested({
        userId: user.id,
        email: user.email,
        token,
        expiresAt: expiresAt.toISOString(),
      });
    }

    return token;
  }

  /**
   * Verify a 6-digit email-verification code.
   *
   * The 6-digit code namespace is small (~900K) and codes are minted per-user
   * on registration / resend. To prevent a code collision from being usable
   * against the wrong account (and to defeat an attacker who guesses 6-digit
   * codes blindly hoping to hit ANY active token), the lookup is scoped to
   * the (email, token) pair when an email is supplied. The legacy single-arg
   * call is preserved for the domain-internal call sites (auth.service.spec
   * passes only a token), but the production controller path always supplies
   * the email.
   */
  async verifyEmail(token: string, email?: string): Promise<void> {
    const verificationToken = await this.tokenRepository.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!verificationToken) {
      throw new NotFoundException('Invalid verification token');
    }

    // Email-bind the token: prevents a 6-digit collision (or guessed code)
    // verifying the WRONG user's email even though the token row exists.
    // We intentionally throw the same NotFoundException as a missing token so
    // the response shape doesn't leak "this code exists, but for someone else."
    if (email && verificationToken.user?.email?.toLowerCase().trim() !== email.toLowerCase().trim()) {
      throw new NotFoundException('Invalid verification token');
    }

    if (verificationToken.isUsed()) {
      throw new BadRequestException('Verification token has already been used');
    }

    if (verificationToken.isExpired()) {
      throw new BadRequestException('Verification token has expired');
    }

    const user = verificationToken.user;

    // Mark token as used
    verificationToken.usedAt = new Date();
    await this.tokenRepository.save(verificationToken);

    // Update user email verification status
    user.emailVerified = true;
    await this.userRepository.save(user);

    // Update verification status
    let verificationStatus = await this.verificationRepository.findOne({
      where: { userId: user.id },
    });

    if (!verificationStatus) {
      verificationStatus = this.verificationRepository.create({
        userId: user.id,
        emailVerified: true,
      });
    } else {
      verificationStatus.emailVerified = true;
    }
    await this.verificationRepository.save(verificationStatus);

    // Auto-activate customer accounts after email verification
    if (
      user.accountType === AccountType.CUSTOMER &&
      user.status === AccountStatus.PENDING
    ) {
      user.status = AccountStatus.ACTIVE;
      await this.userRepository.save(user);
    }

    // Publish email verified event
    await this.eventPublisher.publishEmailVerified({
      userId: user.id,
      email: user.email,
      timestamp: new Date().toISOString(),
    });
  }

  async resendVerificationEmail(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    await this.generateVerificationToken(userId);
  }
}

