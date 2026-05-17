import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WelperProfile } from '../profile-management/entities/welper-profile.entity';
import { UserAccount, AccountType } from '../user-management/entities/user-account.entity';
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
  ) {}

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

  async assertCanAcceptBookings(userId: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || user.accountType !== AccountType.WELPER) return;

    if (!(await this.isBackgroundCheckRequiredForUser(userId))) {
      return;
    }

    const verification = await this.verificationRepo.findOne({ where: { userId } });
    if (verification?.backgroundCheckStatus === BackgroundCheckStatus.PASSED) {
      return;
    }

    throw new ForbiddenException({
      code: 'BACKGROUND_CHECK_REQUIRED',
      message:
        'Your background check must be approved before you can accept bookings or appear in search.',
    });
  }

  async assertVisibleInSearch(userId: string): Promise<boolean> {
    if (!(await this.isBackgroundCheckRequiredForUser(userId))) {
      return true;
    }
    const verification = await this.verificationRepo.findOne({ where: { userId } });
    return verification?.backgroundCheckStatus === BackgroundCheckStatus.PASSED;
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
      this.logger.error(`Cannot invite Certn — missing welper profile for ${order.userId}`);
      order.failureReason = 'missing_profile';
      await this.orderRepo.save(order);
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
