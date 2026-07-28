import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { createStripeClient } from './stripe-client';
import { BookingRequest, BookingRequestStatus } from '../booking/entities/booking-request.entity';
import { BookingServiceReceipt } from '../booking/entities/booking-service-receipt.entity';
import { validateTransition } from '../booking/booking-state-machine';
import { UserAccount } from '../user-management/entities/user-account.entity';
import { CustomerProfileService } from '../profile-management/customer-profile/customer-profile.service';
import { ApplicationSettingsService } from './application-settings.service';
import { BookingTaxService } from './booking-tax.service';
import type { BookingTaxQuote } from './booking-tax.types';
import {
  BookingPayment,
  BookingPaymentCaptureReason,
  BookingPaymentKind,
  BookingPaymentRecordStatus,
} from './entities/booking-payment.entity';
import { ProcessedWebhookEvent } from './entities/processed-webhook-event.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationCategory } from '../notification/entities';
import { getBookingNotificationCopy } from '@welpco/email';
import { getSmsBody } from '@welpco/sms';
import { buildBookingActionUrl, getFrontendBaseUrl } from '../notification/notification-locale.helper';
import { WelperPayoutLedgerService } from './welper-payout-ledger.service';
import { isStripeFeeSynced, syncStripeFeeForPaymentIntent } from './stripe-fee.util';
import { scheduledTimeToUtcMs } from '../booking/booking-schedule-time';
import {
  StripeOperationsService,
  type PaymentRecoveryTaskSummary,
  type RefundDecisionSnapshot,
} from './stripe-operations.service';

export const PAYMENT_METHOD_REQUIRED_CODE = 'PAYMENT_METHOD_REQUIRED';
/** Saved card cannot be charged off-session (e.g. SCA). Welper cannot complete accept until customer fixes card or pays another way. */
export const PAYMENT_REQUIRES_ACTION_CODE = 'payment_requires_action';

const BOOKING_PI_AUTH_IDEMPOTENCY_KEY = (bookingId: string, attempt: number) =>
  `booking-${bookingId}-authorize-v2-${attempt}`;
const BOOKING_PI_AUTH_SCA_IDEMPOTENCY_KEY = (bookingId: string, attempt: number) =>
  `booking-${bookingId}-authorize-sca-v2-${attempt}`;
const BOOKING_PI_RECEIPT_DELTA_KEY = (bookingId: string, receiptId: string) =>
  `booking-${bookingId}-receipt-delta-${receiptId}`;
const BOOKING_PI_RECEIPT_DELTA_SCA_KEY = (bookingId: string, receiptId: string) =>
  `booking-${bookingId}-receipt-delta-sca-${receiptId}`;

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly stripe: Stripe | null;
  private readonly authorizationLeadHours: number;
  private readonly authorizationDeadlineHours: number;
  private readonly authorizationCaptureBufferHours: number;
  private readonly maxAutomaticAuthorizationAttempts: number;

  constructor(
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
    @InjectRepository(BookingPayment)
    private readonly bookingPaymentRepo: Repository<BookingPayment>,
    @InjectRepository(ProcessedWebhookEvent)
    private readonly webhookEventRepo: Repository<ProcessedWebhookEvent>,
    @InjectRepository(UserAccount)
    private readonly userRepo: Repository<UserAccount>,
    @InjectRepository(BookingRequest)
    private readonly bookingRepo: Repository<BookingRequest>,
    private readonly applicationSettings: ApplicationSettingsService,
    private readonly bookingTaxService: BookingTaxService,
    private readonly customerProfileService: CustomerProfileService,
    private readonly notificationService: NotificationService,
    private readonly welperPayoutLedgerService: WelperPayoutLedgerService,
    private readonly stripeOperationsService: StripeOperationsService,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    this.stripe = key ? createStripeClient(key) : null;
    this.authorizationLeadHours = this.positiveIntegerSetting('PAYMENT_AUTHORIZATION_LEAD_HOURS', 72);
    this.authorizationDeadlineHours = this.positiveIntegerSetting('PAYMENT_AUTHORIZATION_DEADLINE_HOURS', 24);
    this.authorizationCaptureBufferHours = this.positiveIntegerSetting(
      'PAYMENT_AUTHORIZATION_CAPTURE_BUFFER_HOURS',
      6,
    );
    this.maxAutomaticAuthorizationAttempts = this.positiveIntegerSetting(
      'PAYMENT_AUTHORIZATION_MAX_AUTOMATIC_ATTEMPTS',
      2,
    );
    if (this.authorizationLeadHours <= this.authorizationDeadlineHours) {
      throw new Error('PAYMENT_AUTHORIZATION_LEAD_HOURS must be greater than PAYMENT_AUTHORIZATION_DEADLINE_HOURS');
    }
  }

  private positiveIntegerSetting(name: string, fallback: number): number {
    const raw = this.config.get<string>(name);
    const parsed = Number(raw ?? fallback);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new Error(`${name} must be a positive integer`);
    }
    return parsed;
  }

  private requireStripe(): Stripe {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    return this.stripe;
  }

  private paymentDashboardUrl(paymentIntentId: string): string {
    const liveMode = this.config.get<string>('STRIPE_SECRET_KEY')?.startsWith('sk_live_') === true;
    return `https://dashboard.stripe.com/${liveMode ? '' : 'test/'}payments/${paymentIntentId}`;
  }

  private async authorizationHoldQuote(booking: BookingRequest): Promise<BookingTaxQuote> {
    return this.bookingTaxService.quoteAuthorizationHold(booking);
  }

  private async authorizationHoldAmountCents(booking: BookingRequest): Promise<number> {
    const quote = await this.authorizationHoldQuote(booking);
    return quote.totalCents;
  }

  private async findHoldPayment(bookingId: string): Promise<BookingPayment | null> {
    return this.bookingPaymentRepo.findOne({
      where: { bookingId, paymentKind: BookingPaymentKind.HOLD },
      order: { createdAt: 'DESC' },
    });
  }

  private bookingScheduleUtcMs(booking: BookingRequest, end = false): number {
    const date = booking.scheduledDate;
    const time = end ? booking.scheduledEndTime : booking.scheduledStartTime;
    if (!date || !time) return Date.now();
    return scheduledTimeToUtcMs(
      date,
      time,
      booking.timezoneOffsetMinutes ?? null,
      booking.timezoneName ?? null,
    );
  }

  private async authorizationMetadata(
    stripe: Stripe,
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<{ chargeId: string | null; cardBrand: string | null; expiresAt: Date | null }> {
    let charge =
      paymentIntent.latest_charge && typeof paymentIntent.latest_charge !== 'string'
        ? paymentIntent.latest_charge
        : null;
    if (!charge && typeof paymentIntent.latest_charge === 'string') {
      charge = await stripe.charges.retrieve(paymentIntent.latest_charge);
    }
    const card = charge?.payment_method_details?.card;
    return {
      chargeId: charge?.id ?? null,
      cardBrand: card?.brand ?? null,
      expiresAt: card?.capture_before ? new Date(card.capture_before * 1000) : null,
    };
  }

  private authorizationRiskCode(booking: BookingRequest, expiresAt: Date | null): string | null {
    if (!expiresAt) return 'capture_before_missing';
    const safeThrough =
      this.bookingScheduleUtcMs(booking, true) + this.authorizationCaptureBufferHours * 60 * 60 * 1000;
    return expiresAt.getTime() >= safeThrough ? null : 'expires_before_service_buffer';
  }

  private async rejectUnsafeAuthorization(
    booking: BookingRequest,
    row: BookingPayment,
  ): Promise<void> {
    if (booking.paymentAuthorizationRiskCode !== 'expires_before_service_buffer') return;
    await this.tryCancelPaymentIntent(row.stripePaymentIntentId);
    row.status = BookingPaymentRecordStatus.CANCELED;
    await this.bookingPaymentRepo.save(row);
    booking.paymentAuthorizationStatus = 'failed';
    booking.paymentAuthorizationFailureCode = 'authorization_window_too_short';
    booking.paymentAuthorizationFailureMessage =
      'The card authorization does not remain valid through the service window.';
    await this.bookingRepo.save(booking);
    throw new BadRequestException(booking.paymentAuthorizationFailureMessage);
  }

  async prepareAuthorizationForAcceptance(bookingId: string): Promise<'authorized' | 'scheduled'> {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== BookingRequestStatus.PENDING) {
      throw new BadRequestException('Payment can only be prepared while the booking is pending');
    }

    const scheduledStartMs = this.bookingScheduleUtcMs(booking);
    const dueAt = new Date(scheduledStartMs - this.authorizationLeadHours * 60 * 60 * 1000);
    const deadlineAt = new Date(scheduledStartMs - this.authorizationDeadlineHours * 60 * 60 * 1000);

    booking.paymentAuthorizationDueAt = dueAt;
    booking.paymentAuthorizationDeadlineAt = deadlineAt;
    booking.paymentAuthorizationFailureCode = null;
    booking.paymentAuthorizationFailureMessage = null;
    booking.paymentAuthorizationExpiresAt = null;
    booking.paymentAuthorizationRiskCode = null;

    if (dueAt.getTime() > Date.now()) {
      booking.paymentAuthorizationStatus = 'scheduled';
      booking.paymentAuthorizationScheduledAt = new Date();
      booking.paymentAuthorizationLeaseUntil = null;
      await this.bookingRepo.save(booking);
      return 'scheduled';
    }

    await this.bookingRepo.save(booking);
    await this.authorizeHoldBeforeWelperAccept(bookingId);
    return 'authorized';
  }

  async reconcileAuthorizationForRollout(
    bookingId: string,
    apply: boolean,
  ): Promise<{
    status: string | null;
    previousDueAt: string | null;
    revisedDueAt: string | null;
    expiresAt: string | null;
    riskCode: string | null;
  }> {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    const previousDueAt = booking.paymentAuthorizationDueAt?.toISOString() ?? null;
    const revisedDueAt = new Date(
      this.bookingScheduleUtcMs(booking) - this.authorizationLeadHours * 60 * 60 * 1000,
    );
    let expiresAt = booking.paymentAuthorizationExpiresAt;
    let riskCode = booking.paymentAuthorizationRiskCode;
    const hold = await this.findHoldPayment(bookingId);
    if (hold && this.stripe) {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(hold.stripePaymentIntentId, {
        expand: ['latest_charge'],
      });
      const metadata = await this.authorizationMetadata(this.stripe, paymentIntent);
      expiresAt = metadata.expiresAt;
      riskCode = this.authorizationRiskCode(booking, expiresAt);
      if (apply) {
        hold.authorizationExpiresAt = metadata.expiresAt;
        hold.stripeChargeId = metadata.chargeId;
        hold.cardBrand = metadata.cardBrand;
        await this.bookingPaymentRepo.save(hold);
      }
    }
    if (apply) {
      if (booking.status === BookingRequestStatus.ACCEPTED && booking.paymentAuthorizationStatus === 'scheduled') {
        booking.paymentAuthorizationDueAt = revisedDueAt;
      }
      booking.paymentAuthorizationExpiresAt = expiresAt;
      booking.paymentAuthorizationRiskCode = riskCode;
      await this.bookingRepo.save(booking);
    }
    return {
      status: booking.paymentAuthorizationStatus,
      previousDueAt,
      revisedDueAt: revisedDueAt.toISOString(),
      expiresAt: expiresAt?.toISOString() ?? null,
      riskCode,
    };
  }

  /** Authorized hold amount in cents, if the primary hold is still in requires_capture state */
  async getAuthorizedHoldCents(bookingId: string): Promise<number | null> {
    const hold = await this.findHoldPayment(bookingId);
    if (!hold || hold.status !== BookingPaymentRecordStatus.AUTHORIZED) {
      return null;
    }
    return hold.amountCents;
  }

  async getAdminAuthorizationEvidence(bookingId: string): Promise<{
    stripePaymentIntentId: string | null;
    stripeDashboardUrl: string | null;
    stripeChargeId: string | null;
    cardBrand: string | null;
    captureReason: string | null;
  }> {
    const row = await this.findHoldPayment(bookingId);
    return {
      stripePaymentIntentId: row?.stripePaymentIntentId ?? null,
      stripeDashboardUrl: row?.stripePaymentIntentId
        ? this.paymentDashboardUrl(row.stripePaymentIntentId)
        : null,
      stripeChargeId: row?.stripeChargeId ?? null,
      cardBrand: row?.cardBrand ?? null,
      captureReason: row?.captureReason ?? null,
    };
  }

  async refreshBookingAuthorizationFromStripe(bookingId: string): Promise<void> {
    const row = await this.findHoldPayment(bookingId);
    if (!row) throw new NotFoundException('No payment authorization exists for this booking');
    const stripe = this.requireStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(row.stripePaymentIntentId, {
      expand: ['latest_charge'],
    });
    await this.syncPaymentIntentFromWebhook(paymentIntent);
  }

  /** Customer completes SCA for a receipt balance charge (delta PaymentIntent). */
  async getClientSecretForReceiptDeltaIfRequired(bookingId: string, customerId: string): Promise<string | null> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
    });
    if (!booking || booking.customerId !== customerId) {
      return null;
    }
    const row = await this.bookingPaymentRepo.findOne({
      where: {
        bookingId,
        paymentKind: BookingPaymentKind.DELTA_RECEIPT,
        status: BookingPaymentRecordStatus.REQUIRES_ACTION,
      },
      order: { createdAt: 'DESC' },
    });
    if (!row) {
      return null;
    }
    const stripe = this.requireStripe();
    const pi = await stripe.paymentIntents.retrieve(row.stripePaymentIntentId);
    return pi.client_secret ?? null;
  }

  /** Used by booking create — same invariant as profile Complete for customers. */
  async assertCustomerHasDefaultPaymentMethod(userId: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user?.stripeDefaultPaymentMethodId) {
      throw new BadRequestException({
        message: 'Add a default payment method in Settings before booking.',
        code: PAYMENT_METHOD_REQUIRED_CODE,
      });
    }
  }

  async ensureStripeCustomer(userId: string): Promise<UserAccount> {
    const stripe = this.requireStripe();
    let user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { welpcoUserId: user.id },
      });
      user.stripeCustomerId = customer.id;
      user = await this.userRepo.save(user);
    }
    return user;
  }

  async createSetupIntent(userId: string): Promise<{ clientSecret: string | null }> {
    const stripe = this.requireStripe();
    const user = await this.ensureStripeCustomer(userId);
    const si = await stripe.setupIntents.create({
      customer: user.stripeCustomerId!,
      usage: 'off_session',
      payment_method_types: ['card'],
    });
    return { clientSecret: si.client_secret };
  }

  /**
   * Call after the client confirms a SetupIntent (e.g. Payment Element) so the DB is updated
   * even when Stripe webhooks are not delivered (typical in local dev).
   */
  async completeSetupIntentForUser(userId: string, setupIntentId: string): Promise<void> {
    const stripe = this.requireStripe();
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user?.stripeCustomerId) {
      throw new NotFoundException('Stripe customer not found');
    }
    const si = await stripe.setupIntents.retrieve(setupIntentId);
    const customerId = typeof si.customer === 'string' ? si.customer : si.customer?.id;
    if (!customerId || customerId !== user.stripeCustomerId) {
      throw new ForbiddenException('This setup does not belong to your account');
    }
    if (si.status !== 'succeeded') {
      throw new BadRequestException('Setup is not complete yet');
    }
    await this.applySetupIntentSuccess(setupIntentId);
  }

  async applySetupIntentSuccess(setupIntentId: string): Promise<void> {
    const stripe = this.requireStripe();
    const si = await stripe.setupIntents.retrieve(setupIntentId);
    if (si.status !== 'succeeded' || typeof si.payment_method !== 'string') return;
    const customerId = typeof si.customer === 'string' ? si.customer : si.customer?.id;
    if (!customerId) return;
    const user = await this.userRepo.findOne({
      where: { stripeCustomerId: customerId },
    });
    if (!user) return;
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: si.payment_method },
    });
    user.stripeDefaultPaymentMethodId = si.payment_method;
    await this.userRepo.save(user);
    await this.customerProfileService.refreshProfileCompletionFromPayment(user.id);
  }

  async listPaymentMethods(userId: string) {
    const stripe = this.requireStripe();
    const user = await this.ensureStripeCustomer(userId);
    const list = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId!,
      type: 'card',
    });
    return list.data.map((pm) => ({
      id: pm.id,
      brand: pm.card?.brand,
      last4: pm.card?.last4,
      expMonth: pm.card?.exp_month,
      expYear: pm.card?.exp_year,
      isDefault: pm.id === user.stripeDefaultPaymentMethodId,
    }));
  }

  private async promoteDefaultPaymentMethodAfterDetach(
    user: UserAccount,
    detachedPaymentMethodId: string,
  ): Promise<void> {
    if (!user.stripeCustomerId) return;

    const stripe = this.requireStripe();
    const remaining = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card',
    });
    const replacement =
      remaining.data
        .filter((paymentMethod) => paymentMethod.id !== detachedPaymentMethodId)
        .sort(
          (left, right) =>
            right.created - left.created || left.id.localeCompare(right.id),
        )[0] ?? null;

    user.stripeDefaultPaymentMethodId = null;
    await this.userRepo.save(user);
    try {
      await stripe.customers.update(user.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: replacement?.id ?? '',
        },
      });
    } catch (error) {
      await this.customerProfileService.refreshProfileCompletionFromPayment(user.id);
      throw error;
    }
    if (replacement) {
      user.stripeDefaultPaymentMethodId = replacement.id;
      await this.userRepo.save(user);
    }
    await this.customerProfileService.refreshProfileCompletionFromPayment(user.id);
  }

  async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    const stripe = this.requireStripe();
    const user = await this.ensureStripeCustomer(userId);
    const paymentMethod = await this.requireOwnedPaymentMethod(stripe, user.stripeCustomerId!, paymentMethodId, true);
    try {
      if (!paymentMethod.customer) {
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: user.stripeCustomerId!,
        });
      }
    } catch (e) {
      this.logger.warn(
        `Could not attach payment method ${paymentMethodId} for user ${userId}: ${(e as Error).message}`,
      );
      throw new BadRequestException('Could not save this payment method');
    }
    await stripe.customers.update(user.stripeCustomerId!, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
    user.stripeDefaultPaymentMethodId = paymentMethodId;
    await this.userRepo.save(user);
    await this.customerProfileService.refreshProfileCompletionFromPayment(userId);
  }

  async detachPaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    const stripe = this.requireStripe();
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user?.stripeCustomerId) return;
    await this.requireOwnedPaymentMethod(stripe, user.stripeCustomerId, paymentMethodId, false);
    const wasDefault = user.stripeDefaultPaymentMethodId === paymentMethodId;
    await stripe.paymentMethods.detach(paymentMethodId);
    if (wasDefault) {
      await this.promoteDefaultPaymentMethodAfterDetach(user, paymentMethodId);
    } else {
      await this.customerProfileService.refreshProfileCompletionFromPayment(userId);
    }
  }

  private async requireOwnedPaymentMethod(
    stripe: Stripe,
    stripeCustomerId: string,
    paymentMethodId: string,
    allowUnattached: boolean,
  ): Promise<Stripe.PaymentMethod> {
    let paymentMethod: Stripe.PaymentMethod;
    try {
      paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    } catch (err) {
      this.logger.warn(`Payment method lookup failed for ${paymentMethodId}: ${(err as Error).message}`);
      throw new BadRequestException('Payment method is unavailable');
    }
    const ownerId =
      typeof paymentMethod.customer === 'string' ? paymentMethod.customer : (paymentMethod.customer?.id ?? null);
    if (ownerId !== stripeCustomerId && !(allowUnattached && ownerId == null)) {
      throw new ForbiddenException('Payment method does not belong to this account');
    }
    return paymentMethod;
  }

  /**
   * Place a manual-capture hold while the booking is still PENDING, before it becomes ACCEPTED.
   * Used when the welper accepts: authorization must succeed (requires_capture) or accept is aborted.
   * Does not create a "needs client 3DS" PI — off-session only; SCA cards fail with PAYMENT_REQUIRES_ACTION_CODE.
   */
  async authorizeHoldBeforeWelperAccept(
    bookingId: string,
    options?: { allowAccepted?: boolean; preserveBookingOnFailure?: boolean },
  ): Promise<void> {
    const stripe = this.requireStripe();
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (
      booking.status !== BookingRequestStatus.PENDING &&
      !(options?.allowAccepted && booking.status === BookingRequestStatus.ACCEPTED)
    ) {
      throw new BadRequestException('Payment can only be authorized while the booking is pending');
    }
    const amountCents = await this.authorizationHoldAmountCents(booking);
    if (amountCents <= 0) {
      return;
    }

    const holdQuote = await this.authorizationHoldQuote(booking);
    if (holdQuote.stripeTaxCalculationId) {
      booking.holdStripeTaxCalculationId = holdQuote.stripeTaxCalculationId;
      await this.bookingRepo.save(booking);
    }

    const user = await this.ensureStripeCustomer(booking.customerId);
    if (!user.stripeDefaultPaymentMethodId) {
      throw new BadRequestException({
        message: 'Customer has no default payment method; they must add a card in Settings before you can accept.',
        code: PAYMENT_METHOD_REQUIRED_CODE,
      });
    }
    let row = await this.findHoldPayment(bookingId);

    if (row && row.status !== BookingPaymentRecordStatus.CANCELED && row.status !== BookingPaymentRecordStatus.FAILED) {
      const existing = await stripe.paymentIntents.retrieve(row.stripePaymentIntentId, {
        expand: ['latest_charge'],
      });
      if (existing.status === 'requires_capture') {
        row = await this.upsertBookingPaymentRow(booking, existing, row.amountCents);
        await this.rejectUnsafeAuthorization(booking, row);
        booking.paymentAuthorizationStatus = 'authorized';
        booking.paymentAuthorizationFailureCode = null;
        booking.paymentAuthorizationFailureMessage = null;
        booking.paymentAuthorizationLeaseUntil = null;
        await this.bookingRepo.save(booking);
        return;
      }
    }

    if (row?.stripePaymentIntentId) {
      await this.tryCancelPaymentIntent(row.stripePaymentIntentId);
    }

    try {
      booking.paymentAuthorizationAttemptCount = (booking.paymentAuthorizationAttemptCount ?? 0) + 1;
      booking.paymentAuthorizationLastAttemptAt = new Date();
      await this.bookingRepo.save(booking);
      const pi = await stripe.paymentIntents.create(
        {
          amount: amountCents,
          currency: 'cad',
          customer: user.stripeCustomerId!,
          payment_method: user.stripeDefaultPaymentMethodId,
          capture_method: 'manual',
          confirm: true,
          off_session: true,
          metadata: {
            bookingId: booking.id,
            customerId: booking.customerId,
            welperId: booking.welperId,
          },
          expand: ['latest_charge'],
        },
        {
          idempotencyKey: BOOKING_PI_AUTH_IDEMPOTENCY_KEY(
            bookingId,
            booking.paymentAuthorizationAttemptCount,
          ),
        },
      );
      const paymentRow = await this.upsertBookingPaymentRow(booking, pi, amountCents);
      if (pi.status === 'requires_capture') {
        await this.rejectUnsafeAuthorization(booking, paymentRow);
        booking.paymentAuthorizationStatus = 'authorized';
        booking.paymentAuthorizationFailureCode = null;
        booking.paymentAuthorizationFailureMessage = null;
        booking.paymentAuthorizationLeaseUntil = null;
        await this.bookingRepo.save(booking);
        return;
      }
      if (pi.status === 'requires_action') {
        booking.paymentAuthorizationStatus = 'requires_action';
        booking.paymentAuthorizationFailureCode = PAYMENT_REQUIRES_ACTION_CODE;
        booking.paymentAuthorizationFailureMessage =
          'The customer must authenticate or update their payment method.';
        booking.paymentAuthorizationLeaseUntil = null;
        await this.bookingRepo.save(booking);
        if (!options?.preserveBookingOnFailure) {
          await this.tryCancelPaymentIntent(pi.id);
          await this.onBookingCanceled(bookingId);
        }
        throw new BadRequestException({
          message:
            'The customer’s card requires additional authentication. They may need to use a different card or complete verification in Settings.',
          code: PAYMENT_REQUIRES_ACTION_CODE,
        });
      }
      this.logger.warn(`Unexpected PI status after off-session confirm: ${pi.status} booking=${bookingId}`);
      await this.tryCancelPaymentIntent(pi.id);
      booking.paymentAuthorizationStatus = 'failed';
      booking.paymentAuthorizationFailureCode = pi.status;
      booking.paymentAuthorizationFailureMessage = 'Payment could not be authorized for this booking';
      booking.paymentAuthorizationLeaseUntil = null;
      await this.bookingRepo.save(booking);
      if (!options?.preserveBookingOnFailure) await this.onBookingCanceled(bookingId);
      throw new BadRequestException('Payment could not be authorized for this booking');
    } catch (err: unknown) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      const e = err as Stripe.errors.StripeError;
      if (e?.code === 'authentication_required') {
        booking.paymentAuthorizationStatus = 'requires_action';
        booking.paymentAuthorizationFailureCode = PAYMENT_REQUIRES_ACTION_CODE;
        booking.paymentAuthorizationFailureMessage = e.message ?? 'Authentication is required';
        booking.paymentAuthorizationLeaseUntil = null;
        await this.bookingRepo.save(booking);
        if (!options?.preserveBookingOnFailure) await this.onBookingCanceled(bookingId);
        throw new BadRequestException({
          message:
            'The customer’s card could not be charged without authentication. Ask them to add or update their payment method, then try accepting again.',
          code: PAYMENT_REQUIRES_ACTION_CODE,
        });
      }
      this.logger.warn(`authorizeHoldBeforeWelperAccept failed: ${e?.message ?? String(err)}`);
      booking.paymentAuthorizationStatus = 'failed';
      booking.paymentAuthorizationFailureCode = e?.code ?? 'authorization_failed';
      booking.paymentAuthorizationFailureMessage = e?.message ?? String(err);
      booking.paymentAuthorizationLeaseUntil = null;
      await this.bookingRepo.save(booking);
      if (!options?.preserveBookingOnFailure) await this.onBookingCanceled(bookingId);
      throw new BadRequestException(e?.message || 'Payment authorization failed');
    }
  }

  async processDeferredAuthorizations(limit = 50): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;
    const max = Math.min(Math.max(limit, 1), 100);

    for (let i = 0; i < max; i++) {
      const bookingId = await this.dataSource.transaction(async (manager) => {
        const repo = manager.getRepository(BookingRequest);
        const booking = await repo
          .createQueryBuilder('booking')
          .setLock('pessimistic_write')
          .setOnLocked('skip_locked')
          .where('booking.status = :status', { status: BookingRequestStatus.ACCEPTED })
          .andWhere('booking.payment_authorization_status = :authorizationStatus', {
            authorizationStatus: 'scheduled',
          })
          .andWhere('booking.payment_authorization_due_at <= :now', { now: new Date() })
          .andWhere(
            '(booking.payment_authorization_lease_until IS NULL OR booking.payment_authorization_lease_until < :now)',
            { now: new Date() },
          )
          .orderBy('booking.payment_authorization_due_at', 'ASC')
          .getOne();
        if (!booking) return null;
        booking.paymentAuthorizationLeaseUntil = new Date(Date.now() + 20 * 60 * 1000);
        await repo.save(booking);
        return booking.id;
      });

      if (!bookingId) break;
      processed += 1;
      try {
        await this.authorizeHoldBeforeWelperAccept(bookingId, {
          allowAccepted: true,
          preserveBookingOnFailure: true,
        });
      } catch (err) {
        failed += 1;
        const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
        if (booking) {
          await this.emitDeferredAuthorizationFailure(
            booking,
            err instanceof Error ? err.message : 'Payment authorization failed',
          );
        }
      }
    }
    return { processed, failed };
  }

  async cancelExpiredAuthorizationBookings(limit = 50): Promise<{ canceled: number }> {
    let canceled = 0;
    const max = Math.min(Math.max(limit, 1), 100);

    for (let i = 0; i < max; i++) {
      const booking = await this.dataSource.transaction(async (manager) => {
        const repo = manager.getRepository(BookingRequest);
        const row = await repo
          .createQueryBuilder('booking')
          .setLock('pessimistic_write')
          .setOnLocked('skip_locked')
          .where('booking.status = :status', { status: BookingRequestStatus.ACCEPTED })
          .andWhere('booking.payment_authorization_deadline_at <= :now', { now: new Date() })
          .andWhere(
            `(
              booking.payment_authorization_status IS NULL
              OR booking.payment_authorization_status != :authorized
              OR booking.payment_authorization_risk_code = :unsafeExpiry
            )`,
            { authorized: 'authorized', unsafeExpiry: 'expires_before_service_buffer' },
          )
          .orderBy('booking.payment_authorization_deadline_at', 'ASC')
          .getOne();
        if (!row) return null;
        row.status = BookingRequestStatus.CANCELLED;
        row.cancelledAt = new Date();
        row.cancelledBy = null;
        row.cancellationSource = 'payment_authorization_deadline';
        row.cancellationFeeCents = 0;
        row.cancellationReason = 'Payment authorization was not completed before the service deadline';
        row.paymentAuthorizationStatus = 'canceled';
        row.paymentAuthorizationLeaseUntil = null;
        return repo.save(row);
      });

      if (!booking) break;
      canceled += 1;
      await this.onBookingCanceled(booking.id, { chargeLateCancellationFee: false });
      await this.emitAuthorizationDeadlineCancellation(booking);
    }
    return { canceled };
  }

  private async emitDeferredAuthorizationFailure(booking: BookingRequest, message: string): Promise<void> {
    try {
      await this.notificationService.emitForUser(booking.customerId, {
        category: NotificationCategory.PAYMENT,
        paymentEmailType: 'payment_failed',
        paymentEmailVariables: { failureReason: message },
        metadata: {
          bookingId: booking.id,
          kind: 'deferred_authorization_failed',
          authorizationDeadlineAt: booking.paymentAuthorizationDeadlineAt?.toISOString() ?? null,
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to notify deferred authorization failure: ${(err as Error).message}`);
    }
  }

  private async emitAuthorizationDeadlineCancellation(booking: BookingRequest): Promise<void> {
    for (const userId of [booking.customerId, booking.welperId]) {
      try {
        const locale =
          (await this.notificationService.resolveLocaleForUser(userId)) === 'fr'
            ? 'fr'
            : 'en';
        const copy = getBookingNotificationCopy('booking_cancelled', locale, {});
        const body =
          locale === 'fr'
            ? "La réservation a été annulée car l'autorisation de paiement n'a pas été complétée avant la date limite."
            : 'The booking was cancelled because payment authorization was not completed before the deadline.';
        const smsType =
          userId === booking.welperId
            ? ('welper_booking_cancelled' as const)
            : ('customer_booking_cancelled' as const);
        await this.notificationService.send({
          userId,
          category: NotificationCategory.BOOKING,
          title: copy.title,
          body,
          bookingEmailType: 'booking_cancelled',
          bookingEmailVariables: {
            serviceName: 'Service',
            cancellationReason: body,
          },
          smsBody: getSmsBody(smsType, locale),
          metadata: {
            bookingId: booking.id,
            kind: 'authorization_deadline_cancelled',
          },
        });
      } catch (err) {
        this.logger.warn(`Failed to notify authorization cancellation for ${userId}: ${(err as Error).message}`);
      }
    }
  }

  async createBookingAuthorizationIntent(
    bookingId: string,
    userId: string,
    accountType: string,
  ): Promise<{
    clientSecret: string | null;
    paymentIntentId: string;
    requiresAction?: boolean;
    status: string;
  }> {
    const stripe = this.requireStripe();
    const role = accountType.toLowerCase();
    if (role !== 'customer') {
      throw new ForbiddenException('Only the customer can authorize payment for this booking');
    }
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.customerId !== userId) {
      throw new ForbiddenException('You are not the customer for this booking');
    }
    if (booking.status !== BookingRequestStatus.ACCEPTED) {
      throw new BadRequestException('Booking must be accepted before payment authorization');
    }
    if (
      booking.paymentAuthorizationDeadlineAt &&
      booking.paymentAuthorizationDeadlineAt.getTime() <= Date.now()
    ) {
      throw new BadRequestException('The payment authorization deadline has passed');
    }
    const amountCents = await this.authorizationHoldAmountCents(booking);
    if (amountCents <= 0) {
      throw new BadRequestException('This booking has no chargeable amount');
    }
    const holdQuote = await this.authorizationHoldQuote(booking);
    if (holdQuote.stripeTaxCalculationId) {
      booking.holdStripeTaxCalculationId = holdQuote.stripeTaxCalculationId;
      await this.bookingRepo.save(booking);
    }
    const user = await this.ensureStripeCustomer(userId);
    if (!user.stripeDefaultPaymentMethodId) {
      throw new BadRequestException({
        message: 'Add a default payment method in Settings first.',
        code: PAYMENT_METHOD_REQUIRED_CODE,
      });
    }
    let row = await this.findHoldPayment(bookingId);

    if (row && row.status !== BookingPaymentRecordStatus.CANCELED && row.status !== BookingPaymentRecordStatus.FAILED) {
      const existing = await stripe.paymentIntents.retrieve(row.stripePaymentIntentId, {
        expand: ['latest_charge'],
      });
      if (
        existing.status === 'requires_capture' ||
        existing.status === 'requires_confirmation' ||
        existing.status === 'requires_action'
      ) {
        if (existing.status === 'requires_capture') {
          row = await this.upsertBookingPaymentRow(booking, existing, row.amountCents);
          await this.rejectUnsafeAuthorization(booking, row);
          booking.paymentAuthorizationStatus = 'authorized';
          booking.paymentAuthorizationFailureCode = null;
          booking.paymentAuthorizationFailureMessage = null;
          await this.bookingRepo.save(booking);
        }
        return {
          clientSecret: existing.client_secret,
          paymentIntentId: existing.id,
          requiresAction: existing.status === 'requires_action',
          status: existing.status,
        };
      }
      if (existing.status === 'succeeded') {
        return {
          clientSecret: null,
          paymentIntentId: existing.id,
          status: existing.status,
        };
      }
    }

    if (row?.stripePaymentIntentId) {
      await this.tryCancelPaymentIntent(row.stripePaymentIntentId);
    }

    booking.paymentAuthorizationAttemptCount = (booking.paymentAuthorizationAttemptCount ?? 0) + 1;
    booking.paymentAuthorizationLastAttemptAt = new Date();
    await this.bookingRepo.save(booking);

    try {
      const pi = await stripe.paymentIntents.create(
        {
          amount: amountCents,
          currency: 'cad',
          customer: user.stripeCustomerId!,
          payment_method: user.stripeDefaultPaymentMethodId,
          capture_method: 'manual',
          confirm: true,
          off_session: true,
          metadata: {
            bookingId: booking.id,
            customerId: booking.customerId,
            welperId: booking.welperId,
          },
          expand: ['latest_charge'],
        },
        {
          idempotencyKey: BOOKING_PI_AUTH_IDEMPOTENCY_KEY(
            bookingId,
            booking.paymentAuthorizationAttemptCount,
          ),
        },
      );
      row = await this.upsertBookingPaymentRow(booking, pi, amountCents);
      if (pi.status === 'requires_capture') {
        await this.rejectUnsafeAuthorization(booking, row);
      }
      booking.paymentAuthorizationStatus =
        pi.status === 'requires_capture'
          ? 'authorized'
          : pi.status === 'requires_action' || pi.status === 'requires_confirmation'
            ? 'requires_action'
            : 'pending';
      booking.paymentAuthorizationFailureCode = null;
      booking.paymentAuthorizationFailureMessage = null;
      await this.bookingRepo.save(booking);
      return {
        clientSecret: pi.client_secret,
        paymentIntentId: pi.id,
        requiresAction: pi.status === 'requires_action',
        status: pi.status,
      };
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e.code === 'authentication_required') {
        const latestRow = await this.findHoldPayment(bookingId);
        if (latestRow?.stripePaymentIntentId) {
          await this.tryCancelPaymentIntent(latestRow.stripePaymentIntentId);
        }
        const pi = await stripe.paymentIntents.create(
          {
            amount: amountCents,
            currency: 'cad',
            customer: user.stripeCustomerId!,
            payment_method: user.stripeDefaultPaymentMethodId,
            capture_method: 'manual',
            metadata: {
              bookingId: booking.id,
              customerId: booking.customerId,
              welperId: booking.welperId,
            },
            expand: ['latest_charge'],
          },
          {
            idempotencyKey: BOOKING_PI_AUTH_SCA_IDEMPOTENCY_KEY(
              bookingId,
              booking.paymentAuthorizationAttemptCount,
            ),
          },
        );
        await this.upsertBookingPaymentRow(booking, pi, amountCents);
        booking.paymentAuthorizationStatus = 'requires_action';
        booking.paymentAuthorizationFailureCode = PAYMENT_REQUIRES_ACTION_CODE;
        booking.paymentAuthorizationFailureMessage = 'The customer must authenticate the saved card.';
        await this.bookingRepo.save(booking);
        return {
          clientSecret: pi.client_secret,
          paymentIntentId: pi.id,
          requiresAction: true,
          status: pi.status,
        };
      }
      this.logger.warn(`PaymentIntent create failed: ${e.message}`);
      throw new BadRequestException(e.message || 'Payment authorization failed');
    }
  }

  private async upsertBookingPaymentRow(
    booking: BookingRequest,
    paymentIntent: Stripe.PaymentIntent,
    amountCents: number,
  ): Promise<BookingPayment> {
    let row = await this.bookingPaymentRepo.findOne({
      where: { stripePaymentIntentId: paymentIntent.id },
    });
    const status = this.mapStripePiStatusToRecord(paymentIntent.status);
    if (!row) {
      row = this.bookingPaymentRepo.create({
        bookingId: booking.id,
        customerId: booking.customerId,
        welperId: booking.welperId,
        stripePaymentIntentId: paymentIntent.id,
        amountCents,
        currency: 'cad',
        status,
        paymentKind: BookingPaymentKind.HOLD,
      });
    } else {
      row.amountCents = amountCents;
      row.status = status;
      row.paymentKind = BookingPaymentKind.HOLD;
    }
    const metadata = await this.authorizationMetadata(this.requireStripe(), paymentIntent);
    row.stripeChargeId = metadata.chargeId;
    row.cardBrand = metadata.cardBrand;
    row.authorizationExpiresAt = metadata.expiresAt;
    booking.paymentAuthorizationExpiresAt = metadata.expiresAt;
    booking.paymentAuthorizationRiskCode = this.authorizationRiskCode(booking, metadata.expiresAt);
    await this.bookingRepo.save(booking);
    return this.bookingPaymentRepo.save(row);
  }

  private mapStripePiStatusToRecord(stripeStatus: string): BookingPaymentRecordStatus {
    switch (stripeStatus) {
      case 'requires_capture':
        return BookingPaymentRecordStatus.AUTHORIZED;
      case 'requires_action':
      case 'requires_confirmation':
        return BookingPaymentRecordStatus.REQUIRES_ACTION;
      case 'succeeded':
        return BookingPaymentRecordStatus.CAPTURED;
      case 'canceled':
        return BookingPaymentRecordStatus.CANCELED;
      case 'processing':
        return BookingPaymentRecordStatus.PENDING;
      default:
        return BookingPaymentRecordStatus.PENDING;
    }
  }

  private async tryCancelPaymentIntent(paymentIntentId: string): Promise<void> {
    if (!this.stripe) return;
    try {
      await this.stripe.paymentIntents.cancel(paymentIntentId);
    } catch (e) {
      this.logger.warn(`Could not cancel PI ${paymentIntentId}: ${(e as Error).message}`);
    }
  }

  async tryCompletePaymentReleasedForBooking(bookingId: string): Promise<void> {
    await this.syncCapturedPaymentStripeFees(bookingId);
    await this.stripeOperationsService.ensureTaxTransaction(bookingId);

    const released = await this.dataSource.transaction(async (manager) => {
      const bookingRepo = manager.getRepository(BookingRequest);
      const receiptRepo = manager.getRepository(BookingServiceReceipt);
      const paymentRepo = manager.getRepository(BookingPayment);

      const booking = await bookingRepo
        .createQueryBuilder('booking')
        .setLock('pessimistic_write')
        .where('booking.id = :bookingId', { bookingId })
        .getOne();
      if (
        !booking ||
        (booking.status !== BookingRequestStatus.COMPLETED && booking.status !== BookingRequestStatus.PAYMENT_RELEASED)
      ) {
        return null;
      }

      const receipt = await receiptRepo
        .createQueryBuilder('receipt')
        .setLock('pessimistic_read')
        .where('receipt.booking_id = :bookingId', { bookingId })
        .getOne();
      if (!receipt) {
        this.logger.warn(`Cannot release booking ${bookingId}: service receipt is missing`);
        return null;
      }

      const rows = await paymentRepo
        .createQueryBuilder('payment')
        .setLock('pessimistic_write')
        .where('payment.booking_id = :bookingId', { bookingId })
        .andWhere('payment.payment_kind IN (:...kinds)', {
          kinds: [BookingPaymentKind.HOLD, BookingPaymentKind.DELTA_RECEIPT],
        })
        .getMany();

      const unsettled = rows.some((row) =>
        [
          BookingPaymentRecordStatus.AUTHORIZED,
          BookingPaymentRecordStatus.PENDING,
          BookingPaymentRecordStatus.REQUIRES_ACTION,
          BookingPaymentRecordStatus.FAILED,
        ].includes(row.status),
      );
      if (unsettled) {
        return null;
      }

      const capturedRows = rows.filter(
        (row) => row.status === BookingPaymentRecordStatus.CAPTURED && row.capturedAt != null,
      );
      const capturedTotalCents = capturedRows.reduce(
        (sum, row) => sum + (row.capturedAmountCents ?? row.amountCents),
        0,
      );
      if (capturedTotalCents < receipt.totalCents) {
        this.logger.warn(
          `Cannot release booking ${bookingId}: captured ${capturedTotalCents} cents for a ${receipt.totalCents} cent receipt`,
        );
        return null;
      }

      const newlyReleased = booking.status === BookingRequestStatus.COMPLETED;
      if (newlyReleased) {
        validateTransition(booking.status, BookingRequestStatus.PAYMENT_RELEASED);
        booking.status = BookingRequestStatus.PAYMENT_RELEASED;
        booking.paymentReleasedAt = new Date();
        await bookingRepo.save(booking);
      } else if (!booking.paymentReleasedAt) {
        booking.paymentReleasedAt = new Date();
        await bookingRepo.save(booking);
      }

      const allFeesSynced =
        capturedRows.length > 0 &&
        capturedRows.every((row) => isStripeFeeSynced(row.stripeFeeCents, row.stripeBalanceTransactionId));
      const totalFeeCents = capturedRows.reduce((sum, row) => sum + (row.stripeFeeCents ?? 0), 0);
      await this.welperPayoutLedgerService.upsertLedgerForReleasedBooking(
        booking,
        receipt,
        { totalFeeCents, allSynced: allFeesSynced },
        manager,
      );

      return { booking, newlyReleased };
    });

    if (released?.newlyReleased) {
      await this.emitBookingPaymentReleased(released.booking);
    }
  }

  private async syncCapturedPaymentStripeFees(bookingId: string): Promise<void> {
    if (!this.stripe) return;
    const rows = await this.bookingPaymentRepo.find({
      where: { bookingId, status: BookingPaymentRecordStatus.CAPTURED },
    });
    for (const row of rows) {
      if (row.stripeFeeCents != null && row.stripeBalanceTransactionId) continue;
      try {
        const { feeCents, balanceTransactionId, synced } = await syncStripeFeeForPaymentIntent(
          this.stripe,
          row.stripePaymentIntentId,
        );
        if (synced) {
          row.stripeFeeCents = feeCents;
          row.stripeBalanceTransactionId = balanceTransactionId;
          await this.bookingPaymentRepo.save(row);
        }
      } catch (err) {
        this.logger.warn(
          `Fee sync on payment release failed for ${row.stripePaymentIntentId}: ${(err as Error).message}`,
        );
      }
    }
  }

  async syncPaymentIntentFromWebhook(pi: Stripe.PaymentIntent): Promise<void> {
    const row = await this.bookingPaymentRepo.findOne({
      where: { stripePaymentIntentId: pi.id },
    });
    if (!row) return;
    const previousStatus = row.status;
    row.status = this.mapStripePiStatusToRecord(pi.status);
    if (pi.last_payment_error && pi.status === 'requires_payment_method') {
      row.status = BookingPaymentRecordStatus.FAILED;
    }
    if (row.paymentKind === BookingPaymentKind.HOLD && this.stripe) {
      try {
        const metadata = await this.authorizationMetadata(this.stripe, pi);
        row.stripeChargeId = metadata.chargeId ?? row.stripeChargeId;
        row.cardBrand = metadata.cardBrand ?? row.cardBrand;
        row.authorizationExpiresAt = metadata.expiresAt ?? row.authorizationExpiresAt;
      } catch (err) {
        this.logger.warn(`Could not read authorization expiry for ${pi.id}: ${(err as Error).message}`);
      }
    }
    if (pi.status === 'succeeded') {
      row.capturedAt = new Date();
      if (row.capturedAmountCents == null && typeof pi.amount_received === 'number') {
        row.capturedAmountCents = pi.amount_received;
      }
      if (this.stripe && row.stripeFeeCents == null) {
        try {
          const { feeCents, balanceTransactionId, synced } = await syncStripeFeeForPaymentIntent(this.stripe, pi.id);
          if (synced) {
            row.stripeFeeCents = feeCents;
            row.stripeBalanceTransactionId = balanceTransactionId;
          }
        } catch {
          // non-fatal; ledger sync retries later
        }
      }
    }
    await this.bookingPaymentRepo.save(row);
    const latestHold =
      row.paymentKind === BookingPaymentKind.HOLD ? await this.findHoldPayment(row.bookingId) : null;
    const booking = await this.bookingRepo.findOne({ where: { id: row.bookingId } });
    let authorizationExpired = false;
    if (booking && (!latestHold || latestHold.stripePaymentIntentId === pi.id)) {
      if (pi.status === 'requires_capture') {
        booking.paymentAuthorizationStatus = 'authorized';
        booking.paymentAuthorizationFailureCode = null;
        booking.paymentAuthorizationFailureMessage = null;
        booking.paymentAuthorizationExpiresAt = row.authorizationExpiresAt;
        booking.paymentAuthorizationRiskCode = this.authorizationRiskCode(
          booking,
          row.authorizationExpiresAt,
        );
      } else if (pi.status === 'requires_action' || pi.status === 'requires_confirmation') {
        booking.paymentAuthorizationStatus = 'requires_action';
      } else if (pi.status === 'canceled') {
        const automaticallyExpired = pi.cancellation_reason === 'automatic';
        authorizationExpired = automaticallyExpired;
        booking.paymentAuthorizationStatus = 'canceled';
        booking.paymentAuthorizationFailureCode = automaticallyExpired
          ? 'authorization_expired'
          : (pi.cancellation_reason ?? 'payment_intent_canceled');
        booking.paymentAuthorizationFailureMessage = automaticallyExpired
          ? 'The card authorization expired before capture.'
          : 'The card authorization was canceled in Stripe.';
        if (
          automaticallyExpired &&
          booking.status === BookingRequestStatus.ACCEPTED &&
          booking.paymentAuthorizationDeadlineAt &&
          booking.paymentAuthorizationDeadlineAt.getTime() > Date.now() &&
          booking.paymentAuthorizationAttemptCount < this.maxAutomaticAuthorizationAttempts
        ) {
          booking.paymentAuthorizationStatus = 'scheduled';
          booking.paymentAuthorizationDueAt = new Date();
        }
      } else if (pi.status === 'requires_payment_method') {
        booking.paymentAuthorizationStatus = 'failed';
        booking.paymentAuthorizationFailureCode = pi.last_payment_error?.code ?? 'requires_payment_method';
        booking.paymentAuthorizationFailureMessage = pi.last_payment_error?.message ?? null;
      }
      booking.paymentAuthorizationLeaseUntil = null;
      await this.bookingRepo.save(booking);
    }
    if (booking && authorizationExpired) {
      await this.emitDeferredAuthorizationFailure(
        booking,
        'The saved card authorization expired. Reauthorize the booking before the payment deadline.',
      );
    }
    if (pi.status === 'succeeded' && row.status === BookingPaymentRecordStatus.CAPTURED) {
      // NOTIFICATIONS-001 (Day 16 dispatch 2): emit only on the AUTHORIZED →
      // CAPTURED transition, not on every retry of `succeeded`. The dedup
      // window (5 min, scoped to bookingId) belt-and-suspenders this against
      // the in-process capture path also having emitted moments earlier.
      if (previousStatus !== BookingPaymentRecordStatus.CAPTURED) {
        await this.emitPaymentCaptured(row);
      }
      await this.tryCompletePaymentReleasedForBooking(row.bookingId);
    }
  }

  /**
   * NOTIFICATIONS-001 (Day 16 dispatch 2): emit "Payment received"
   * notifications to BOTH the customer (charged) and the welper (payout
   * queued). Per-recipient body shapes the message for the role.
   *
   * The `metadata.bookingId` dedup window (5 min) makes this safe to call
   * from BOTH the in-process capture flow and the asynchronous webhook —
   * whichever lands first emits, the second is a no-op. Bible §22 voice:
   * concrete amount + booking link, no jargon.
   */
  private async emitBookingPaymentReleased(booking: BookingRequest): Promise<void> {
    for (const userId of [booking.customerId, booking.welperId]) {
      try {
        const locale = await this.notificationService.resolveLocaleForUser(userId);
        const actionUrl = buildBookingActionUrl(getFrontendBaseUrl(), booking.id, locale);
        const variables = { serviceName: 'Service', bookingUrl: actionUrl };
        const copy = getBookingNotificationCopy('booking_payment_released', locale, variables);
        await this.notificationService.send({
          userId,
          category: NotificationCategory.BOOKING,
          title: copy.title,
          body: copy.body,
          metadata: {
            bookingId: booking.id,
            actionUrl,
            kind: 'booking_payment_released',
          },
          bookingEmailType: 'booking_payment_released',
          bookingEmailVariables: variables,
        });
      } catch (err) {
        this.logger.warn(`Failed to emit payment_released notification for ${userId}: ${(err as Error).message}`);
      }
    }
  }

  private async emitPaymentCaptured(row: BookingPayment): Promise<void> {
    const amountCents = row.capturedAmountCents ?? row.amountCents;
    const amount = (amountCents / 100).toFixed(2);
    const currency = (row.currency ?? 'cad').toUpperCase();
    try {
      await this.notificationService.emitForUser(row.customerId, {
        category: NotificationCategory.PAYMENT,
        paymentEmailType: 'payment_captured_customer',
        paymentEmailVariables: { amount, currency },
        metadata: {
          bookingId: row.bookingId,
          paymentIntentId: row.stripePaymentIntentId,
          kind: 'captured-customer',
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to emit captured notification (customer): ${(err as Error).message}`);
    }
    try {
      const welperLocale =
        (await this.notificationService.resolveLocaleForUser(row.welperId)) === 'fr'
          ? 'fr'
          : 'en';
      await this.notificationService.emitForUser(row.welperId, {
        category: NotificationCategory.PAYMENT,
        paymentEmailType: 'payment_captured_welper',
        paymentEmailVariables: { amount, currency },
        smsBody: getSmsBody('welper_payment_processing', welperLocale),
        metadata: {
          bookingId: row.bookingId,
          paymentIntentId: row.stripePaymentIntentId,
          kind: 'captured-welper',
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to emit captured notification (welper): ${(err as Error).message}`);
    }
  }

  private async emitPaymentFailed(row: BookingPayment, message: string | null): Promise<void> {
    try {
      await this.notificationService.emitForUser(row.customerId, {
        category: NotificationCategory.PAYMENT,
        paymentEmailType: 'payment_failed',
        paymentEmailVariables: { failureReason: message?.trim() || undefined },
        metadata: {
          bookingId: row.bookingId,
          paymentIntentId: row.stripePaymentIntentId,
          kind: 'failed',
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to emit payment-failed notification: ${(err as Error).message}`);
    }
  }

  private async emitRefundIssued(row: BookingPayment, refundedAmountCents: number): Promise<void> {
    const amount = (refundedAmountCents / 100).toFixed(2);
    const currency = (row.currency ?? 'cad').toUpperCase();
    try {
      await this.notificationService.emitForUser(row.customerId, {
        category: NotificationCategory.PAYMENT,
        paymentEmailType: 'payment_refund',
        paymentEmailVariables: { amount, currency },
        metadata: {
          bookingId: row.bookingId,
          paymentIntentId: row.stripePaymentIntentId,
          kind: 'refund',
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to emit refund notification: ${(err as Error).message}`);
    }
  }

  async onBookingServiceCompleted(booking: BookingRequest): Promise<void> {
    const row = await this.findHoldPayment(booking.id);
    if (!row || row.status !== BookingPaymentRecordStatus.AUTHORIZED) {
      this.logger.debug(`No authorized payment row for booking ${booking.id}, skip capture schedule`);
      return;
    }
    const delayMin = await this.applicationSettings.getPaymentCaptureDelayMinutes();
    const completedAt = booking.completedAt ?? new Date();
    row.captureEligibleAt = new Date(completedAt.getTime() + delayMin * 60 * 1000);
    await this.bookingPaymentRepo.save(row);
  }

  async onBookingCanceled(bookingId: string, options?: { chargeLateCancellationFee?: boolean }): Promise<void> {
    const stripe = this.stripe;
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
    });
    const rows = await this.bookingPaymentRepo.find({
      where: { bookingId },
      order: { createdAt: 'DESC' },
    });
    const chargeLateFee =
      options?.chargeLateCancellationFee === true &&
      booking?.cancellationSource === 'customer';
    let lateFeeCaptured = false;

    if (booking) {
      booking.paymentAuthorizationStatus = 'canceled';
      booking.paymentAuthorizationLeaseUntil = null;
      await this.bookingRepo.save(booking);
    }

    for (const row of rows) {
      if (row.capturedAt) {
        continue;
      }
      if (row.status === BookingPaymentRecordStatus.CANCELED || row.status === BookingPaymentRecordStatus.FAILED) {
        continue;
      }

      const isAuthorizedHold =
        row.paymentKind === BookingPaymentKind.HOLD &&
        row.status === BookingPaymentRecordStatus.AUTHORIZED &&
        !!row.stripePaymentIntentId;

      if (chargeLateFee && !lateFeeCaptured && isAuthorizedHold && stripe && booking) {
        const feeCents = await this.authorizationHoldAmountCents(booking);
        const captureCents = Math.min(feeCents, row.amountCents);
        if (captureCents > 0) {
          try {
            const current = await stripe.paymentIntents.retrieve(row.stripePaymentIntentId);
            if (current.status !== 'requires_capture') {
              throw new Error(`PaymentIntent is ${current.status}, not capturable`);
            }
            if (
              row.authorizationExpiresAt &&
              row.authorizationExpiresAt.getTime() <= Date.now()
            ) {
              throw new Error('Card authorization has expired');
            }
            await stripe.paymentIntents.capture(row.stripePaymentIntentId, {
              amount_to_capture: captureCents,
            });
            row.status = BookingPaymentRecordStatus.CAPTURED;
            row.capturedAt = new Date();
            row.capturedAmountCents = captureCents;
            row.captureReason = BookingPaymentCaptureReason.LATE_CANCELLATION;
            await this.bookingPaymentRepo.save(row);
            booking.cancellationFeeCents = captureCents;
            await this.bookingRepo.save(booking);
            lateFeeCaptured = true;
            this.logger.log(`Late cancellation fee captured ${captureCents} cents for booking ${bookingId}`);
            continue;
          } catch (e) {
            this.logger.warn(`Late cancellation capture failed for booking ${bookingId}: ${(e as Error).message}`);
          }
        }
      }

      if (stripe && row.stripePaymentIntentId) {
        try {
          await stripe.paymentIntents.cancel(row.stripePaymentIntentId);
        } catch (e) {
          this.logger.warn(`Could not cancel PI ${row.stripePaymentIntentId}: ${(e as Error).message}`);
        }
      }
      row.status = BookingPaymentRecordStatus.CANCELED;
      await this.bookingPaymentRepo.save(row);
    }
  }

  /**
   * Capture the authorized hold up to receipt total (partial allowed), then charge any remainder
   * as a separate PaymentIntent (off-session; may require customer SCA via returned clientSecret).
   */
  async captureForServiceReceipt(params: {
    bookingId: string;
    customerId: string;
    welperId: string;
    receiptTotalCents: number;
    receiptId: string;
  }): Promise<{
    primaryCapturedCents: number;
    deltaPayment?: {
      clientSecret: string | null;
      paymentIntentId: string;
      requiresAction: boolean;
    };
  }> {
    const stripe = this.requireStripe();
    const { bookingId, receiptTotalCents, receiptId, customerId, welperId } = params;

    const hold = await this.findHoldPayment(bookingId);

    if (receiptTotalCents <= 0) {
      if (hold?.status === BookingPaymentRecordStatus.AUTHORIZED && hold.stripePaymentIntentId) {
        await this.tryCancelPaymentIntent(hold.stripePaymentIntentId);
        hold.status = BookingPaymentRecordStatus.CANCELED;
        await this.bookingPaymentRepo.save(hold);
      }
      return { primaryCapturedCents: 0 };
    }

    if (!hold || hold.status !== BookingPaymentRecordStatus.AUTHORIZED) {
      throw new BadRequestException('No authorized payment hold for this booking');
    }

    const authorizedCents = hold.amountCents;
    const captureFromHoldCents = Math.min(receiptTotalCents, authorizedCents);
    const deltaCents = receiptTotalCents - captureFromHoldCents;
    let preparedDeltaPi: Stripe.PaymentIntent | null = null;
    let deltaRow: BookingPayment | null = null;

    if (deltaCents > 0) {
      const user = await this.ensureStripeCustomer(customerId);
      const defaultPaymentMethodId = user.stripeDefaultPaymentMethodId;
      if (!defaultPaymentMethodId) {
        throw new BadRequestException({
          message:
            'The receipt total exceeds the authorized hold; the customer must add a default payment method to pay the balance.',
          code: PAYMENT_METHOD_REQUIRED_CODE,
        });
      }

      preparedDeltaPi = await stripe.paymentIntents.create(
        {
          amount: deltaCents,
          currency: 'cad',
          customer: user.stripeCustomerId!,
          payment_method: defaultPaymentMethodId,
          metadata: {
            bookingId,
            customerId,
            welperId,
            receiptId,
            welpcoPaymentKind: BookingPaymentKind.DELTA_RECEIPT,
          },
        },
        { idempotencyKey: BOOKING_PI_RECEIPT_DELTA_KEY(bookingId, receiptId) },
      );

      deltaRow = this.bookingPaymentRepo.create({
        bookingId,
        customerId,
        welperId,
        stripePaymentIntentId: preparedDeltaPi.id,
        amountCents: deltaCents,
        currency: 'cad',
        status: this.mapStripePiStatusToRecord(preparedDeltaPi.status),
        paymentKind: BookingPaymentKind.DELTA_RECEIPT,
        captureEligibleAt: null,
      });
      deltaRow = await this.bookingPaymentRepo.save(deltaRow);
    }

    try {
      await stripe.paymentIntents.capture(hold.stripePaymentIntentId, {
        amount_to_capture: captureFromHoldCents,
      });
    } catch (err) {
      if (preparedDeltaPi && deltaRow) {
        await this.tryCancelPaymentIntent(preparedDeltaPi.id);
        deltaRow.status = BookingPaymentRecordStatus.CANCELED;
        await this.bookingPaymentRepo.save(deltaRow);
      }
      throw err;
    }

    // Re-read the PaymentIntent after capture so DB reflects Stripe truth even
    // if Stripe adjusted the final amounts/status.
    const capturedPi = await stripe.paymentIntents.retrieve(hold.stripePaymentIntentId);

    hold.status = BookingPaymentRecordStatus.CAPTURED;
    hold.capturedAt = new Date();
    hold.captureReason = BookingPaymentCaptureReason.SERVICE_RECEIPT;
    hold.capturedAmountCents =
      typeof capturedPi.amount_received === 'number' && capturedPi.amount_received > 0
        ? capturedPi.amount_received
        : captureFromHoldCents;
    hold.captureEligibleAt = null;
    await this.bookingPaymentRepo.save(hold);

    // NOTIFICATIONS-001: emit on the in-process capture path (the webhook
    // sync may not run in dev / when Stripe webhooks aren't configured). The
    // dedup window keeps this safe against the webhook also emitting.
    await this.emitPaymentCaptured(hold);

    if (deltaCents <= 0) {
      await this.tryCompletePaymentReleasedForBooking(bookingId);
      return { primaryCapturedCents: captureFromHoldCents };
    }

    try {
      if (!preparedDeltaPi || !deltaRow) {
        throw new BadRequestException('Additional charge was not initialized');
      }
      const pi = await stripe.paymentIntents.confirm(preparedDeltaPi.id, {
        off_session: true,
      } as Stripe.PaymentIntentConfirmParams);

      deltaRow.status = this.mapStripePiStatusToRecord(pi.status);
      deltaRow.capturedAmountCents = pi.status === 'succeeded' ? deltaCents : null;
      deltaRow.capturedAt = pi.status === 'succeeded' ? new Date() : null;
      await this.bookingPaymentRepo.save(deltaRow);

      if (pi.status === 'requires_action') {
        return {
          primaryCapturedCents: captureFromHoldCents,
          deltaPayment: {
            clientSecret: pi.client_secret,
            paymentIntentId: pi.id,
            requiresAction: true,
          },
        };
      }
      if (pi.status !== 'succeeded') {
        this.logger.warn(`Delta PI unexpected status ${pi.status} booking=${bookingId}`);
        return { primaryCapturedCents: captureFromHoldCents };
      }
      await this.emitPaymentCaptured(deltaRow);
      await this.tryCompletePaymentReleasedForBooking(bookingId);
      return { primaryCapturedCents: captureFromHoldCents };
    } catch (err: unknown) {
      const e = err as Stripe.errors.StripeError;
      if (e?.code === 'authentication_required') {
        if (preparedDeltaPi) {
          await this.tryCancelPaymentIntent(preparedDeltaPi.id);
        }
        const user = await this.ensureStripeCustomer(customerId);
        const defaultPaymentMethodId = user.stripeDefaultPaymentMethodId;
        if (!defaultPaymentMethodId) {
          throw new BadRequestException({
            message:
              'The receipt total exceeds the authorized hold; the customer must add a default payment method to pay the balance.',
            code: PAYMENT_METHOD_REQUIRED_CODE,
          });
        }
        const pi = await stripe.paymentIntents.create(
          {
            amount: deltaCents,
            currency: 'cad',
            customer: user.stripeCustomerId!,
            payment_method: defaultPaymentMethodId,
            metadata: {
              bookingId,
              customerId,
              welperId,
              receiptId,
              welpcoPaymentKind: BookingPaymentKind.DELTA_RECEIPT,
            },
          },
          {
            idempotencyKey: BOOKING_PI_RECEIPT_DELTA_SCA_KEY(bookingId, receiptId),
          },
        );
        if (deltaRow) {
          deltaRow.stripePaymentIntentId = pi.id;
          deltaRow.status = this.mapStripePiStatusToRecord(pi.status);
          deltaRow.capturedAmountCents = null;
          deltaRow.capturedAt = null;
          await this.bookingPaymentRepo.save(deltaRow);
        }
        return {
          primaryCapturedCents: captureFromHoldCents,
          deltaPayment: {
            clientSecret: pi.client_secret,
            paymentIntentId: pi.id,
            requiresAction: true,
          },
        };
      }
      if (err instanceof BadRequestException) {
        throw err;
      }
      if (deltaRow) {
        deltaRow.status = BookingPaymentRecordStatus.FAILED;
        await this.bookingPaymentRepo.save(deltaRow);
        await this.emitPaymentFailed(deltaRow, e?.message ?? 'Additional charge failed');
      }
      this.logger.warn(
        `Additional receipt charge failed after hold capture for booking ${bookingId}: ${e?.message ?? String(err)}`,
      );
      return { primaryCapturedCents: captureFromHoldCents };
    }
  }

  async processDueCaptures(): Promise<void> {
    const stripe = this.stripe;
    if (!stripe) return;
    const now = new Date();

    for (let i = 0; i < 50; i++) {
      const outcome = await this.dataSource.transaction(async (manager) => {
        const paymentRepo = manager.getRepository(BookingPayment);
        const row = await paymentRepo
          .createQueryBuilder('bp')
          .setLock('pessimistic_write')
          .where('bp.captured_at IS NULL')
          .andWhere('bp.capture_eligible_at IS NOT NULL')
          .andWhere('bp.capture_eligible_at <= :now', { now })
          .andWhere('bp.status = :st', {
            st: BookingPaymentRecordStatus.AUTHORIZED,
          })
          .andWhere('bp.payment_kind = :pk', { pk: BookingPaymentKind.HOLD })
          .orderBy('bp.capture_eligible_at', 'ASC')
          .getOne();
        if (!row) return 'none' as const;

        const bookingRepo = manager.getRepository(BookingRequest);
        const booking = await bookingRepo.findOne({
          where: { id: row.bookingId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!booking || booking.status !== BookingRequestStatus.COMPLETED) {
          return 'skip' as const;
        }

        try {
          await stripe.paymentIntents.capture(row.stripePaymentIntentId);
        } catch (e) {
          this.logger.warn(`Capture failed for ${row.stripePaymentIntentId}: ${(e as Error).message}`);
          return 'skip' as const;
        }

        row.capturedAt = new Date();
        row.status = BookingPaymentRecordStatus.CAPTURED;
        row.capturedAmountCents = row.amountCents;
        row.captureReason = BookingPaymentCaptureReason.SERVICE_RECEIPT;
        await paymentRepo.save(row);

        return {
          type: 'captured' as const,
          bookingId: booking.id,
          paymentRow: row,
        };
      });

      if (outcome === 'none') break;
      if (outcome && typeof outcome === 'object' && outcome.type === 'captured') {
        // NOTIFICATIONS-001: scheduled-capture path also emits. Same dedup
        // window keeps this safe against the webhook follow-up.
        await this.emitPaymentCaptured(outcome.paymentRow);
        await this.tryCompletePaymentReleasedForBooking(outcome.bookingId);
      }
    }
  }

  /**
   * Periodically reconcile Stripe PaymentIntent status → local booking_payments.
   * This self-heals when webhooks are missing/delayed or the process crashes
   * after Stripe changes state but before DB is updated.
   */
  async reconcileStalePaymentRows(params?: {
    /** Only reconcile rows not updated in the last N minutes */
    olderThanMinutes?: number;
    /** Upper bound on rows to reconcile per run */
    limit?: number;
  }): Promise<{ scanned: number; updated: number }> {
    if (!this.stripe) return { scanned: 0, updated: 0 };
    const stripe = this.stripe;
    const olderThanMinutes = Math.max(1, params?.olderThanMinutes ?? 10);
    const limit = Math.min(Math.max(params?.limit ?? 50, 1), 200);

    const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);

    const rows = await this.bookingPaymentRepo
      .createQueryBuilder('bp')
      .where('bp.updated_at <= :cutoff', { cutoff })
      .andWhere('bp.status IN (:...st)', {
        st: [
          BookingPaymentRecordStatus.PENDING,
          BookingPaymentRecordStatus.REQUIRES_ACTION,
          BookingPaymentRecordStatus.AUTHORIZED,
        ],
      })
      .orderBy('bp.updated_at', 'ASC')
      .take(limit)
      .getMany();

    let updated = 0;
    for (const row of rows) {
      try {
        const pi = await stripe.paymentIntents.retrieve(row.stripePaymentIntentId);
        const before = row.status;
        await this.syncPaymentIntentFromWebhook(pi);
        // If the PI status mapped to the same record status, count as scanned only.
        const afterRow = await this.bookingPaymentRepo.findOne({
          where: { stripePaymentIntentId: row.stripePaymentIntentId },
        });
        if (afterRow && afterRow.status !== before) {
          updated += 1;
        }
      } catch (e) {
        this.logger.warn(`reconcileStalePaymentRows: PI ${row.stripePaymentIntentId} failed: ${(e as Error).message}`);
      }
    }
    return { scanned: rows.length, updated };
  }

  /** Sum of captured payment rows for admin refund guidance (disputes). */
  async getTotalCapturedForBooking(bookingId: string): Promise<{ totalCents: number; currency: string } | null> {
    const rows = await this.bookingPaymentRepo.find({
      where: { bookingId },
      order: { createdAt: 'ASC' },
    });
    const captured = rows.filter((r) => r.capturedAt);
    if (captured.length === 0) return null;
    // After partial capture, `amountCents` stays the original authorization; use captured amount when set.
    const totalCents = captured.reduce(
      (sum, r) => sum + (r.capturedAmountCents != null ? r.capturedAmountCents : r.amountCents),
      0,
    );
    const currency = captured[captured.length - 1]?.currency ?? 'cad';
    return { totalCents, currency };
  }

  async getRefundDecisionSnapshot(
    bookingId: string,
    requestedTargetCents?: number,
  ): Promise<RefundDecisionSnapshot> {
    return this.stripeOperationsService.getRefundDecisionSnapshot(bookingId, requestedTargetCents);
  }

  async reconcileExternalRefunds(bookingId: string): Promise<void> {
    await this.stripeOperationsService.reconcileBookingRefunds(bookingId);
  }

  async retryPendingTaxTransactions(): Promise<{
    scanned: number;
    recovered: number;
    reversalScanned: number;
    reversalRecovered: number;
  }> {
    return this.stripeOperationsService.retryPendingTaxTransactions();
  }

  async getRecoveryTaskForResolution(resolutionId: string): Promise<PaymentRecoveryTaskSummary | null> {
    return this.stripeOperationsService.getRecoveryTaskForResolution(resolutionId);
  }

  /** Update local refund tracking from Stripe charge webhooks. */
  async syncBookingPaymentFromStripeCharge(charge: Stripe.Charge): Promise<void> {
    const piRef = charge.payment_intent;
    const piId = typeof piRef === 'string' ? piRef : piRef?.id;
    if (!piId) return;

    const row = await this.bookingPaymentRepo.findOne({
      where: { stripePaymentIntentId: piId },
    });
    if (!row) return;

    const previouslyRefunded = row.refundedAmountCents ?? 0;
    row.refundedAmountCents = charge.amount_refunded;
    if (charge.amount > 0 && charge.amount_refunded >= charge.amount) {
      row.fullyRefundedAt = new Date();
    }
    await this.bookingPaymentRepo.save(row);

    // NOTIFICATIONS-001: emit a refund notification on the DELTA (so a charge
    // that goes from 5000c refunded → 5000c again doesn't double-emit, but a
    // 0 → 5000 transition does). Only when there's actually money on the way.
    const delta = charge.amount_refunded - previouslyRefunded;
    if (delta > 0) {
      await this.emitRefundIssued(row, delta);
      await this.welperPayoutLedgerService.applyRefundDelta(row.bookingId, delta);
    }
  }

  async processWebhookEvent(event: Stripe.Event): Promise<void> {
    // Idempotency: Stripe may retry and/or deliver the same event concurrently.
    // We "claim" the event by inserting its ID first. If processing fails, we
    // delete the claim so a retry can run again.
    try {
      await this.webhookEventRepo.insert({
        eventId: event.id,
        eventType: event.type,
      });
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? '';
      // Postgres duplicate key, or any unique constraint violation on event_id.
      if (msg.includes('duplicate key') || msg.includes('already exists') || msg.includes('unique')) {
        this.logger.log(`Skipping already-processed webhook event ${event.id} (${event.type})`);
        return;
      }
      throw e;
    }

    try {
      switch (event.type) {
        case 'payment_method.detached': {
          const pm = event.data.object as Stripe.PaymentMethod;
          if (!pm.id) break;

          const previousCustomer = (
            event.data.previous_attributes as Partial<Stripe.PaymentMethod> | undefined
          )?.customer;
          const customerId =
            typeof pm.customer === 'string'
              ? pm.customer
              : pm.customer?.id ??
                (typeof previousCustomer === 'string'
                  ? previousCustomer
                  : previousCustomer?.id);
          let user = customerId
            ? await this.userRepo.findOne({ where: { stripeCustomerId: customerId } })
            : null;
          if (!user) {
            user = await this.userRepo.findOne({
              where: { stripeDefaultPaymentMethodId: pm.id },
            });
          }
          if (!user) break;

          if (user.stripeDefaultPaymentMethodId === pm.id) {
            await this.promoteDefaultPaymentMethodAfterDetach(user, pm.id);
          }
          break;
        }
        case 'setup_intent.succeeded': {
          const si = event.data.object as Stripe.SetupIntent;
          if (si.id) await this.applySetupIntentSuccess(si.id);
          break;
        }
        case 'payment_intent.succeeded':
        case 'payment_intent.amount_capturable_updated':
        case 'payment_intent.canceled': {
          const pi = event.data.object as Stripe.PaymentIntent;
          await this.syncPaymentIntentFromWebhook(pi);
          break;
        }
        case 'payment_intent.payment_failed': {
          const pi = event.data.object as Stripe.PaymentIntent;
          await this.syncPaymentIntentFromWebhook(pi);
          const row = await this.bookingPaymentRepo.findOne({
            where: { stripePaymentIntentId: pi.id },
          });
          if (row) {
            row.status = BookingPaymentRecordStatus.FAILED;
            await this.bookingPaymentRepo.save(row);
            // NOTIFICATIONS-001: surface the failure to the customer so they
            // can fix the card before the welper accepts (auth phase) or the
            // capture is retried.
            await this.emitPaymentFailed(row, pi.last_payment_error?.message ?? null);
          }
          break;
        }
        case 'charge.refunded': {
          const charge = event.data.object as Stripe.Charge;
          await this.syncBookingPaymentFromStripeCharge(charge);
          await this.stripeOperationsService.syncChargeRefunds(charge);
          break;
        }
        case 'refund.created':
        case 'refund.updated':
        case 'refund.failed': {
          await this.stripeOperationsService.syncRefund(event.data.object as Stripe.Refund);
          break;
        }
        default:
          break;
      }
    } catch (err) {
      // Allow Stripe retries if our handler fails.
      try {
        await this.webhookEventRepo.delete({ eventId: event.id });
      } catch (cleanupErr) {
        this.logger.warn(`Failed to release webhook claim for ${event.id}: ${(cleanupErr as Error).message}`);
      }
      throw err;
    }
  }

  async getBookingPaymentSummary(bookingId: string): Promise<{
    phase: 'none' | 'scheduled' | 'pending' | 'requires_action' | 'authorized' | 'captured' | 'canceled' | 'failed';
    captureEligibleAt: string | null;
    capturedAt: string | null;
  } | null> {
    const rows = await this.bookingPaymentRepo.find({
      where: { bookingId },
      order: { createdAt: 'ASC' },
    });
    const relevant = rows.filter(
      (r) => r.paymentKind === BookingPaymentKind.HOLD || r.paymentKind === BookingPaymentKind.DELTA_RECEIPT,
    );
    if (relevant.length === 0) {
      const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
      if (booking?.paymentAuthorizationStatus === 'scheduled') {
        return { phase: 'scheduled', captureEligibleAt: null, capturedAt: null };
      }
      return { phase: 'none', captureEligibleAt: null, capturedAt: null };
    }
    const nonCanceled = relevant.filter((r) => r.status !== BookingPaymentRecordStatus.CANCELED);
    type Phase =
      | 'none'
      | 'scheduled'
      | 'pending'
      | 'requires_action'
      | 'authorized'
      | 'captured'
      | 'canceled'
      | 'failed';
    const pickPhase = (): Phase => {
      if (nonCanceled.some((r) => r.status === BookingPaymentRecordStatus.FAILED)) {
        return 'failed';
      }
      const active = nonCanceled.filter((r) => r.status !== BookingPaymentRecordStatus.FAILED);
      if (active.some((r) => r.status === BookingPaymentRecordStatus.REQUIRES_ACTION)) {
        return 'requires_action';
      }
      if (active.some((r) => r.status === BookingPaymentRecordStatus.AUTHORIZED)) {
        return 'authorized';
      }
      if (active.some((r) => r.status === BookingPaymentRecordStatus.PENDING)) {
        return 'pending';
      }
      if (active.length > 0 && active.every((r) => r.status === BookingPaymentRecordStatus.CAPTURED)) {
        return 'captured';
      }
      return 'canceled';
    };
    const phase: Phase = pickPhase();
    const hold = relevant.find((r) => r.paymentKind === BookingPaymentKind.HOLD);
    const latestCapture = [...relevant].filter((r) => r.capturedAt).sort((a, b) => +b.capturedAt! - +a.capturedAt!)[0];
    return {
      phase,
      captureEligibleAt: hold?.captureEligibleAt?.toISOString() ?? null,
      capturedAt: latestCapture?.capturedAt?.toISOString() ?? null,
    };
  }
}
