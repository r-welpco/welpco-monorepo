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
          useValue: { findOne: jest.fn(), save: jest.fn(), create: jest.fn() },
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
      ],
    }).compile();

    service = module.get(PaymentService);
    bookingRepo = mockBookingRepo;
    bookingPaymentRepo = mockBookingPaymentRepo;
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

      expect(mockBookingRepo.save).not.toHaveBeenCalled();
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

      expect(mockBookingRepo.save).not.toHaveBeenCalled();
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
  });
});
