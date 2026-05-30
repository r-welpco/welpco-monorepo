import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PaymentService } from './payment.service';
import {
  BookingPayment,
  BookingPaymentKind,
  BookingPaymentRecordStatus,
} from './entities/booking-payment.entity';
import { ProcessedWebhookEvent } from './entities/processed-webhook-event.entity';
import { BookingRequest, BookingRequestStatus } from '../booking/entities/booking-request.entity';
import { UserAccount } from '../user-management/entities/user-account.entity';
import { CustomerProfileService } from '../profile-management/customer-profile/customer-profile.service';
import { ApplicationSettingsService } from './application-settings.service';
import { BookingTaxService } from './booking-tax.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationCategory } from '../notification/entities';
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

  beforeEach(async () => {
    jest.clearAllMocks();
    mockDataSource.transaction.mockImplementation(async (fn: (m: unknown) => Promise<unknown>) =>
      fn({
        getRepository: () => ({
          createQueryBuilder: mockBookingPaymentRepo.createQueryBuilder,
          findOne: mockBookingRepo.findOne,
          save: mockBookingRepo.save,
        }),
      }),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: ConfigService, useValue: mockConfig },
        { provide: DataSource, useValue: mockDataSource },
        { provide: getRepositoryToken(BookingPayment), useValue: mockBookingPaymentRepo },
        { provide: getRepositoryToken(ProcessedWebhookEvent), useValue: { findOne: jest.fn(), save: jest.fn(), create: jest.fn() } },
        { provide: getRepositoryToken(UserAccount), useValue: mockUserRepo },
        { provide: getRepositoryToken(BookingRequest), useValue: mockBookingRepo },
        { provide: ApplicationSettingsService, useValue: mockApplicationSettings },
        { provide: BookingTaxService, useValue: mockBookingTaxService },
        { provide: CustomerProfileService, useValue: mockCustomerProfile },
        { provide: NotificationService, useValue: mockNotificationService },
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
        expect.objectContaining({ status: BookingRequestStatus.PAYMENT_RELEASED }),
      );
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
      mockBookingRepo.findOne.mockResolvedValue({ id: bookingId, status: BookingRequestStatus.PAYMENT_RELEASED } as BookingRequest);

      const pi = { id: 'pi_emit', status: 'succeeded', amount_received: 5000 } as Stripe.PaymentIntent;
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
      mockBookingRepo.findOne.mockResolvedValue({ id: bookingId, status: BookingRequestStatus.PAYMENT_RELEASED } as BookingRequest);
      mockNotificationService.emitForUser.mockRejectedValueOnce(new Error('email service down'));

      const pi = { id: 'pi_fail_emit', status: 'succeeded', amount_received: 1000 } as Stripe.PaymentIntent;
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

      const pi = { id: 'pi_1', status: 'succeeded', amount_received: 1000 } as Stripe.PaymentIntent;
      await service.syncPaymentIntentFromWebhook(pi);

      expect(mockBookingRepo.save).not.toHaveBeenCalled();
    });
  });
});
