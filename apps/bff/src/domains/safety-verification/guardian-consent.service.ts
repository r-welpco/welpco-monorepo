import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { EmailService } from '../user-management/email/email.service';
import { CacheService } from '../user-management/cache/cache.service';
import { WelperProfile } from '../profile-management/entities/welper-profile.entity';
import { UserAccount } from '../user-management/entities/user-account.entity';
import { SignupOrchestratorService } from '../user-management/auth/signup-orchestrator.service';
import {
  resolvePreferredLocale,
  type UserPreferredLocale,
} from '../../common/preferred-locale';
import { isAdultWelper } from './background-check-age.util';
import { SubmitGuardianRequestDto } from './dto/submit-guardian-request.dto';
import {
  GuardianConsentStatus,
  MinorGuardianConsent,
} from './entities/minor-guardian-consent.entity';

const TOKEN_TTL_SECONDS = 72 * 60 * 60;
const MAX_RESEND_PER_HOUR = 3;
const MAX_REQUESTS_PER_HOUR = 5;
const MAX_PREVIEWS_PER_HOUR = 30;
const MAX_ACTIONS_PER_HOUR = 10;

export interface GuardianConsentStatusDto {
  required: boolean;
  status: GuardianConsentStatus | null;
  guardianFullName: string | null;
  guardianEmail: string | null;
  guardianPhone: string | null;
  relationshipType: string | null;
  consentedAt: string | null;
  tokenExpiresAt: string | null;
  signupStepComplete: boolean;
}

export interface GuardianReviewPreviewDto {
  minorFirstName: string;
  minorLastName: string;
  guardianFullName: string;
  relationshipType: string;
  status: GuardianConsentStatus;
  alreadyApproved: boolean;
  expired: boolean;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class GuardianConsentService {
  private readonly logger = new Logger(GuardianConsentService.name);

  constructor(
    @InjectRepository(MinorGuardianConsent)
    private readonly consentRepo: Repository<MinorGuardianConsent>,
    @InjectRepository(WelperProfile)
    private readonly welperProfileRepo: Repository<WelperProfile>,
    @InjectRepository(UserAccount)
    private readonly userRepo: Repository<UserAccount>,
    private readonly emailService: EmailService,
    private readonly cacheService: CacheService,
    @Inject(forwardRef(() => SignupOrchestratorService))
    private readonly signupOrchestrator: SignupOrchestratorService,
  ) {}

  async isMinorWelper(userId: string): Promise<boolean> {
    const welper = await this.welperProfileRepo.findOne({
      where: { welperId: userId },
    });
    if (!welper?.dateOfBirth) return false;
    return !isAdultWelper(welper.dateOfBirth);
  }

  async hasApprovedConsent(minorUserId: string): Promise<boolean> {
    const consent = await this.consentRepo.findOne({
      where: { minorUserId },
    });
    return consent?.status === GuardianConsentStatus.APPROVED;
  }

  async getStatus(minorUserId: string): Promise<GuardianConsentStatusDto> {
    const required = await this.isMinorWelper(minorUserId);
    if (!required) {
      return {
        required: false,
        status: null,
        guardianFullName: null,
        guardianEmail: null,
        guardianPhone: null,
        relationshipType: null,
        consentedAt: null,
        tokenExpiresAt: null,
        signupStepComplete: true,
      };
    }

    const consent = await this.consentRepo.findOne({
      where: { minorUserId },
    });

    if (!consent) {
      return {
        required: true,
        status: null,
        guardianFullName: null,
        guardianEmail: null,
        guardianPhone: null,
        relationshipType: null,
        consentedAt: null,
        tokenExpiresAt: null,
        signupStepComplete: false,
      };
    }

    await this.expireIfNeeded(consent);

    return {
      required: true,
      status: consent.status,
      guardianFullName: consent.guardianFullName,
      guardianEmail: consent.guardianEmail,
      guardianPhone: consent.guardianPhone,
      relationshipType: consent.relationshipType,
      consentedAt: consent.consentedAt?.toISOString() ?? null,
      tokenExpiresAt: consent.tokenExpiresAt?.toISOString() ?? null,
      signupStepComplete: consent.status === GuardianConsentStatus.APPROVED,
    };
  }

  async submitRequest(
    minorUserId: string,
    dto: SubmitGuardianRequestDto,
    meta?: { ipAddress?: string },
  ): Promise<GuardianConsentStatusDto> {
    if (!(await this.isMinorWelper(minorUserId))) {
      throw new BadRequestException('Guardian consent is only required for minor welpers');
    }

    const normalizedEmail = dto.guardianEmail.trim().toLowerCase();
    await this.consumeRateLimit(
      `guardian-consent:request:${minorUserId}:${hashToken(normalizedEmail)}:${meta?.ipAddress ?? 'unknown'}`,
      MAX_REQUESTS_PER_HOUR,
    );

    const welper = await this.welperProfileRepo.findOne({
      where: { welperId: minorUserId },
    });
    const user = await this.userRepo.findOne({ where: { id: minorUserId } });
    if (!welper || !user) {
      throw new NotFoundException('Welper profile not found');
    }

    const token = randomUUID();
    const tokenHash = hashToken(token);
    const tokenExpiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000);

    let consent = await this.consentRepo.findOne({ where: { minorUserId } });
    if (consent?.status === GuardianConsentStatus.APPROVED) {
      throw new BadRequestException('Guardian consent is already approved');
    }

    if (consent) {
      consent.guardianFullName = dto.guardianFullName.trim();
      consent.guardianEmail = normalizedEmail;
      consent.guardianPhone = dto.guardianPhone.trim();
      consent.relationshipType = dto.relationshipType;
      consent.status = GuardianConsentStatus.PENDING;
      consent.tokenHash = tokenHash;
      consent.tokenExpiresAt = tokenExpiresAt;
      consent.managementTokenHash = null;
      consent.consentedAt = null;
      consent.revokedAt = null;
      consent.ipAddress = null;
      consent.userAgent = null;
    } else {
      consent = this.consentRepo.create({
        minorUserId,
        guardianFullName: dto.guardianFullName.trim(),
        guardianEmail: normalizedEmail,
        guardianPhone: dto.guardianPhone.trim(),
        relationshipType: dto.relationshipType,
        status: GuardianConsentStatus.PENDING,
        tokenHash,
        tokenExpiresAt,
        managementTokenHash: null,
        revokedAt: null,
      });
    }

    const locale = resolvePreferredLocale(user.preferredLocale);
    try {
      await this.emailService.sendGuardianReviewEmail(normalizedEmail, token, {
        locale,
        guardianName: consent.guardianFullName,
        minorFirstName: welper.firstName ?? 'your child',
        minorLastName: welper.lastName ?? '',
      });
    } catch (err) {
      this.logger.warn(
        `Guardian review email failed for minor ${minorUserId}: ${(err as Error).message}`,
      );
      throw new BadRequestException(
        'We could not send the guardian review email. Check the email address and try again.',
      );
    }

    await this.consentRepo.save(consent);
    return this.getStatus(minorUserId);
  }

  async resendEmail(
    minorUserId: string,
    meta?: { ipAddress?: string },
  ): Promise<GuardianConsentStatusDto> {
    const consent = await this.consentRepo.findOne({ where: { minorUserId } });
    if (!consent) {
      throw new BadRequestException('Submit guardian information before resending the email');
    }
    if (consent.status === GuardianConsentStatus.APPROVED) {
      return this.getStatus(minorUserId);
    }

    const rateLimitKey = `guardian-consent:resend:${minorUserId}:${meta?.ipAddress ?? 'unknown'}`;
    const count = (await this.cacheService.get<number>(rateLimitKey)) ?? 0;
    if (count >= MAX_RESEND_PER_HOUR) {
      throw new BadRequestException('Too many resend attempts. Try again later.');
    }
    const token = randomUUID();
    const welper = await this.welperProfileRepo.findOne({
      where: { welperId: minorUserId },
    });
    const user = await this.userRepo.findOne({ where: { id: minorUserId } });
    const locale = resolvePreferredLocale(user?.preferredLocale);

    await this.emailService.sendGuardianReviewEmail(consent.guardianEmail, token, {
      locale,
      guardianName: consent.guardianFullName,
      minorFirstName: welper?.firstName ?? 'your child',
      minorLastName: welper?.lastName ?? '',
    });

    consent.tokenHash = hashToken(token);
    consent.tokenExpiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000);
    consent.status = GuardianConsentStatus.PENDING;
    await this.consentRepo.save(consent);
    await this.cacheService.increment(rateLimitKey, 3600);

    return this.getStatus(minorUserId);
  }

  async getReviewPreview(
    token: string,
    meta?: { ipAddress?: string },
  ): Promise<GuardianReviewPreviewDto> {
    await this.consumePublicTokenRateLimit(
      'preview',
      token,
      meta?.ipAddress,
      MAX_PREVIEWS_PER_HOUR,
    );
    const consent = await this.findByToken(token);
    if (!consent) {
      throw new BadRequestException('Invalid or expired review link');
    }

    if (await this.expireIfNeeded(consent)) {
      throw new BadRequestException('Invalid or expired review link');
    }

    const welper = await this.welperProfileRepo.findOne({
      where: { welperId: consent.minorUserId },
    });

    return {
      minorFirstName: welper?.firstName ?? '',
      minorLastName: welper?.lastName ?? '',
      guardianFullName: consent.guardianFullName,
      relationshipType: consent.relationshipType,
      status: consent.status,
      alreadyApproved: consent.status === GuardianConsentStatus.APPROVED,
      expired: consent.status === GuardianConsentStatus.EXPIRED,
    };
  }

  async approveByToken(
    token: string,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<{ approved: boolean }> {
    await this.consumePublicTokenRateLimit(
      'approve',
      token,
      meta?.ipAddress,
      MAX_ACTIONS_PER_HOUR,
    );
    const consent = await this.findByToken(token);
    if (!consent) {
      throw new BadRequestException('Invalid or expired review link');
    }

    if (consent.status === GuardianConsentStatus.APPROVED) {
      return { approved: true };
    }

    await this.expireIfNeeded(consent);
    if (consent.status === GuardianConsentStatus.EXPIRED) {
      throw new BadRequestException('This review link has expired');
    }

    consent.status = GuardianConsentStatus.APPROVED;
    consent.consentedAt = new Date();
    consent.revokedAt = null;
    consent.managementTokenHash = hashToken(token);
    consent.tokenHash = null;
    consent.tokenExpiresAt = null;
    consent.ipAddress = meta?.ipAddress ?? null;
    consent.userAgent = meta?.userAgent ?? null;
    await this.consentRepo.save(consent);

    await this.signupOrchestrator.refreshWelperDiscoverability(consent.minorUserId);

    return { approved: true };
  }

  async declineByToken(
    token: string,
    meta?: { ipAddress?: string },
  ): Promise<{ declined: boolean }> {
    await this.consumePublicTokenRateLimit(
      'decline',
      token,
      meta?.ipAddress,
      MAX_ACTIONS_PER_HOUR,
    );
    const consent = await this.findByToken(token);
    if (!consent) {
      throw new BadRequestException('Invalid or expired review link');
    }
    if (consent.status === GuardianConsentStatus.APPROVED) {
      throw new BadRequestException('Approved consent must be revoked instead');
    }
    if (await this.expireIfNeeded(consent)) {
      throw new BadRequestException('This review link has expired');
    }

    consent.status = GuardianConsentStatus.DECLINED;
    consent.tokenHash = null;
    consent.tokenExpiresAt = null;
    consent.managementTokenHash = null;
    await this.consentRepo.save(consent);
    await this.signupOrchestrator.refreshWelperDiscoverability(consent.minorUserId);
    return { declined: true };
  }

  async revokeByToken(
    token: string,
    meta?: { ipAddress?: string },
  ): Promise<{ revoked: boolean }> {
    await this.consumePublicTokenRateLimit(
      'revoke',
      token,
      meta?.ipAddress,
      MAX_ACTIONS_PER_HOUR,
    );
    const consent = await this.findByToken(token);
    if (
      !consent ||
      consent.status !== GuardianConsentStatus.APPROVED ||
      consent.managementTokenHash !== hashToken(token.trim())
    ) {
      throw new BadRequestException('Invalid guardian management link');
    }

    consent.status = GuardianConsentStatus.DECLINED;
    consent.revokedAt = new Date();
    consent.managementTokenHash = null;
    await this.consentRepo.save(consent);
    await this.signupOrchestrator.refreshWelperDiscoverability(consent.minorUserId);
    return { revoked: true };
  }

  private async findByToken(token: string): Promise<MinorGuardianConsent | null> {
    const trimmed = token.trim();
    if (!trimmed) return null;
    const tokenHash = hashToken(trimmed);
    return this.consentRepo.findOne({
      where: [{ tokenHash }, { managementTokenHash: tokenHash }],
    });
  }

  private async expireIfNeeded(consent: MinorGuardianConsent): Promise<boolean> {
    if (
      consent.status === GuardianConsentStatus.PENDING &&
      consent.tokenExpiresAt &&
      consent.tokenExpiresAt.getTime() < Date.now()
    ) {
      consent.status = GuardianConsentStatus.EXPIRED;
      consent.tokenHash = null;
      consent.tokenExpiresAt = null;
      await this.consentRepo.save(consent);
      return true;
    }
    return false;
  }

  private async consumePublicTokenRateLimit(
    action: string,
    token: string,
    ipAddress: string | undefined,
    max: number,
  ): Promise<void> {
    const trimmed = token.trim();
    const fingerprint = trimmed ? hashToken(trimmed) : 'missing';
    await this.consumeRateLimit(
      `guardian-consent:${action}:${ipAddress ?? 'unknown'}:${fingerprint}`,
      max,
    );
  }

  private async consumeRateLimit(key: string, max: number): Promise<void> {
    const count = (await this.cacheService.get<number>(key)) ?? 0;
    if (count >= max) {
      throw new BadRequestException('Too many attempts. Try again later.');
    }
    await this.cacheService.increment(key, 3600);
  }
}
