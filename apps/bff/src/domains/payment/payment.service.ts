import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { createStripeClient } from './stripe-client';
import { BookingRequest, BookingRequestStatus } from '../booking/entities/booking-request.entity';
import { validateTransition } from '../booking/booking-state-machine';
import { UserAccount } from '../user-management/entities/user-account.entity';
import { CustomerProfileService } from '../profile-management/customer-profile/customer-profile.service';
import { ApplicationSettingsService } from './application-settings.service';
import {
  BookingPayment,
  BookingPaymentKind,
  BookingPaymentRecordStatus,
} from './entities/booking-payment.entity';
import { ProcessedWebhookEvent } from './entities/processed-webhook-event.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationCategory } from '../notification/entities';

export const PAYMENT_METHOD_REQUIRED_CODE = 'PAYMENT_METHOD_REQUIRED';
/** Saved card cannot be charged off-session (e.g. SCA). Welper cannot complete accept until customer fixes card or pays another way. */
export const PAYMENT_REQUIRES_ACTION_CODE = 'payment_requires_action';

const BOOKING_PI_AUTH_IDEMPOTENCY_KEY = (bookingId: string) => `booking-${bookingId}-authorize-v1`;
const BOOKING_PI_AUTH_SCA_IDEMPOTENCY_KEY = (bookingId: string) => `booking-${bookingId}-authorize-sca-v1`;
const BOOKING_PI_RECEIPT_DELTA_KEY = (bookingId: string, receiptId: string) =>
  `booking-${bookingId}-receipt-delta-${receiptId}`;
const BOOKING_PI_RECEIPT_DELTA_SCA_KEY = (bookingId: string, receiptId: string) =>
  `booking-${bookingId}-receipt-delta-sca-${receiptId}`;

/** Outcome of {@link PaymentService.refundCapturedAmount} (dispute resolutions). */
export type RefundCapturedResult =
  | { ok: true; refundsCreated: number; skipped?: boolean; detail?: string }
  | {
      ok: false;
      refundsCreated: number;
      message: string;
      /** Some refund API calls succeeded before a later one failed */
      partialFailure?: boolean;
    };

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly stripe: Stripe | null;

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
    private readonly customerProfileService: CustomerProfileService,
    private readonly notificationService: NotificationService,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    this.stripe = key ? createStripeClient(key) : null;
  }

  private requireStripe(): Stripe {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    return this.stripe;
  }

  private async findHoldPayment(bookingId: string): Promise<BookingPayment | null> {
    return this.bookingPaymentRepo.findOne({
      where: { bookingId, paymentKind: BookingPaymentKind.HOLD },
      order: { createdAt: 'DESC' },
    });
  }

  /** Authorized hold amount in cents, if the primary hold is still in requires_capture state */
  async getAuthorizedHoldCents(bookingId: string): Promise<number | null> {
    const hold = await this.findHoldPayment(bookingId);
    if (!hold || hold.status !== BookingPaymentRecordStatus.AUTHORIZED) {
      return null;
    }
    return hold.amountCents;
  }

  /** Customer completes SCA for a receipt balance charge (delta PaymentIntent). */
  async getClientSecretForReceiptDeltaIfRequired(
    bookingId: string,
    customerId: string,
  ): Promise<string | null> {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
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
    const user = await this.userRepo.findOne({ where: { stripeCustomerId: customerId } });
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

  async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    const stripe = this.requireStripe();
    const user = await this.ensureStripeCustomer(userId);
    try {
      await stripe.paymentMethods.attach(paymentMethodId, { customer: user.stripeCustomerId! });
    } catch (e) {
      const err = e as Stripe.errors.StripeError;
      if (err.type === 'StripeInvalidRequestError' && err.message) {
        throw new BadRequestException(err.message);
      }
      throw e;
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
    if (user.stripeDefaultPaymentMethodId === paymentMethodId) {
      user.stripeDefaultPaymentMethodId = null;
      await this.userRepo.save(user);
      await stripe.customers.update(user.stripeCustomerId, {
        invoice_settings: { default_payment_method: undefined },
      });
    }
    await stripe.paymentMethods.detach(paymentMethodId);
    await this.customerProfileService.refreshProfileCompletionFromPayment(userId);
  }

  /**
   * Place a manual-capture hold while the booking is still PENDING, before it becomes ACCEPTED.
   * Used when the welper accepts: authorization must succeed (requires_capture) or accept is aborted.
   * Does not create a "needs client 3DS" PI — off-session only; SCA cards fail with PAYMENT_REQUIRES_ACTION_CODE.
   */
  async authorizeHoldBeforeWelperAccept(bookingId: string): Promise<void> {
    const stripe = this.requireStripe();
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.status !== BookingRequestStatus.PENDING) {
      throw new BadRequestException('Payment can only be authorized while the booking is pending');
    }
    const total = booking.totalPrice != null ? Number(booking.totalPrice) : 0;
    if (total <= 0) {
      return;
    }

    const user = await this.ensureStripeCustomer(booking.customerId);
    if (!user.stripeDefaultPaymentMethodId) {
      throw new BadRequestException({
        message: 'Customer has no default payment method; they must add a card in Settings before you can accept.',
        code: PAYMENT_METHOD_REQUIRED_CODE,
      });
    }

    const amountCents = Math.round(total * 100);
    let row = await this.findHoldPayment(bookingId);

    if (row && row.status !== BookingPaymentRecordStatus.CANCELED && row.status !== BookingPaymentRecordStatus.FAILED) {
      const existing = await stripe.paymentIntents.retrieve(row.stripePaymentIntentId);
      if (existing.status === 'requires_capture') {
        return;
      }
    }

    if (row?.stripePaymentIntentId) {
      await this.tryCancelPaymentIntent(row.stripePaymentIntentId);
    }

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
        },
        { idempotencyKey: BOOKING_PI_AUTH_IDEMPOTENCY_KEY(bookingId) },
      );
      await this.upsertBookingPaymentRow(booking, pi.id, amountCents, pi.status);
      if (pi.status === 'requires_capture') {
        return;
      }
      if (pi.status === 'requires_action') {
        await this.tryCancelPaymentIntent(pi.id);
        await this.onBookingCanceled(bookingId);
        throw new BadRequestException({
          message:
            'The customer’s card requires additional authentication. They may need to use a different card or complete verification in Settings.',
          code: PAYMENT_REQUIRES_ACTION_CODE,
        });
      }
      this.logger.warn(`Unexpected PI status after off-session confirm: ${pi.status} booking=${bookingId}`);
      await this.tryCancelPaymentIntent(pi.id);
      await this.onBookingCanceled(bookingId);
      throw new BadRequestException('Payment could not be authorized for this booking');
    } catch (err: unknown) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      const e = err as Stripe.errors.StripeError;
      if (e?.code === 'authentication_required') {
        await this.onBookingCanceled(bookingId);
        throw new BadRequestException({
          message:
            'The customer’s card could not be charged without authentication. Ask them to add or update their payment method, then try accepting again.',
          code: PAYMENT_REQUIRES_ACTION_CODE,
        });
      }
      this.logger.warn(`authorizeHoldBeforeWelperAccept failed: ${e?.message ?? String(err)}`);
      await this.onBookingCanceled(bookingId);
      throw new BadRequestException(e?.message || 'Payment authorization failed');
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
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.customerId !== userId) {
      throw new ForbiddenException('You are not the customer for this booking');
    }
    if (booking.status !== BookingRequestStatus.ACCEPTED) {
      throw new BadRequestException('Booking must be accepted before payment authorization');
    }
    const total = booking.totalPrice != null ? Number(booking.totalPrice) : 0;
    if (total <= 0) {
      throw new BadRequestException('This booking has no chargeable amount');
    }
    const user = await this.ensureStripeCustomer(userId);
    if (!user.stripeDefaultPaymentMethodId) {
      throw new BadRequestException({
        message: 'Add a default payment method in Settings first.',
        code: PAYMENT_METHOD_REQUIRED_CODE,
      });
    }

    const amountCents = Math.round(total * 100);
    let row = await this.findHoldPayment(bookingId);

    if (row && row.status !== BookingPaymentRecordStatus.CANCELED && row.status !== BookingPaymentRecordStatus.FAILED) {
      const existing = await stripe.paymentIntents.retrieve(row.stripePaymentIntentId);
      if (
        existing.status === 'requires_capture' ||
        existing.status === 'requires_confirmation' ||
        existing.status === 'requires_action'
      ) {
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
        },
        { idempotencyKey: BOOKING_PI_AUTH_IDEMPOTENCY_KEY(bookingId) },
      );
      row = await this.upsertBookingPaymentRow(booking, pi.id, amountCents, pi.status);
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
          },
          { idempotencyKey: BOOKING_PI_AUTH_SCA_IDEMPOTENCY_KEY(bookingId) },
        );
        await this.upsertBookingPaymentRow(booking, pi.id, amountCents, pi.status);
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
    piId: string,
    amountCents: number,
    stripeStatus: string,
  ): Promise<BookingPayment> {
    let row = await this.findHoldPayment(booking.id);
    const status = this.mapStripePiStatusToRecord(stripeStatus);
    if (!row) {
      row = this.bookingPaymentRepo.create({
        bookingId: booking.id,
        customerId: booking.customerId,
        welperId: booking.welperId,
        stripePaymentIntentId: piId,
        amountCents,
        currency: 'cad',
        status,
        paymentKind: BookingPaymentKind.HOLD,
      });
    } else {
      row.stripePaymentIntentId = piId;
      row.amountCents = amountCents;
      row.status = status;
      row.paymentKind = BookingPaymentKind.HOLD;
    }
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
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking || booking.status !== BookingRequestStatus.COMPLETED) return;

    const rows = await this.bookingPaymentRepo.find({ where: { bookingId } });
    const relevant = rows.filter(
      (r) =>
        r.paymentKind === BookingPaymentKind.HOLD || r.paymentKind === BookingPaymentKind.DELTA_RECEIPT,
    );
    const pending = relevant.filter(
      (r) =>
        r.status === BookingPaymentRecordStatus.AUTHORIZED ||
        r.status === BookingPaymentRecordStatus.PENDING ||
        r.status === BookingPaymentRecordStatus.REQUIRES_ACTION,
    );
    if (pending.length > 0) return;

    validateTransition(booking.status, BookingRequestStatus.PAYMENT_RELEASED);
    booking.status = BookingRequestStatus.PAYMENT_RELEASED;
    await this.bookingRepo.save(booking);
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
    if (pi.status === 'succeeded') {
      row.capturedAt = new Date();
      if (row.capturedAmountCents == null && typeof pi.amount_received === 'number') {
        row.capturedAmountCents = pi.amount_received;
      }
    }
    await this.bookingPaymentRepo.save(row);
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
  private async emitPaymentCaptured(row: BookingPayment): Promise<void> {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const link = `${baseUrl}/dashboard/bookings/${row.bookingId}`;
    const amountCents = row.capturedAmountCents ?? row.amountCents;
    const amount = (amountCents / 100).toFixed(2);
    const currency = (row.currency ?? 'cad').toUpperCase();
    try {
      await this.notificationService.emitForUser(row.customerId, {
        category: NotificationCategory.PAYMENT,
        title: 'Payment received',
        body: `${amount} ${currency} was charged for your booking. The receipt is in your booking details.`,
        link,
        metadata: { bookingId: row.bookingId, paymentIntentId: row.stripePaymentIntentId, kind: 'captured-customer' },
      });
    } catch (err) {
      this.logger.warn(`Failed to emit captured notification (customer): ${(err as Error).message}`);
    }
    try {
      await this.notificationService.emitForUser(row.welperId, {
        category: NotificationCategory.PAYMENT,
        title: 'Payout queued',
        body: `${amount} ${currency} from a recent booking is on its way to your payout account.`,
        link,
        metadata: { bookingId: row.bookingId, paymentIntentId: row.stripePaymentIntentId, kind: 'captured-welper' },
      });
    } catch (err) {
      this.logger.warn(`Failed to emit captured notification (welper): ${(err as Error).message}`);
    }
  }

  /** NOTIFICATIONS-001: emit when a Stripe payment fails (capture or auth). Only the customer is notified — the welper has no actionable signal here. */
  private async emitPaymentFailed(row: BookingPayment, message: string | null): Promise<void> {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const link = `${baseUrl}/dashboard/bookings/${row.bookingId}`;
    const detail = message?.trim().length ? ` Reason: ${message.trim()}.` : '';
    try {
      await this.notificationService.emitForUser(row.customerId, {
        category: NotificationCategory.PAYMENT,
        title: 'Payment problem',
        body: `We couldn't process the payment for your booking.${detail} Please update your payment method in Settings.`,
        link,
        metadata: { bookingId: row.bookingId, paymentIntentId: row.stripePaymentIntentId, kind: 'failed' },
      });
    } catch (err) {
      this.logger.warn(`Failed to emit payment-failed notification: ${(err as Error).message}`);
    }
  }

  /** NOTIFICATIONS-001: emit when a refund (full or partial) lands. */
  private async emitRefundIssued(row: BookingPayment, refundedAmountCents: number): Promise<void> {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const link = `${baseUrl}/dashboard/bookings/${row.bookingId}`;
    const amount = (refundedAmountCents / 100).toFixed(2);
    const currency = (row.currency ?? 'cad').toUpperCase();
    try {
      await this.notificationService.emitForUser(row.customerId, {
        category: NotificationCategory.PAYMENT,
        title: 'Refund issued',
        body: `A refund of ${amount} ${currency} was issued for your booking. It can take a few business days to appear on your statement.`,
        link,
        metadata: { bookingId: row.bookingId, paymentIntentId: row.stripePaymentIntentId, kind: 'refund' },
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

  async onBookingCanceled(bookingId: string): Promise<void> {
    const stripe = this.stripe;
    const rows = await this.bookingPaymentRepo.find({ where: { bookingId } });
    for (const row of rows) {
      if (row.capturedAt) {
        continue;
      }
      if (row.status === BookingPaymentRecordStatus.CANCELED || row.status === BookingPaymentRecordStatus.FAILED) {
        continue;
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
    deltaPayment?: { clientSecret: string | null; paymentIntentId: string; requiresAction: boolean };
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
      const pi = await stripe.paymentIntents.confirm(
        preparedDeltaPi.id,
        { off_session: true } as Stripe.PaymentIntentConfirmParams,
      );

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
          { idempotencyKey: BOOKING_PI_RECEIPT_DELTA_SCA_KEY(bookingId, receiptId) },
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
      this.logger.warn(`Additional receipt charge failed after hold capture for booking ${bookingId}: ${e?.message ?? String(err)}`);
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
          .andWhere('bp.status = :st', { st: BookingPaymentRecordStatus.AUTHORIZED })
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
        await paymentRepo.save(row);

        return { type: 'captured' as const, bookingId: booking.id, paymentRow: row };
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
        this.logger.warn(
          `reconcileStalePaymentRows: PI ${row.stripePaymentIntentId} failed: ${(e as Error).message}`,
        );
      }
    }
    return { scanned: rows.length, updated };
  }

  /** Sum of captured payment rows for admin refund guidance (disputes). */
  async getTotalCapturedForBooking(
    bookingId: string,
  ): Promise<{ totalCents: number; currency: string } | null> {
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

  /**
   * Refund captured card payments for a booking (full or partial).
   * Partial refunds allocate from the **latest** capture backward until the amount is satisfied.
   * Idempotency keys are derived from `resolutionId` so retries do not double-charge refunds.
   */
  async refundCapturedAmount(
    bookingId: string,
    resolutionId: string,
    partialAmountCents?: number,
  ): Promise<RefundCapturedResult> {
    if (!this.stripe) {
      return {
        ok: false,
        refundsCreated: 0,
        message: 'Stripe is not configured',
      };
    }
    const stripe = this.stripe;
    const idem = (suffix: string) =>
      `resolution-refund-${resolutionId}-${suffix}`.slice(0, 255);

    const rows = await this.bookingPaymentRepo.find({
      where: { bookingId },
      order: { createdAt: 'ASC' },
    });
    const captured = rows.filter((r) => r.capturedAt);
    if (captured.length === 0) {
      return {
        ok: true,
        refundsCreated: 0,
        skipped: true,
        detail: 'No captured payments for this booking',
      };
    }

    const resolveCharge = async (pi: Stripe.PaymentIntent): Promise<Stripe.Charge | null> => {
      const lc = pi.latest_charge;
      if (typeof lc === 'object' && lc !== null && 'amount' in lc) {
        return lc as Stripe.Charge;
      }
      if (typeof lc === 'string' && lc.length > 0) {
        return stripe.charges.retrieve(lc);
      }
      return null;
    };

    if (partialAmountCents == null) {
      let refundsCreated = 0;
      for (const row of captured) {
        try {
          const pi = await stripe.paymentIntents.retrieve(row.stripePaymentIntentId, {
            expand: ['latest_charge'],
          });
          const charge = await resolveCharge(pi);
          if (!charge) {
            continue;
          }
          await stripe.refunds.create(
            { charge: charge.id },
            { idempotencyKey: idem(`full-${row.stripePaymentIntentId}`) },
          );
          refundsCreated += 1;
        } catch (e) {
          return {
            ok: false,
            refundsCreated,
            message: (e as Error).message,
            partialFailure: refundsCreated > 0,
          };
        }
      }
      if (refundsCreated === 0) {
        return {
          ok: false,
          refundsCreated: 0,
          message: 'No refundable charges found for captured payments',
        };
      }
      return { ok: true, refundsCreated };
    }

    let remaining = partialAmountCents;
    const sorted = [...captured].sort((a, b) => +b.createdAt - +a.createdAt);
    let refundsCreated = 0;
    let allocIdx = 0;

    for (const row of sorted) {
      if (remaining <= 0) break;
      try {
        const pi = await stripe.paymentIntents.retrieve(row.stripePaymentIntentId, {
          expand: ['latest_charge'],
        });
        const charge = await resolveCharge(pi);
        if (!charge) {
          continue;
        }
        const refundable = charge.amount - charge.amount_refunded;
        if (refundable <= 0) {
          continue;
        }
        const take = Math.min(remaining, refundable);
        if (take <= 0) {
          continue;
        }
        await stripe.refunds.create(
          { charge: charge.id, amount: take },
          {
            idempotencyKey: idem(`partial-${allocIdx}-${row.stripePaymentIntentId}`),
          },
        );
        allocIdx += 1;
        refundsCreated += 1;
        remaining -= take;
      } catch (e) {
        return {
          ok: false,
          refundsCreated,
          message: (e as Error).message,
          partialFailure: refundsCreated > 0,
        };
      }
    }

    if (remaining > 0) {
      return {
        ok: false,
        refundsCreated,
        message: `Refund incomplete: ${remaining} cents could not be applied (insufficient refundable amount on charges, or charges missing)`,
        partialFailure: refundsCreated > 0,
      };
    }

    if (refundsCreated === 0) {
      return {
        ok: false,
        refundsCreated: 0,
        message: 'No refundable balance available on captured charges',
      };
    }

    return { ok: true, refundsCreated };
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
    }
  }

  async findCapturedRowsForExport(filters: {
    welperId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<BookingPayment[]> {
    const qb = this.bookingPaymentRepo
      .createQueryBuilder('bp')
      .where('bp.captured_at IS NOT NULL')
      .orderBy('bp.captured_at', 'DESC');
    if (filters.welperId) {
      qb.andWhere('bp.welper_id = :wid', { wid: filters.welperId });
    }
    if (filters.dateFrom) {
      qb.andWhere('bp.captured_at >= :df', { df: filters.dateFrom });
    }
    if (filters.dateTo) {
      qb.andWhere('bp.captured_at <= :dt', { dt: filters.dateTo });
    }
    return qb.getMany();
  }

  async findRowsForAdminList(filters: {
    welperId?: string;
    customerId?: string;
    status?: BookingPaymentRecordStatus;
    capturedDateFrom?: Date;
    capturedDateTo?: Date;
    page: number;
    limit: number;
  }): Promise<{
    data: Array<{
      bookingId: string;
      customerId: string;
      welperId: string;
      amountCents: number;
      currency: string;
      status: BookingPaymentRecordStatus;
      stripePaymentIntentId: string;
      captureEligibleAt: string | null;
      capturedAt: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, filters.page);
    const limit = Math.min(Math.max(filters.limit, 1), 100);
    const qb = this.bookingPaymentRepo.createQueryBuilder('bp').orderBy('bp.updated_at', 'DESC');

    if (filters.welperId?.trim()) {
      qb.andWhere('bp.welper_id = :wid', { wid: filters.welperId.trim() });
    }
    if (filters.customerId?.trim()) {
      qb.andWhere('bp.customer_id = :cid', { cid: filters.customerId.trim() });
    }
    if (filters.status) {
      qb.andWhere('bp.status = :st', { st: filters.status });
    }
    if (filters.capturedDateFrom) {
      qb.andWhere('bp.captured_at IS NOT NULL AND bp.captured_at >= :cdf', { cdf: filters.capturedDateFrom });
    }
    if (filters.capturedDateTo) {
      qb.andWhere('bp.captured_at IS NOT NULL AND bp.captured_at <= :cdt', { cdt: filters.capturedDateTo });
    }

    const total = await qb.clone().getCount();
    const rows = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const totalPages = Math.ceil(total / limit) || 1;
    return {
      data: rows.map((r) => ({
        bookingId: r.bookingId,
        customerId: r.customerId,
        welperId: r.welperId,
        amountCents: r.amountCents,
        currency: r.currency,
        status: r.status,
        stripePaymentIntentId: r.stripePaymentIntentId,
        captureEligibleAt: r.captureEligibleAt?.toISOString() ?? null,
        capturedAt: r.capturedAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async processWebhookEvent(event: Stripe.Event): Promise<void> {
    // Idempotency: Stripe may retry and/or deliver the same event concurrently.
    // We "claim" the event by inserting its ID first. If processing fails, we
    // delete the claim so a retry can run again.
    try {
      await this.webhookEventRepo.insert({ eventId: event.id, eventType: event.type });
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
          const customerId =
            typeof pm.customer === 'string' ? pm.customer : pm.customer?.id;
          if (!customerId || !pm.id) break;

          const user = await this.userRepo.findOne({ where: { stripeCustomerId: customerId } });
          if (!user) break;

          // If the detached method was the default we track locally, clear it.
          if (user.stripeDefaultPaymentMethodId === pm.id) {
            user.stripeDefaultPaymentMethodId = null;
            await this.userRepo.save(user);
            await this.customerProfileService.refreshProfileCompletionFromPayment(user.id);
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
        this.logger.warn(
          `Failed to release webhook claim for ${event.id}: ${(cleanupErr as Error).message}`,
        );
      }
      throw err;
    }
  }

  async getBookingPaymentSummary(bookingId: string): Promise<{
    phase: 'none' | 'pending' | 'requires_action' | 'authorized' | 'captured' | 'canceled' | 'failed';
    captureEligibleAt: string | null;
    capturedAt: string | null;
  } | null> {
    const rows = await this.bookingPaymentRepo.find({
      where: { bookingId },
      order: { createdAt: 'ASC' },
    });
    const relevant = rows.filter(
      (r) =>
        r.paymentKind === BookingPaymentKind.HOLD || r.paymentKind === BookingPaymentKind.DELTA_RECEIPT,
    );
    if (relevant.length === 0) {
      return { phase: 'none', captureEligibleAt: null, capturedAt: null };
    }
    const nonCanceled = relevant.filter((r) => r.status !== BookingPaymentRecordStatus.CANCELED);
    type Phase =
      | 'none'
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
