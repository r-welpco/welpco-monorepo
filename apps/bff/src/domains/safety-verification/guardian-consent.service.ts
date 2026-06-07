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
  ): Promise<GuardianConsentStatusDto> {
    if (!(await this.isMinorWelper(minorUserId))) {
      throw new BadRequestException('Guardian consent is only required for minor welpers');
    }

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
    const normalizedEmail = dto.guardianEmail.trim().toLowerCase();

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
      consent.consentedAt = null;
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
      });
    }

    await this.consentRepo.save(consent);

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

    return this.getStatus(minorUserId);
  }

  async resendEmail(minorUserId: string): Promise<GuardianConsentStatusDto> {
    const consent = await this.consentRepo.findOne({ where: { minorUserId } });
    if (!consent) {
      throw new BadRequestException('Submit guardian information before resending the email');
    }
    if (consent.status === GuardianConsentStatus.APPROVED) {
      return this.getStatus(minorUserId);
    }

    const rateLimitKey = `guardian-consent:resend:${minorUserId}`;
    const count = (await this.cacheService.get<number>(rateLimitKey)) ?? 0;
    if (count >= MAX_RESEND_PER_HOUR) {
      throw new BadRequestException('Too many resend attempts. Try again later.');
    }
    await this.cacheService.increment(rateLimitKey, 3600);

    const token = randomUUID();
    consent.tokenHash = hashToken(token);
    consent.tokenExpiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000);
    consent.status = GuardianConsentStatus.PENDING;
    await this.consentRepo.save(consent);

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

    return this.getStatus(minorUserId);
  }

  async getReviewPreview(token: string): Promise<GuardianReviewPreviewDto> {
    const consent = await this.findByToken(token);
    if (!consent) {
      throw new BadRequestException('Invalid or expired review link');
    }

    await this.expireIfNeeded(consent);

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
    consent.tokenHash = null;
    consent.tokenExpiresAt = null;
    consent.ipAddress = meta?.ipAddress ?? null;
    consent.userAgent = meta?.userAgent ?? null;
    await this.consentRepo.save(consent);

    await this.signupOrchestrator.refreshWelperDiscoverability(consent.minorUserId);

    return { approved: true };
  }

  private async findByToken(token: string): Promise<MinorGuardianConsent | null> {
    const trimmed = token.trim();
    if (!trimmed) return null;
    return this.consentRepo.findOne({
      where: { tokenHash: hashToken(trimmed) },
    });
  }

  private async expireIfNeeded(consent: MinorGuardianConsent): Promise<void> {
    if (
      consent.status === GuardianConsentStatus.PENDING &&
      consent.tokenExpiresAt &&
      consent.tokenExpiresAt.getTime() < Date.now()
    ) {
      consent.status = GuardianConsentStatus.EXPIRED;
      await this.consentRepo.save(consent);
    }
  }
}
