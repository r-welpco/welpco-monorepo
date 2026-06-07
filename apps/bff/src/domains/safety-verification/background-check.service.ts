import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EmailService } from '../user-management/email/email.service';
import { WelperProfile } from '../profile-management/entities/welper-profile.entity';
import { UserAccount } from '../user-management/entities/user-account.entity';
import {
  VerificationStatus,
  BackgroundCheckStatus,
} from '../user-management/entities/verification-status.entity';
import {
  BackgroundCheckOrder,
  BackgroundCheckCertnStatus,
  BackgroundCheckPaymentStatus,
} from './entities/background-check-order.entity';
import { BackgroundCheckPricingService, type BackgroundCheckPricing } from './background-check-pricing.service';
import {
  CertnApiClient,
  sanitizeCertnApplicantUrl,
} from './certn-api.client';
import { isAdultWelper } from './background-check-age.util';
import {
  resolvePreferredLocale,
  type UserPreferredLocale,
} from '../../common/preferred-locale';
import { emailLocaleForUser } from '../user-management/auth/user-locale.helper';

const SIGNUP_COMPLETE_CERTN_STATUSES = new Set<BackgroundCheckCertnStatus>([
  BackgroundCheckCertnStatus.INVITED,
  BackgroundCheckCertnStatus.IN_PROGRESS,
  BackgroundCheckCertnStatus.PASSED,
]);

@Injectable()
export class BackgroundCheckService {
  private readonly logger = new Logger(BackgroundCheckService.name);

  constructor(
    @InjectRepository(BackgroundCheckOrder)
    private readonly orderRepo: Repository<BackgroundCheckOrder>,
    @InjectRepository(WelperProfile)
    private readonly welperProfileRepo: Repository<WelperProfile>,
    @InjectRepository(UserAccount)
    private readonly userRepo: Repository<UserAccount>,
    @InjectRepository(VerificationStatus)
    private readonly verificationRepo: Repository<VerificationStatus>,
    private readonly pricingService: BackgroundCheckPricingService,
    private readonly certnClient: CertnApiClient,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
  ) {}

  /** When false (default), applicants receive the manual screening link by email. */
  isCertnApiEnabled(): boolean {
    const raw = this.config.get<string>('CERTN_API_ENABLED')?.trim().toLowerCase();
    return raw === 'true' || raw === '1';
  }

  /** Manual Certn screening link for email (locale-specific when configured). */
  resolveManualApplicantUrl(locale?: UserPreferredLocale | string): string | null {
    const resolved = resolvePreferredLocale(locale);
    const pick = (key: string) => {
      const url = this.config.get<string>(key)?.trim();
      return url && url.startsWith('http') ? url : null;
    };

    if (resolved === 'fr') {
      return pick('BACKGROUND_CHECK_APPLICANT_URL_FR') ?? pick('BACKGROUND_CHECK_APPLICANT_URL');
    }
    return pick('BACKGROUND_CHECK_APPLICANT_URL');
  }

  async getPaymentSummaryByUserIds(
    userIds: string[],
  ): Promise<Map<string, { paid: boolean; paidAt: string | null; certnStatus: string | null }>> {
    const map = new Map<
      string,
      { paid: boolean; paidAt: string | null; certnStatus: string | null }
    >();
    if (userIds.length === 0) return map;

    const orders = await this.orderRepo.find({
      where: { userId: In(userIds) },
      select: ['userId', 'paymentStatus', 'paidAt', 'certnStatus'],
    });
    for (const order of orders) {
      map.set(order.userId, {
        paid: order.paymentStatus === BackgroundCheckPaymentStatus.PAID,
        paidAt: order.paidAt?.toISOString() ?? null,
        certnStatus: order.certnStatus,
      });
    }
    return map;
  }

  async getPricing(): Promise<BackgroundCheckPricing> {
    return this.pricingService.getPricing();
  }

  async isBackgroundCheckRequiredForUser(userId: string): Promise<boolean> {
    const welper = await this.welperProfileRepo.findOne({ where: { welperId: userId } });
    if (!welper?.dateOfBirth) return true;
    return isAdultWelper(welper.dateOfBirth);
  }

  async assertAdultWelper(userId: string): Promise<void> {
    const required = await this.isBackgroundCheckRequiredForUser(userId);
    if (!required) {
      throw new BadRequestException('Background check is not required for minor welpers');
    }
  }

  async markAdultPendingIfNeeded(userId: string): Promise<void> {
    if (!(await this.isBackgroundCheckRequiredForUser(userId))) return;
    let verification = await this.verificationRepo.findOne({ where: { userId } });
    if (!verification) {
      verification = this.verificationRepo.create({ userId });
    }
    if (verification.backgroundCheckStatus === BackgroundCheckStatus.NOT_REQUIRED) {
      verification.backgroundCheckStatus = BackgroundCheckStatus.PENDING;
      await this.verificationRepo.save(verification);
    }
  }

  async skipForMinor(userId: string): Promise<void> {
    let verification = await this.verificationRepo.findOne({ where: { userId } });
    if (!verification) {
      verification = this.verificationRepo.create({
        userId,
        backgroundCheckStatus: BackgroundCheckStatus.NOT_REQUIRED,
      });
    } else if (verification.backgroundCheckStatus === BackgroundCheckStatus.PENDING) {
      verification.backgroundCheckStatus = BackgroundCheckStatus.NOT_REQUIRED;
    }
    await this.verificationRepo.save(verification);
  }

  async getStatus(userId: string) {
    const pricing = await this.pricingService.getPricing();
    const required = await this.isBackgroundCheckRequiredForUser(userId);
    let order = await this.orderRepo.findOne({ where: { userId } });
    const verification = await this.verificationRepo.findOne({ where: { userId } });

    const certnInviteRetryable =
      order?.failureReason == null ||
      order.failureReason.startsWith('certn_invite_failed');
    if (
      order?.paymentStatus === BackgroundCheckPaymentStatus.PAID &&
      order.certnStatus === BackgroundCheckCertnStatus.NOT_STARTED &&
      certnInviteRetryable
    ) {
      if (order.failureReason) {
        order.failureReason = null;
        await this.orderRepo.save(order);
      }
      await this.onPaymentSucceeded(order.id);
      order = await this.orderRepo.findOne({ where: { userId } });
    }

    return {
      required,
      pricing,
      paymentStatus: order?.paymentStatus ?? null,
      certnStatus: order?.certnStatus ?? BackgroundCheckCertnStatus.NOT_STARTED,
      certnApplicantUrl: sanitizeCertnApplicantUrl(order?.certnApplicantUrl),
      certnInviteSentViaEmail:
        order?.certnStatus === BackgroundCheckCertnStatus.INVITED ||
        order?.certnStatus === BackgroundCheckCertnStatus.IN_PROGRESS
          ? !sanitizeCertnApplicantUrl(order?.certnApplicantUrl) &&
            !order?.failureReason
          : false,
      failureReason: order?.failureReason ?? null,
      backgroundCheckStatus:
        verification?.backgroundCheckStatus ?? BackgroundCheckStatus.PENDING,
      signupStepComplete: required
        ? await this.isSignupStepComplete(userId)
        : true,
      certnInviteReady: order
        ? this.isCertnInviteReady(order.certnStatus)
        : false,
    };
  }

  /** Re-send Certn invite after payment when the first attempt failed or was skipped. */
  async retryCertnInvite(userId: string): Promise<void> {
    await this.assertAdultWelper(userId);
    const order = await this.orderRepo.findOne({ where: { userId } });
    if (!order || order.paymentStatus !== BackgroundCheckPaymentStatus.PAID) {
      throw new BadRequestException('Background check fee must be paid before starting Certn');
    }
    if (SIGNUP_COMPLETE_CERTN_STATUSES.has(order.certnStatus)) {
      return;
    }
    order.failureReason = null;
    await this.orderRepo.save(order);
    await this.onPaymentSucceeded(order.id);
  }

  /** Re-send the screening invite email when the applicant did not receive the first message. */
  async resendInviteEmail(userId: string): Promise<void> {
    await this.assertAdultWelper(userId);
    const order = await this.orderRepo.findOne({ where: { userId } });
    if (!order || order.paymentStatus !== BackgroundCheckPaymentStatus.PAID) {
      throw new BadRequestException('Background check fee must be paid before resending the invite');
    }

    const verification = await this.verificationRepo.findOne({ where: { userId } });
    if (verification?.backgroundCheckStatus === BackgroundCheckStatus.PASSED) {
      return;
    }
    if (order.certnStatus === BackgroundCheckCertnStatus.PASSED) {
      return;
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    const welper = await this.welperProfileRepo.findOne({
      where: { welperId: userId },
    });
    if (!user || !welper?.firstName) {
      throw new BadRequestException(
        'We need your name from the identity step before we can resend the screening email',
      );
    }

    const inviteNeverSent =
      order.certnStatus === BackgroundCheckCertnStatus.NOT_STARTED ||
      order.failureReason?.startsWith('certn_invite_failed') ||
      order.failureReason === 'background_check_email_failed' ||
      order.failureReason === 'missing_background_check_url';

    if (inviteNeverSent) {
      order.failureReason = null;
      await this.orderRepo.save(order);
      await this.onPaymentSucceeded(order.id);
      return;
    }

    const locale = emailLocaleForUser(user);
    const applicantUrl =
      sanitizeCertnApplicantUrl(order.certnApplicantUrl) ??
      this.resolveManualApplicantUrl(locale);
    if (!applicantUrl) {
      throw new BadRequestException(
        'No screening link is available to resend. Check your inbox and spam folder, or contact support.',
      );
    }

    try {
      await this.emailService.sendBackgroundCheckInviteEmail(user.email, applicantUrl, {
        locale,
        firstName: welper.firstName,
      });
      order.failureReason = null;
      await this.orderRepo.save(order);
      this.logger.log(`Background check invite email resent to ${user.email}`);
    } catch (err) {
      const message = (err as Error).message;
      this.logger.error(`Background check email resend failed for order ${order.id}: ${message}`);
      throw new BadRequestException('We could not resend the screening email. Try again in a moment.');
    }
  }

  async getFilledData(userId: string) {
    const pricing = await this.pricingService.getPricing();
    const order = await this.orderRepo.findOne({ where: { userId } });
    return {
      paid: order?.paymentStatus === BackgroundCheckPaymentStatus.PAID,
      certnStatus: order?.certnStatus ?? BackgroundCheckCertnStatus.NOT_STARTED,
      applicantUrl: order?.certnApplicantUrl ?? undefined,
      listPriceCents: pricing.listPriceCents,
      promoPriceCents: pricing.promoPriceCents,
      promoEnabled: pricing.promoEnabled,
    };
  }

  /** Wizard can continue after payment; Certn screening may still be in progress. */
  async isSignupStepComplete(userId: string): Promise<boolean> {
    if (!(await this.isBackgroundCheckRequiredForUser(userId))) {
      return true;
    }
    const order = await this.orderRepo.findOne({ where: { userId } });
    return order?.paymentStatus === BackgroundCheckPaymentStatus.PAID;
  }

  isCertnInviteReady(certnStatus: BackgroundCheckCertnStatus): boolean {
    return SIGNUP_COMPLETE_CERTN_STATUSES.has(certnStatus);
  }

  async assertCanAcceptBookings(_userId: string): Promise<void> {
    // Background check is optional for accepting bookings; trust badge still
    // reflects Passed status on public profiles.
  }

  async assertVisibleInSearch(userId: string): Promise<boolean> {
    if (!(await this.isBackgroundCheckRequiredForUser(userId))) {
      return true;
    }
    return this.isAdminBackgroundCheckApproved(userId);
  }

  /** Dashboard setup checklist — green only after admin marks verification Passed. */
  async isAdminBackgroundCheckApproved(userId: string): Promise<boolean> {
    if (!(await this.isBackgroundCheckRequiredForUser(userId))) {
      return true;
    }
    const verification = await this.verificationRepo.findOne({ where: { userId } });
    return verification?.backgroundCheckStatus === BackgroundCheckStatus.PASSED;
  }

  /** True only when an adult welper's background check is explicitly Passed. */
  async hasPassedBackgroundCheck(userId: string): Promise<boolean> {
    const map = await this.getBackgroundCheckPassedByUserIds([userId]);
    return map.get(userId) === true;
  }

  async getBackgroundCheckPassedByUserIds(
    userIds: string[],
  ): Promise<Map<string, boolean>> {
    const map = new Map<string, boolean>();
    if (userIds.length === 0) return map;

    for (const userId of userIds) {
      map.set(userId, false);
    }

    const verifications = await this.verificationRepo.find({
      where: { userId: In(userIds) },
      select: ['userId', 'backgroundCheckStatus'],
    });
    for (const verification of verifications) {
      map.set(
        verification.userId,
        verification.backgroundCheckStatus === BackgroundCheckStatus.PASSED,
      );
    }
    return map;
  }

  async onPaymentSucceeded(orderId: string): Promise<void> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) return;

    await this.setVerificationBackgroundCheckStatus(
      order.userId,
      BackgroundCheckStatus.IN_PROGRESS,
    );

    if (SIGNUP_COMPLETE_CERTN_STATUSES.has(order.certnStatus)) {
      return;
    }

    await this.submitCertnInvite(order);
  }

  private async submitCertnInvite(order: BackgroundCheckOrder): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: order.userId } });
    const welper = await this.welperProfileRepo.findOne({
      where: { welperId: order.userId },
    });
    if (!user || !welper?.firstName || !welper.lastName || !welper.dateOfBirth) {
      this.logger.error(`Cannot start background check — missing welper profile for ${order.userId}`);
      order.failureReason = 'missing_profile';
      await this.orderRepo.save(order);
      return;
    }

    if (!this.isCertnApiEnabled()) {
      await this.sendManualBackgroundCheckEmail(order, user, welper.firstName);
      return;
    }

    const dob =
      welper.dateOfBirth instanceof Date
        ? welper.dateOfBirth.toISOString().slice(0, 10)
        : String(welper.dateOfBirth).slice(0, 10);

    try {
      const result = await this.certnClient.createInvite({
        email: user.email,
        firstName: welper.firstName,
        lastName: welper.lastName,
        dateOfBirth: dob,
      });

      order.certnApplicationId = result.applicationId;
      order.certnApplicantUrl = sanitizeCertnApplicantUrl(result.applicantUrl);
      order.certnStatus = BackgroundCheckCertnStatus.INVITED;
      order.failureReason = null;
      if (result.inviteDeliveredViaEmail && !order.certnApplicantUrl) {
        this.logger.log(
          `Certn invite ${result.applicationId}: screening link emailed to ${user.email}`,
        );
      }
      order.submittedAt = new Date();
      await this.orderRepo.save(order);
    } catch (err) {
      const message = (err as Error).message;
      this.logger.error(`Certn invite failed for order ${order.id}: ${message}`);
      order.failureReason = message.includes('Certn invite failed')
        ? `certn_invite_failed:${message.slice(0, 200)}`
        : 'certn_invite_failed';
      await this.orderRepo.save(order);
    }
  }

  private async sendManualBackgroundCheckEmail(
    order: BackgroundCheckOrder,
    user: UserAccount,
    firstName: string,
  ): Promise<void> {
    const locale = emailLocaleForUser(user);
    const applicantUrl = this.resolveManualApplicantUrl(locale);
    if (!applicantUrl) {
      const envKeys =
        locale === 'fr'
          ? 'BACKGROUND_CHECK_APPLICANT_URL_FR or BACKGROUND_CHECK_APPLICANT_URL'
          : 'BACKGROUND_CHECK_APPLICANT_URL';
      this.logger.error(`${envKeys} is not set — cannot email screening link`);
      order.failureReason = 'missing_background_check_url';
      await this.orderRepo.save(order);
      return;
    }

    try {
      await this.emailService.sendBackgroundCheckInviteEmail(user.email, applicantUrl, {
        locale,
        firstName,
      });
      order.certnApplicationId = order.certnApplicationId ?? `manual-${order.id}`;
      order.certnApplicantUrl = applicantUrl;
      order.certnStatus = BackgroundCheckCertnStatus.INVITED;
      order.failureReason = null;
      order.submittedAt = new Date();
      await this.orderRepo.save(order);
      this.logger.log(
        `Background check link emailed to ${user.email} (manual Certn flow)`,
      );
    } catch (err) {
      const message = (err as Error).message;
      this.logger.error(`Background check email failed for order ${order.id}: ${message}`);
      order.failureReason = 'background_check_email_failed';
      await this.orderRepo.save(order);
    }
  }

  async handleCertnWebhook(payload: {
    application_id?: string;
    applicationId?: string;
    status?: string;
    result?: string;
  }): Promise<void> {
    const applicationId = payload.application_id ?? payload.applicationId;
    if (!applicationId) return;

    const order = await this.orderRepo.findOne({
      where: { certnApplicationId: applicationId },
    });
    if (!order) {
      this.logger.warn(`No background check order for Certn application ${applicationId}`);
      return;
    }

    const raw = (payload.status ?? payload.result ?? '').toLowerCase();
    if (['complete', 'completed', 'cleared', 'clear', 'passed', 'pass'].some((s) => raw.includes(s))) {
      order.certnStatus = BackgroundCheckCertnStatus.PASSED;
      order.completedAt = new Date();
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);
      order.expiresAt = expires;
      await this.orderRepo.save(order);
      await this.setVerificationBackgroundCheckStatus(
        order.userId,
        BackgroundCheckStatus.PASSED,
      );
      return;
    }

    if (['fail', 'failed', 'adverse', 'rejected', 'declined'].some((s) => raw.includes(s))) {
      order.certnStatus = BackgroundCheckCertnStatus.FAILED;
      order.completedAt = new Date();
      order.failureReason = raw.slice(0, 500) || 'failed';
      await this.orderRepo.save(order);
      await this.setVerificationBackgroundCheckStatus(
        order.userId,
        BackgroundCheckStatus.FAILED,
      );
      return;
    }

    if (['progress', 'processing', 'pending', 'invited'].some((s) => raw.includes(s))) {
      order.certnStatus = BackgroundCheckCertnStatus.IN_PROGRESS;
      await this.orderRepo.save(order);
      await this.setVerificationBackgroundCheckStatus(
        order.userId,
        BackgroundCheckStatus.IN_PROGRESS,
      );
    }
  }

  private async setVerificationBackgroundCheckStatus(
    userId: string,
    status: BackgroundCheckStatus,
  ): Promise<void> {
    let verification = await this.verificationRepo.findOne({ where: { userId } });
    if (!verification) {
      verification = this.verificationRepo.create({ userId });
    }
    verification.backgroundCheckStatus = status;
    if (status === BackgroundCheckStatus.PASSED) {
      verification.verificationDate = new Date();
    }
    await this.verificationRepo.save(verification);
  }
}
