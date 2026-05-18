import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { platformAccessEnabledForClients } from '../../../common/platform-access';
import {
  resolvePreferredLocale,
  type UserPreferredLocale,
} from '../../../common/preferred-locale';
import { applyPreferredLocaleIfProvided } from './user-locale.helper';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  accessTokenSignOptions,
  refreshTokenSignOptions,
} from '../../../common/auth';
import * as bcrypt from 'bcrypt';
import { UserAccount, AccountStatus, AccountType } from '../entities/user-account.entity';
import { VerificationStatus } from '../entities/verification-status.entity';
import { ReferralCode, CodeType } from '../entities/referral-code.entity';
import { Referral, ReferralStatus } from '../entities/referral.entity';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  RequestResetPasswordDto,
  ConfirmResetPasswordDto,
  ChangePasswordDto,
  AuthResponseDto,
} from './dto';
import { ProfileCreationService } from '../../profile-management/profile-creation/profile-creation.service';
import { CustomerProfile, WelperProfile } from '../../profile-management/entities';
import { EventPublisherService } from '../events/event-publisher.service';
import { ReferralService } from '../referral/referral.service';
import { EmailVerificationService } from './email-verification.service';
import { PasswordResetService } from './password-reset.service';
import { AccountLockoutService } from './account-lockout.service';
import { NotificationService } from '../../notification/notification.service';
import { EmailNotificationService } from '../../notification/email-notification.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly saltRounds = 12;

  constructor(
    @InjectRepository(UserAccount)
    private userRepository: Repository<UserAccount>,
    @InjectRepository(VerificationStatus)
    private verificationRepository: Repository<VerificationStatus>,
    @InjectRepository(CustomerProfile)
    private customerProfileRepository: Repository<CustomerProfile>,
    @InjectRepository(WelperProfile)
    private welperProfileRepository: Repository<WelperProfile>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private profileCreationService: ProfileCreationService,
    private eventPublisher: EventPublisherService,
    private referralService: ReferralService,
    private emailVerificationService: EmailVerificationService,
    private passwordResetService: PasswordResetService,
    private accountLockoutService: AccountLockoutService,
    private dataSource: DataSource,
    private notificationService: NotificationService,
    private emailNotificationService: EmailNotificationService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, accountType, referralCode, preferredLocale } = registerDto;

    if (accountType === AccountType.ADMIN) {
      throw new BadRequestException('Admin accounts cannot be registered publicly');
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, this.saltRounds);

    // Use a transaction for all registration steps
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create user account
      const user = this.userRepository.create({
        email,
        passwordHash,
        accountType,
        status: AccountStatus.PENDING,
        emailVerified: false,
        preferredLocale: resolvePreferredLocale(preferredLocale),
      });
      const savedUser = await queryRunner.manager.save(user);

      // Create verification status
      const verificationStatus = this.verificationRepository.create({
        userId: savedUser.id,
        emailVerified: false,
      });
      await queryRunner.manager.save(verificationStatus);

      // Generate referral code in the same transaction so FK to user_accounts is visible
      await this.referralService.generateReferralCode(savedUser.id, queryRunner.manager);

      // Apply referral code if provided (same transaction so referee_user_id FK is visible)
      if (referralCode) {
        await this.referralService.applyReferralCode(referralCode, savedUser.id, queryRunner.manager);
      }

      // Generate tokens
      const tokens = await this.generateTokens(savedUser);

      // Send verification email (same transaction so email_verification_tokens user_id FK is visible)
      await this.emailVerificationService.generateVerificationToken(savedUser.id, queryRunner.manager);

      // Create profile synchronously
      await this.profileCreationService.createProfileForUser(
        savedUser.id,
        savedUser.email,
        savedUser.accountType,
        queryRunner.manager,
      );

      await queryRunner.commitTransaction();

      // Welcome email and default notification preferences (after commit so user exists)
      try {
        await this.emailNotificationService.sendWelcomeEmail(
          savedUser.email,
          undefined,
          savedUser.preferredLocale,
        );
        await this.notificationService.getPreferences(savedUser.id);
      } catch (err) {
        this.logger.warn(`Post-registration notification setup failed: ${(err as Error).message}`);
      }

      return {
        ...tokens,
        user: {
          id: savedUser.id,
          email: savedUser.email,
          accountType: savedUser.accountType,
          status: savedUser.status,
          emailVerified: savedUser.emailVerified,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { password, preferredLocale } = loginDto;
    const email = loginDto.email.trim().toLowerCase();

    // Check account lockout before attempting login
    await this.accountLockoutService.checkLockout(email);

    // Find user
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      // Record failed attempt even if user doesn't exist (security)
      await this.accountLockoutService.recordFailedAttempt(email);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is active
    if (user.status === AccountStatus.SUSPENDED) {
      throw new UnauthorizedException('Account is suspended');
    }

    if (user.status === AccountStatus.DEACTIVATED) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Day 15 — Phase 3 of the signup ↔ onboarding merge. Login no longer
    // throws on unverified email. The signup-merge plan moves the verification
    // gate from "can sign in" to "can perform bookable actions" via
    // `EmailVerifiedGuard`. The `LoginResponseDto.user.emailVerified` flag
    // flows through NextAuth into the JWT, where `proxy.ts` and the
    // dashboard's `<VerificationBanner>` consume it.

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      // Record failed attempt — don't leak attempt count to caller
      const attempts = await this.accountLockoutService.recordFailedAttempt(
        email,
      );
      throw new UnauthorizedException(
        attempts >= 5
          ? 'Account is temporarily locked due to too many failed login attempts.'
          : 'Invalid credentials',
      );
    }

    // Clear failed attempts on successful login
    await this.accountLockoutService.clearFailedAttempts(email);

    // Update last login and preferred locale when the client sends it
    user.lastLoginAt = new Date();
    applyPreferredLocaleIfProvided(user, preferredLocale);
    await this.userRepository.save(user);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Publish event
    await this.eventPublisher.publishUserSignedIn({
      userId: user.id,
      email: user.email,
      timestamp: new Date().toISOString(),
    });

    // Look up profile to get onboardingCompleted status
    let onboardingCompleted = false;
    let profileCompletionStatus: string | undefined;
    try {
      if (user.accountType === AccountType.CUSTOMER) {
        const profile = await this.customerProfileRepository.findOne({ where: { customerId: user.id } });
        onboardingCompleted = profile?.onboardingCompleted ?? false;
        profileCompletionStatus = profile?.profileCompletionStatus;
      } else if (user.accountType === AccountType.WELPER) {
        const profile = await this.welperProfileRepository.findOne({ where: { welperId: user.id } });
        onboardingCompleted = profile?.onboardingCompleted ?? false;
      }
    } catch (err) {
      this.logger.warn(`Failed to fetch onboardingCompleted for user ${user.id}: ${(err as Error).message}`);
    }

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        accountType: user.accountType,
        status: user.status,
        emailVerified: user.emailVerified,
        signupCompleted: user.signupCompleted,
        platformAccessEnabled: platformAccessEnabledForClients(),
        onboardingCompleted,
        profileCompletionStatus,
      },
    };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto & { email?: string }): Promise<void> {
    const { token, email } = verifyEmailDto;
    // Pair the lookup with the supplied email when present, so a collision in
    // the small 6-digit code namespace can't verify the wrong user's email.
    await this.emailVerificationService.verifyEmail(token, email);
  }

  async resendVerificationEmail(userId: string): Promise<void> {
    await this.emailVerificationService.resendVerificationEmail(userId);
  }

  async requestResetPassword(
    requestResetDto: RequestResetPasswordDto,
  ): Promise<void> {
    const { email, preferredLocale } = requestResetDto;
    await this.passwordResetService.requestPasswordReset(email, { preferredLocale });
  }

  async updatePreferredLocale(
    userId: string,
    preferredLocale: UserPreferredLocale,
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.preferredLocale = preferredLocale;
    await this.userRepository.save(user);
  }

  async confirmResetPassword(
    confirmResetDto: ConfirmResetPasswordDto,
  ): Promise<void> {
    const { token, newPassword } = confirmResetDto;
    await this.passwordResetService.confirmPasswordReset(token, newPassword);
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, this.saltRounds);

    // Update password
    user.passwordHash = passwordHash;
    await this.userRepository.save(user);
  }

  async refreshToken(oldRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!refreshSecret?.trim()) {
      this.logger.error('JWT_REFRESH_SECRET is not set or empty; cannot verify refresh token');
      throw new UnauthorizedException('Invalid refresh token');
    }

    try {
      const payload = this.jwtService.verify(oldRefreshToken, {
        secret: refreshSecret,
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        this.logger.warn(`Refresh token valid but user not found: sub=${payload.sub}`);
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (user.status !== AccountStatus.ACTIVE) {
        this.logger.warn(`Refresh token for inactive user: ${user.id} status=${user.status}`);
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Rotate: issue both a new access token AND a new refresh token.
      // The old refresh token is still valid until it expires (stateless JWT),
      // but the client should discard it in favour of the new one.
      return this.generateTokens(user);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.warn(
        `Refresh token verification failed: ${error instanceof Error ? error.name : 'Error'} - ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(userId: string): Promise<UserAccount | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || user.status !== AccountStatus.ACTIVE) {
      return null;
    }

    return user;
  }

  /**
   * Day 15 — Phase 1 of the signup ↔ onboarding merge.
   *
   * Public entry-point for token issuance, used by the BFF auth.service for
   * the signup-wizard's `/auth/signup/begin` endpoint. The wizard needs the
   * access token immediately for subsequent step calls without a second
   * login round-trip.
   */
  async generateTokensFor(user: UserAccount): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    return this.generateTokens(user);
  }

  private async generateTokens(user: UserAccount): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload = {
      sub: user.id,
      email: user.email,
      accountType: user.accountType,
    };

    const accessToken = this.jwtService.sign(
      payload,
      accessTokenSignOptions(this.configService),
    );

    const refreshToken = this.jwtService.sign(
      payload,
      refreshTokenSignOptions(this.configService),
    );

    return { accessToken, refreshToken };
  }
}

