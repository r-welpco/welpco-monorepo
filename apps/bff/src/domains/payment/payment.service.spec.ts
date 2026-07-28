import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PaymentService } from './payment.service';
import { BookingPayment, BookingPaymentKind, BookingPaymentRecordStatus } from './entities/booking-payment.entity';
import { ProcessedWebhookEvent } from './entities/processed-webhook-event.entity';
import { BookingRequest, BookingRequestStatus } from '../booking/entities/booking-request.entity';
import { BookingServiceReceipt } from '../booking/entities/booking-service-receipt.entity';
import { UserAccount } from '../user-management/entities/user-account.entity';
import { CustomerProfileService } from '../profile-management/customer-profile/customer-profile.service';
import { ApplicationSettingsService } from './application-settings.service';
import { BookingTaxService } from './booking-tax.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationCategory } from '../notification/entities';
import { WelperPayoutLedgerService } from './welper-payout-ledger.service';
import { StripeOperationsService } from './stripe-operations.service';
import type Stripe from 'stripe';

describe('PaymentService', () => {
  let service: PaymentService;
  let bookingRepo: jest.Mocked<Pick<Repository<BookingRequest>, 'findOne' | 'save'>>;
  let bookingPaymentRepo: jest.Mocked<
    Pick<Repository<BookingPayment>, 'find' | 'findOne' | 'save' | 'create' | 'createQueryBuilder'>
  >;

  const mockBookingRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockBookingPaymentRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const mockReceiptRepo = {
    findOne: jest.fn(),
  };

  const mockUserRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockWebhookEventRepo = {
    insert: jest.fn(),
    delete: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  const mockConfig = {
    get: jest.fn((key: string) => (key === 'STRIPE_SECRET_KEY' ? 'sk_test_x' : undefined)),
  };

  const mockApplicationSettings = {
    getPaymentCaptureDelayMinutes: jest.fn().mockResolvedValue(30),
  };

  const mockBookingTaxService = {
    quoteAuthorizationHold: jest.fn().mockResolvedValue({
      subtotalCents: 5000,
      taxCents: 650,
      totalCents: 5650,
      taxRateBps: 1300,
      stripeTaxCalculationId: 'taxcalc_test',
    }),
  };

  const mockCustomerProfile = {
    refreshProfileCompletionFromPayment: jest.fn().mockResolvedValue(undefined),
  };

  // NOTIFICATIONS-001 (Day 16 dispatch 2): payment captures, failures, and
  // refunds emit notifications to customer and welper.
  const mockNotificationService = {
    emitForUser: jest.fn().mockResolvedValue(null),
    send: jest.fn().mockResolvedValue(null),
    resolveLocaleForUser: jest.fn().mockResolvedValue('en'),
  };

  const mockWelperPayoutLedger = {
    createLedgerForPaymentReleased: jest.fn().mockResolvedValue(null),
    upsertLedgerForReleasedBooking: jest.fn().mockResolvedValue(null),
    applyRefundDelta: jest.fn().mockResolvedValue(undefined),
    syncStripeFeesForBooking: jest.fn().mockResolvedValue({ totalFeeCents: 0, allSynced: true }),
  };
  const mockStripeOperations = {
    ensureTaxTransaction: jest.fn().mockResolvedValue(true),
    retryPendingTaxTransactions: jest.fn().mockResolvedValue({ scanned: 0, recovered: 0 }),
    reconcileBookingRefunds: jest.fn().mockResolvedValue(undefined),
    syncRefund: jest.fn().mockResolvedValue(null),
    syncChargeRefunds: jest.fn().mockResolvedValue(undefined),
    getRefundDecisionSnapshot: jest.fn(),
    getRecoveryTaskForResolution: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockReceiptRepo.findOne.mockResolvedValue({
      bookingId: 'b1',
      subtotalCents: 885,
      taxCents: 115,
      totalCents: 1000,
    });
    mockDataSource.transaction.mockImplementation(async (fn: (m: unknown) => Promise<unknown>) => {
      const bookingQb = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn(() => mockBookingRepo.findOne()),
      };
      const receiptQb = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn(() => mockReceiptRepo.findOne()),
      };
      const paymentQb = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn(() => mockBookingPaymentRepo.find()),
      };
      return fn({
        getRepository: (entity: unknown) => {
          if (entity === BookingRequest) {
            return {
              createQueryBuilder: jest.fn(() => bookingQb),
              save: mockBookingRepo.save,
            };
          }
          if (entity === BookingServiceReceipt) {
            return { createQueryBuilder: jest.fn(() => receiptQb) };
          }
          if (entity === BookingPayment) {
            return { createQueryBuilder: jest.fn(() => paymentQb) };
          }
          return {};
        },
      });
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: ConfigService, useValue: mockConfig },
        { provide: DataSource, useValue: mockDataSource },
        {
          provide: getRepositoryToken(BookingPayment),
          useValue: mockBookingPaymentRepo,
        },
        {
          provide: getRepositoryToken(ProcessedWebhookEvent),
          useValue: mockWebhookEventRepo,
        },
        { provide: getRepositoryToken(UserAccount), useValue: mockUserRepo },
        {
          provide: getRepositoryToken(BookingRequest),
          useValue: mockBookingRepo,
        },
        {
          provide: ApplicationSettingsService,
          useValue: mockApplicationSettings,
        },
        { provide: BookingTaxService, useValue: mockBookingTaxService },
        { provide: CustomerProfileService, useValue: mockCustomerProfile },
        { provide: NotificationService, useValue: mockNotificationService },
        {
          provide: WelperPayoutLedgerService,
          useValue: mockWelperPayoutLedger,
        },
        { provide: StripeOperationsService, useValue: mockStripeOperations },
      ],
    }).compile();

    service = module.get(PaymentService);
    bookingRepo = mockBookingRepo;
    bookingPaymentRepo = mockBookingPaymentRepo;
  });

  describe('deferred authorization', () => {
    it('schedules authorization 72 hours before a later booking', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-06-14T12:00:00.000Z'));
      const booking = {
        id: 'later-booking',
        status: BookingRequestStatus.PENDING,
        scheduledDate: '2026-06-21',
        scheduledStartTime: '12:00',
        timezoneOffsetMinutes: 0,
      } as BookingRequest;
      mockBookingRepo.findOne.mockResolvedValue(booking);
      mockBookingRepo.save.mockImplementation(async (row) => row);

      await expect(service.prepareAuthorizationForAcceptance(booking.id)).resolves.toBe('scheduled');

      expect(booking.paymentAuthorizationStatus).toBe('scheduled');
      expect(booking.paymentAuthorizationDueAt?.toISOString()).toBe('2026-06-18T12:00:00.000Z');
      expect(booking.paymentAuthorizationDeadlineAt?.toISOString()).toBe('2026-06-20T12:00:00.000Z');
      jest.useRealTimers();
    });

    it('authorizes immediately when service starts within 72 hours', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-06-14T12:00:00.000Z'));
      const booking = {
        id: 'near-booking',
        status: BookingRequestStatus.PENDING,
        scheduledDate: '2026-06-17',
        scheduledStartTime: '12:00',
        timezoneOffsetMinutes: 0,
      } as BookingRequest;
      mockBookingRepo.findOne.mockResolvedValue(booking);
      mockBookingRepo.save.mockImplementation(async (row) => row);
      const authorize = jest.spyOn(service, 'authorizeHoldBeforeWelperAccept').mockResolvedValue(undefined);

      await expect(service.prepareAuthorizationForAcceptance(booking.id)).resolves.toBe('authorized');

      expect(authorize).toHaveBeenCalledWith(booking.id);
      jest.useRealTimers();
    });

    it('claims scheduled work with skip-locked database locking', async () => {
      const setOnLocked = jest.fn().mockReturnThis();
      const save = jest.fn().mockImplementation(async (row) => row);
      let claimed = false;
      mockDataSource.transaction.mockImplementation(async (fn: (manager: unknown) => Promise<unknown>) =>
        fn({
          getRepository: () => ({
            createQueryBuilder: () => ({
              setLock: jest.fn().mockReturnThis(),
              setOnLocked,
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getOne: jest.fn().mockImplementation(async () => {
                if (claimed) return null;
                claimed = true;
                return {
                  id: 'scheduled-booking',
                  paymentAuthorizationLeaseUntil: null,
                };
              }),
            }),
            save,
          }),
        }),
      );
      jest.spyOn(service, 'authorizeHoldBeforeWelperAccept').mockResolvedValue(undefined);

      await expect(service.processDeferredAuthorizations(2)).resolves.toEqual({ processed: 1, failed: 0 });

      expect(setOnLocked).toHaveBeenCalledWith('skip_locked');
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'scheduled-booking',
          paymentAuthorizationLeaseUntil: expect.any(Date),
        }),
      );
    });

    it('cancels outstanding authorization work when the booking is cancelled', async () => {
      const booking = {
        id: 'cancelled-booking',
        status: BookingRequestStatus.CANCELLED,
        paymentAuthorizationStatus: 'scheduled',
        paymentAuthorizationLeaseUntil: new Date(),
      } as BookingRequest;
      mockBookingRepo.findOne.mockResolvedValue(booking);
      mockBookingRepo.save.mockImplementation(async (row) => row);
      mockBookingPaymentRepo.find.mockResolvedValue([]);

      await service.onBookingCanceled(booking.id);

      expect(mockBookingRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentAuthorizationStatus: 'canceled',
          paymentAuthorizationLeaseUntil: null,
        }),
      );
    });

    it('reschedules one replacement when Stripe automatically expires the latest hold without capture_before', async () => {
      const row = {
        id: 'payment-1',
        bookingId: 'booking-1',
        stripePaymentIntentId: 'pi_expired',
        paymentKind: BookingPaymentKind.HOLD,
        status: BookingPaymentRecordStatus.AUTHORIZED,
        authorizationExpiresAt: null,
      } as BookingPayment;
      const booking = {
        id: 'booking-1',
        customerId: 'customer-1',
        welperId: 'welper-1',
        status: BookingRequestStatus.ACCEPTED,
        scheduledDate: '2026-06-21',
        scheduledStartTime: '12:00',
        scheduledEndTime: '14:00',
        timezoneOffsetMinutes: 0,
        paymentAuthorizationAttemptCount: 1,
        paymentAuthorizationDeadlineAt: new Date(Date.now() + 60 * 60 * 1000),
      } as BookingRequest;
      mockBookingPaymentRepo.findOne.mockResolvedValue(row);
      mockBookingPaymentRepo.save.mockImplementation(async (value) => value);
      mockBookingRepo.findOne.mockResolvedValue(booking);
      mockBookingRepo.save.mockImplementation(async (value) => value);

      await service.syncPaymentIntentFromWebhook({
        id: 'pi_expired',
        status: 'canceled',
        cancellation_reason: 'automatic',
        latest_charge: {
          id: 'ch_expired',
          payment_method_details: {
            card: { brand: 'visa' },
          },
        },
      } as unknown as Stripe.PaymentIntent);

      expect(booking.paymentAuthorizationStatus).toBe('scheduled');
      expect(booking.paymentAuthorizationFailureCode).toBe('authorization_expired');
      expect(booking.paymentAuthorizationDueAt).toBeInstanceOf(Date);
      expect(mockNotificationService.emitForUser).toHaveBeenCalledWith(
        booking.customerId,
        expect.objectContaining({
          metadata: expect.objectContaining({ kind: 'deferred_authorization_failed' }),
        }),
      );
    });

    it('never captures a fee for a payment-deadline cancellation', async () => {
      const booking = {
        id: 'booking-deadline',
        cancellationSource: 'payment_authorization_deadline',
        cancellationFeeCents: 0,
      } as BookingRequest;
      const row = {
        bookingId: booking.id,
        stripePaymentIntentId: 'pi_hold',
        paymentKind: BookingPaymentKind.HOLD,
        status: BookingPaymentRecordStatus.AUTHORIZED,
        capturedAt: null,
      } as BookingPayment;
      mockBookingRepo.findOne.mockResolvedValue(booking);
      mockBookingRepo.save.mockImplementation(async (value) => value);
      mockBookingPaymentRepo.find.mockResolvedValue([row]);
      mockBookingPaymentRepo.save.mockImplementation(async (value) => value);
      const capture = jest.fn();
      const retrieve = jest.fn();
      const cancel = jest.fn().mockResolvedValue({});
      (service as unknown as { stripe: unknown }).stripe = {
        paymentIntents: { capture, retrieve, cancel },
      };

      await service.onBookingCanceled(booking.id, { chargeLateCancellationFee: false });

      expect(capture).not.toHaveBeenCalled();
      expect(retrieve).not.toHaveBeenCalled();
      expect(cancel).toHaveBeenCalledWith('pi_hold');
      expect(booking.cancellationFeeCents).toBe(0);
    });

    it('records a late-cancellation fee only after Stripe captures a live hold', async () => {
      const booking = {
        id: 'booking-customer-cancel',
        cancellationSource: 'customer',
        cancellationFeeCents: 0,
        hourlyRate: 50,
      } as BookingRequest;
      const row = {
        bookingId: booking.id,
        stripePaymentIntentId: 'pi_live_hold',
        paymentKind: BookingPaymentKind.HOLD,
        status: BookingPaymentRecordStatus.AUTHORIZED,
        amountCents: 5650,
        capturedAt: null,
        authorizationExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      } as BookingPayment;
      mockBookingRepo.findOne.mockResolvedValue(booking);
      mockBookingRepo.save.mockImplementation(async (value) => value);
      mockBookingPaymentRepo.find.mockResolvedValue([row]);
      mockBookingPaymentRepo.save.mockImplementation(async (value) => value);
      const capture = jest.fn().mockResolvedValue({ status: 'succeeded' });
      const retrieve = jest.fn().mockResolvedValue({ status: 'requires_capture' });
      (service as unknown as { stripe: unknown }).stripe = {
        paymentIntents: { capture, retrieve, cancel: jest.fn() },
      };

      await service.onBookingCanceled(booking.id, { chargeLateCancellationFee: true });

      expect(capture).toHaveBeenCalledWith('pi_live_hold', { amount_to_capture: 5650 });
      expect(row.captureReason).toBe('late_cancellation');
      expect(booking.cancellationFeeCents).toBe(5650);
    });

    it('preserves a separate payment row for every authorization attempt', async () => {
      const booking = {
        id: 'booking-history',
        customerId: 'customer-1',
        welperId: 'welper-1',
        scheduledDate: '2026-08-01',
        scheduledStartTime: '12:00',
        scheduledEndTime: '14:00',
        timezoneOffsetMinutes: 0,
      } as BookingRequest;
      mockBookingPaymentRepo.findOne.mockResolvedValue(null);
      mockBookingPaymentRepo.create.mockImplementation((value) => value as BookingPayment);
      mockBookingPaymentRepo.save.mockImplementation(async (value) => value);
      mockBookingRepo.save.mockImplementation(async (value) => value);
      const persist = service as unknown as {
        upsertBookingPaymentRow: (
          targetBooking: BookingRequest,
          paymentIntent: Stripe.PaymentIntent,
          amountCents: number,
        ) => Promise<BookingPayment>;
      };
      const makePi = (id: string, chargeId: string) =>
        ({
          id,
          status: 'requires_capture',
          latest_charge: {
            id: chargeId,
            payment_method_details: {
              card: {
                brand: 'visa',
                capture_before: Math.floor(Date.parse('2026-08-03T12:00:00Z') / 1000),
              },
            },
          },
        }) as unknown as Stripe.PaymentIntent;

      await persist.upsertBookingPaymentRow(booking, makePi('pi_1', 'ch_1'), 5650);
      await persist.upsertBookingPaymentRow(booking, makePi('pi_2', 'ch_2'), 5650);

      expect(mockBookingPaymentRepo.create).toHaveBeenCalledTimes(2);
      expect(mockBookingPaymentRepo.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ stripePaymentIntentId: 'pi_1' }),
      );
      expect(mockBookingPaymentRepo.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ stripePaymentIntentId: 'pi_2' }),
      );
    });
  });

  describe('syncPaymentIntentFromWebhook', () => {
    it('moves booking from completed to payment_released when PI succeeds', async () => {
      const bookingId = 'b1';
      const row: Partial<BookingPayment> = {
        id: 'pay1',
        bookingId,
        stripePaymentIntentId: 'pi_1',
        status: BookingPaymentRecordStatus.AUTHORIZED,
        amountCents: 1000,
        currency: 'cad',
        paymentKind: BookingPaymentKind.HOLD,
      };
      mockBookingPaymentRepo.findOne.mockResolvedValue(row as BookingPayment);
      mockBookingPaymentRepo.save.mockImplementation((r) => Promise.resolve(r as BookingPayment));
      mockBookingPaymentRepo.find.mockResolvedValue([
        {
          ...row,
          status: BookingPaymentRecordStatus.CAPTURED,
          paymentKind: BookingPaymentKind.HOLD,
          capturedAt: new Date(),
          capturedAmountCents: 1000,
        } as BookingPayment,
      ]);

      const booking = {
        id: bookingId,
        status: BookingRequestStatus.COMPLETED,
      } as BookingRequest;
      mockBookingRepo.findOne.mockResolvedValue(booking);
      mockBookingRepo.save.mockImplementation((b) => Promise.resolve(b as BookingRequest));

      const pi = {
        id: 'pi_1',
        status: 'succeeded',
        amount_received: 1000,
      } as Stripe.PaymentIntent;

      await service.syncPaymentIntentFromWebhook(pi);

      expect(mockBookingRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: BookingRequestStatus.PAYMENT_RELEASED,
        }),
      );
      expect(mockWelperPayoutLedger.upsertLedgerForReleasedBooking).toHaveBeenCalled();
    });

    it('NOTIFICATIONS-001: emits PAYMENT capture notifications to BOTH customer and welper', async () => {
      const bookingId = 'b-emit';
      const row: Partial<BookingPayment> = {
        id: 'pay-emit',
        bookingId,
        stripePaymentIntentId: 'pi_emit',
        status: BookingPaymentRecordStatus.AUTHORIZED,
        amountCents: 5000,
        currency: 'cad',
        paymentKind: BookingPaymentKind.HOLD,
        customerId: 'cust-emit',
        welperId: 'welp-emit',
      };
      mockBookingPaymentRepo.findOne.mockResolvedValue(row as BookingPayment);
      mockBookingPaymentRepo.save.mockImplementation((r) => Promise.resolve(r as BookingPayment));
      mockBookingPaymentRepo.find.mockResolvedValue([]);
      mockBookingRepo.findOne.mockResolvedValue({
        id: bookingId,
        status: BookingRequestStatus.PAYMENT_RELEASED,
      } as BookingRequest);

      const pi = {
        id: 'pi_emit',
        status: 'succeeded',
        amount_received: 5000,
      } as Stripe.PaymentIntent;
      await service.syncPaymentIntentFromWebhook(pi);

      expect(mockNotificationService.emitForUser).toHaveBeenCalledTimes(2);
      const calls = mockNotificationService.emitForUser.mock.calls;
      const recipients = calls.map((c) => c[0]);
      expect(recipients).toEqual(expect.arrayContaining(['cust-emit', 'welp-emit']));
      const customerCall = calls.find((c) => c[0] === 'cust-emit')!;
      expect(customerCall[1].category).toBe(NotificationCategory.PAYMENT);
      expect(customerCall[1].paymentEmailType).toBe('payment_captured_customer');
      expect(customerCall[1].paymentEmailVariables).toEqual(
        expect.objectContaining({ amount: '50.00', currency: 'CAD' }),
      );
      const welperCall = calls.find((c) => c[0] === 'welp-emit')!;
      expect(welperCall[1].paymentEmailType).toBe('payment_captured_welper');
    });

    it('NOTIFICATIONS-001: emit failure does not block payment release write', async () => {
      const bookingId = 'b-emit-fail';
      const row: Partial<BookingPayment> = {
        bookingId,
        stripePaymentIntentId: 'pi_fail_emit',
        status: BookingPaymentRecordStatus.AUTHORIZED,
        amountCents: 1000,
        currency: 'cad',
        paymentKind: BookingPaymentKind.HOLD,
        customerId: 'cust-emit',
        welperId: 'welp-emit',
      };
      mockBookingPaymentRepo.findOne.mockResolvedValue(row as BookingPayment);
      mockBookingPaymentRepo.save.mockImplementation((r) => Promise.resolve(r as BookingPayment));
      mockBookingPaymentRepo.find.mockResolvedValue([]);
      mockBookingRepo.findOne.mockResolvedValue({
        id: bookingId,
        status: BookingRequestStatus.PAYMENT_RELEASED,
      } as BookingRequest);
      mockNotificationService.emitForUser.mockRejectedValueOnce(new Error('email service down'));

      const pi = {
        id: 'pi_fail_emit',
        status: 'succeeded',
        amount_received: 1000,
      } as Stripe.PaymentIntent;
      await expect(service.syncPaymentIntentFromWebhook(pi)).resolves.toBeUndefined();
    });

    it('does not change booking when already payment_released', async () => {
      const bookingId = 'b1';
      const row: Partial<BookingPayment> = {
        bookingId,
        stripePaymentIntentId: 'pi_1',
        status: BookingPaymentRecordStatus.AUTHORIZED,
        amountCents: 1000,
        currency: 'cad',
        paymentKind: BookingPaymentKind.HOLD,
      };
      mockBookingPaymentRepo.findOne.mockResolvedValue(row as BookingPayment);
      mockBookingPaymentRepo.save.mockImplementation((r) => Promise.resolve(r as BookingPayment));
      mockBookingPaymentRepo.find.mockResolvedValue([]);

      mockBookingRepo.findOne.mockResolvedValue({
        id: bookingId,
        status: BookingRequestStatus.PAYMENT_RELEASED,
      } as BookingRequest);

      const pi = {
        id: 'pi_1',
        status: 'succeeded',
        amount_received: 1000,
      } as Stripe.PaymentIntent;
      await service.syncPaymentIntentFromWebhook(pi);

      expect(mockBookingRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: BookingRequestStatus.PAYMENT_RELEASED }),
      );
    });

    it('does not release when a failed receipt delta leaves the receipt underpaid', async () => {
      const bookingId = 'b-underpaid';
      const hold = {
        bookingId,
        stripePaymentIntentId: 'pi_hold',
        status: BookingPaymentRecordStatus.CAPTURED,
        amountCents: 1000,
        capturedAmountCents: 1000,
        capturedAt: new Date(),
        paymentKind: BookingPaymentKind.HOLD,
      } as BookingPayment;
      const delta = {
        bookingId,
        stripePaymentIntentId: 'pi_delta',
        status: BookingPaymentRecordStatus.FAILED,
        amountCents: 500,
        capturedAt: null,
        paymentKind: BookingPaymentKind.DELTA_RECEIPT,
      } as BookingPayment;
      mockBookingPaymentRepo.findOne.mockResolvedValue(hold);
      mockBookingPaymentRepo.save.mockImplementation((row) => Promise.resolve(row as BookingPayment));
      mockBookingPaymentRepo.find.mockResolvedValue([hold, delta]);
      mockBookingRepo.findOne.mockResolvedValue({
        id: bookingId,
        status: BookingRequestStatus.COMPLETED,
      } as BookingRequest);
      mockReceiptRepo.findOne.mockResolvedValue({
        bookingId,
        subtotalCents: 1327,
        taxCents: 173,
        totalCents: 1500,
      });

      await service.syncPaymentIntentFromWebhook({
        id: 'pi_hold',
        status: 'succeeded',
        amount_received: 1000,
      } as Stripe.PaymentIntent);

      expect(mockBookingRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: BookingRequestStatus.COMPLETED }),
      );
      expect(mockWelperPayoutLedger.upsertLedgerForReleasedBooking).not.toHaveBeenCalled();
    });
  });

  describe('saved payment method ownership', () => {
    it('rejects setting a payment method owned by another Stripe customer', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 'user-1',
        stripeCustomerId: 'cus_owner',
      });
      const retrieve = jest.fn().mockResolvedValue({
        id: 'pm_other',
        customer: 'cus_other',
      });
      const attach = jest.fn();
      (service as unknown as { stripe: unknown }).stripe = {
        paymentMethods: { retrieve, attach },
        customers: { update: jest.fn() },
      };

      await expect(service.setDefaultPaymentMethod('user-1', 'pm_other')).rejects.toThrow(
        'Payment method does not belong to this account',
      );
      expect(attach).not.toHaveBeenCalled();
    });

    it('rejects detaching a payment method owned by another Stripe customer', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 'user-1',
        stripeCustomerId: 'cus_owner',
        stripeDefaultPaymentMethodId: null,
      });
      const detach = jest.fn();
      (service as unknown as { stripe: unknown }).stripe = {
        paymentMethods: {
          retrieve: jest.fn().mockResolvedValue({
            id: 'pm_other',
            customer: 'cus_other',
          }),
          detach,
        },
      };

      await expect(service.detachPaymentMethod('user-1', 'pm_other')).rejects.toThrow(
        'Payment method does not belong to this account',
      );
      expect(detach).not.toHaveBeenCalled();
    });

    it('promotes the newest remaining card when the default card is removed', async () => {
      const user = {
        id: 'user-1',
        stripeCustomerId: 'cus_owner',
        stripeDefaultPaymentMethodId: 'pm_default',
      } as UserAccount;
      mockUserRepo.findOne.mockResolvedValue(user);
      mockUserRepo.save.mockImplementation(async (row) => row);
      const detach = jest.fn().mockResolvedValue({ id: 'pm_default' });
      const updateCustomer = jest.fn().mockResolvedValue({});
      (service as unknown as { stripe: unknown }).stripe = {
        paymentMethods: {
          retrieve: jest.fn().mockResolvedValue({
            id: 'pm_default',
            customer: 'cus_owner',
          }),
          detach,
          list: jest.fn().mockResolvedValue({
            data: [
              { id: 'pm_older', created: 100 },
              { id: 'pm_newer', created: 200 },
            ],
          }),
        },
        customers: { update: updateCustomer },
      };

      await service.detachPaymentMethod('user-1', 'pm_default');

      expect(detach).toHaveBeenCalledWith('pm_default');
      expect(updateCustomer).toHaveBeenCalledWith('cus_owner', {
        invoice_settings: { default_payment_method: 'pm_newer' },
      });
      expect(user.stripeDefaultPaymentMethodId).toBe('pm_newer');
      expect(mockCustomerProfile.refreshProfileCompletionFromPayment).toHaveBeenCalledWith(
        'user-1',
      );
    });

    it('clears the default when its card is removed and no cards remain', async () => {
      const user = {
        id: 'user-1',
        stripeCustomerId: 'cus_owner',
        stripeDefaultPaymentMethodId: 'pm_default',
      } as UserAccount;
      mockUserRepo.findOne.mockResolvedValue(user);
      mockUserRepo.save.mockImplementation(async (row) => row);
      const updateCustomer = jest.fn().mockResolvedValue({});
      (service as unknown as { stripe: unknown }).stripe = {
        paymentMethods: {
          retrieve: jest.fn().mockResolvedValue({
            id: 'pm_default',
            customer: 'cus_owner',
          }),
          detach: jest.fn().mockResolvedValue({ id: 'pm_default' }),
          list: jest.fn().mockResolvedValue({ data: [] }),
        },
        customers: { update: updateCustomer },
      };

      await service.detachPaymentMethod('user-1', 'pm_default');

      expect(updateCustomer).toHaveBeenCalledWith('cus_owner', {
        invoice_settings: { default_payment_method: '' },
      });
      expect(user.stripeDefaultPaymentMethodId).toBeNull();
    });

    it('promotes a remaining card for a detached webhook without a customer id', async () => {
      const user = {
        id: 'user-1',
        stripeCustomerId: 'cus_owner',
        stripeDefaultPaymentMethodId: 'pm_default',
      } as UserAccount;
      mockUserRepo.findOne.mockResolvedValue(user);
      mockUserRepo.save.mockImplementation(async (row) => row);
      const updateCustomer = jest.fn().mockResolvedValue({});
      (service as unknown as { stripe: unknown }).stripe = {
        paymentMethods: {
          list: jest.fn().mockResolvedValue({
            data: [{ id: 'pm_replacement', created: 100 }],
          }),
        },
        customers: { update: updateCustomer },
      };

      await service.processWebhookEvent({
        id: 'evt_payment_method_detached',
        type: 'payment_method.detached',
        data: {
          object: {
            id: 'pm_default',
            object: 'payment_method',
            customer: null,
          },
        },
      } as Stripe.Event);

      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { stripeDefaultPaymentMethodId: 'pm_default' },
      });
      expect(updateCustomer).toHaveBeenCalledWith('cus_owner', {
        invoice_settings: { default_payment_method: 'pm_replacement' },
      });
      expect(user.stripeDefaultPaymentMethodId).toBe('pm_replacement');
    });
  });
});
