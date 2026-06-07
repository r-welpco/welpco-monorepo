import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { PayoutBatchService } from './payout-batch.service';
import { PayoutBatch } from './entities/payout-batch.entity';
import { WelperPayoutLedger } from './entities/welper-payout-ledger.entity';
import { WelperPayoutLedgerService } from './welper-payout-ledger.service';
import { StripeConnectService } from './stripe-connect.service';
import { WelperProfile } from '../profile-management/entities/welper-profile.entity';
import { UserAccount } from '../user-management/entities/user-account.entity';
import { BookingRequest, BookingRequestStatus } from '../booking/entities/booking-request.entity';
import {
  PayoutBatchStatus,
  WelperPayoutLedgerStatus,
} from './entities/payout-ledger-status.enum';
import { PayoutMethodChoice } from '../profile-management/entities/payout-method-choice.enum';

describe('PayoutBatchService', () => {
  let service: PayoutBatchService;
  const transfersCreate = jest.fn();

  const mockBatchRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((x) => ({ id: 'batch-1', ...x })),
    save: jest.fn(async (x) => x),
    remove: jest.fn(),
  };
  const mockLedgerRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(async (x) => x),
    update: jest.fn(),
  };
  const mockWelperProfileRepo = { findOne: jest.fn() };
  const mockUserRepo = { findOne: jest.fn() };
  const mockBookingRepo = { findOne: jest.fn(), count: jest.fn().mockResolvedValue(0) };
  const mockLedgerService = {
    releaseScheduledLinesFromBatch: jest.fn(),
  };
  const mockStripeConnect = {
    getStatus: jest.fn().mockResolvedValue({ onboardingComplete: true, payoutsEnabled: true }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    transfersCreate.mockResolvedValue({ id: 'tr_test_1' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayoutBatchService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn((k: string) => (k === 'STRIPE_SECRET_KEY' ? 'sk_test' : undefined)) },
        },
        { provide: DataSource, useValue: {} },
        { provide: getRepositoryToken(PayoutBatch), useValue: mockBatchRepo },
        { provide: getRepositoryToken(WelperPayoutLedger), useValue: mockLedgerRepo },
        { provide: getRepositoryToken(WelperProfile), useValue: mockWelperProfileRepo },
        { provide: getRepositoryToken(UserAccount), useValue: mockUserRepo },
        { provide: getRepositoryToken(BookingRequest), useValue: mockBookingRepo },
        { provide: WelperPayoutLedgerService, useValue: mockLedgerService },
        { provide: StripeConnectService, useValue: mockStripeConnect },
      ],
    }).compile();

    service = module.get(PayoutBatchService);
    (service as unknown as { stripe: { transfers: { create: jest.Mock } } }).stripe = {
      transfers: { create: transfersCreate },
    };
  });

  describe('approveAndExecute', () => {
    it('rejects when welpers are not Connect-ready', async () => {
      mockBatchRepo.findOne.mockResolvedValue({
        id: 'batch-1',
        status: PayoutBatchStatus.REVIEW,
        payoutFriday: '2026-06-12',
      });
      mockLedgerRepo.find.mockResolvedValue([
        {
          id: 'l1',
          welperId: 'w1',
          bookingId: 'b1',
          customerId: 'c1',
          paymentReleasedAt: new Date('2026-06-01T12:00:00.000Z'),
          customerSubtotalCents: 10000,
          customerTaxCents: 1300,
          customerTotalCents: 11300,
          welperGrossCents: 8000,
          welperRefundCents: 0,
          welperNetCents: 8000,
          platformGrossCents: 2000,
          stripeFeeCents: 100,
          status: WelperPayoutLedgerStatus.SCHEDULED,
          exclusionReason: null,
          payoutBatchId: 'batch-1',
        },
      ]);
      mockUserRepo.findOne.mockResolvedValue({ id: 'w1', email: 'welper@test.com' });
      mockWelperProfileRepo.findOne.mockResolvedValue({
        welperId: 'w1',
        stripeConnectAccountId: null,
        payoutMethodChoice: PayoutMethodChoice.STRIPE,
      });

      await expect(service.approveAndExecute('batch-1', 'admin-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(transfersCreate).not.toHaveBeenCalled();
    });

    it('rejects when Connect onboarding is complete but payouts are disabled', async () => {
      mockBatchRepo.findOne.mockResolvedValue({
        id: 'batch-1',
        status: PayoutBatchStatus.REVIEW,
        payoutFriday: '2026-06-12',
      });
      mockLedgerRepo.find.mockResolvedValue([
        {
          id: 'l1',
          welperId: 'w1',
          bookingId: 'b1',
          customerId: 'c1',
          paymentReleasedAt: new Date('2026-06-01T12:00:00.000Z'),
          customerSubtotalCents: 10000,
          customerTaxCents: 1300,
          customerTotalCents: 11300,
          welperGrossCents: 8000,
          welperRefundCents: 0,
          welperNetCents: 8000,
          platformGrossCents: 2000,
          stripeFeeCents: 100,
          status: WelperPayoutLedgerStatus.SCHEDULED,
          exclusionReason: null,
          payoutBatchId: 'batch-1',
        },
      ]);
      mockUserRepo.findOne.mockResolvedValue({ id: 'w1', email: 'welper@test.com' });
      mockWelperProfileRepo.findOne.mockResolvedValue({
        welperId: 'w1',
        stripeConnectAccountId: 'acct_real_123',
        payoutMethodChoice: PayoutMethodChoice.STRIPE,
      });
      mockStripeConnect.getStatus.mockResolvedValueOnce({
        onboardingComplete: true,
        payoutsEnabled: false,
      });

      await expect(service.approveAndExecute('batch-1', 'admin-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('creates Stripe transfers per welper when Connect-ready', async () => {
      mockBatchRepo.findOne.mockResolvedValue({
        id: 'batch-1',
        status: PayoutBatchStatus.REVIEW,
        payoutFriday: '2026-06-12',
      });
      mockLedgerRepo.find.mockResolvedValue([
        {
          id: 'l1',
          welperId: 'w1',
          bookingId: 'b1',
          customerId: 'c1',
          paymentReleasedAt: new Date('2026-06-01T12:00:00.000Z'),
          customerSubtotalCents: 12500,
          customerTaxCents: 1625,
          customerTotalCents: 14125,
          welperGrossCents: 10000,
          welperRefundCents: 0,
          welperNetCents: 10000,
          platformGrossCents: 2500,
          stripeFeeCents: 150,
          status: WelperPayoutLedgerStatus.SCHEDULED,
          exclusionReason: null,
          payoutBatchId: 'batch-1',
        },
      ]);
      mockUserRepo.findOne.mockResolvedValue({ id: 'w1', email: 'welper@test.com' });
      mockWelperProfileRepo.findOne.mockResolvedValue({
        welperId: 'w1',
        stripeConnectAccountId: 'acct_real_123',
        payoutMethodChoice: PayoutMethodChoice.STRIPE,
      });
      mockBookingRepo.count.mockResolvedValue(0);

      const result = await service.approveAndExecute('batch-1', 'admin-1');

      expect(transfersCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 10000,
          currency: 'cad',
          destination: 'acct_real_123',
          transfer_group: 'batch-1',
        }),
        expect.objectContaining({ idempotencyKey: 'payout-batch-batch-1-welper-w1' }),
      );
      expect(result.welpers[0]?.welperNetCents).toBe(10000);
      expect(mockLedgerRepo.update).toHaveBeenCalled();
    });
  });

  describe('buildDraftBatch', () => {
    it('schedules eligible pending ledger lines', async () => {
      mockBatchRepo.findOne.mockImplementation(async (opts: { where?: { id?: string; payoutFriday?: string } }) => {
        if (opts?.where?.id === 'batch-1') {
          return {
            id: 'batch-1',
            payoutFriday: '2026-06-06',
            status: PayoutBatchStatus.REVIEW,
            bookingCount: 1,
            welperCount: 1,
            totalWelperNetCents: 5000,
            totalPlatformGrossCents: 1250,
            totalStripeFeeCents: 80,
            totalCustomerCapturedCents: 7000,
          };
        }
        return null;
      });
      mockLedgerRepo.update.mockResolvedValue(undefined);
      const line = {
        id: 'l1',
        welperId: 'w1',
        bookingId: 'b1',
        customerId: 'c1',
        paymentReleasedAt: new Date('2026-05-20T12:00:00.000Z'),
        welperNetCents: 5000,
        platformGrossCents: 1250,
        stripeFeeCents: 80,
        customerTotalCents: 7000,
        status: WelperPayoutLedgerStatus.PENDING,
      };
      mockLedgerRepo.find.mockResolvedValue([line]);
      mockBookingRepo.findOne.mockResolvedValue({
        id: 'b1',
        status: BookingRequestStatus.PAYMENT_RELEASED,
      });
      mockUserRepo.findOne.mockResolvedValue({ id: 'w1', email: 'w@test.com' });
      mockWelperProfileRepo.findOne.mockResolvedValue({
        welperId: 'w1',
        stripeConnectAccountId: 'acct_1',
        payoutMethodChoice: PayoutMethodChoice.STRIPE,
      });

      await service.buildDraftBatch('2026-06-06');

      expect(mockBatchRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: PayoutBatchStatus.REVIEW,
          bookingCount: 1,
        }),
      );
      expect(mockLedgerRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: WelperPayoutLedgerStatus.SCHEDULED,
          payoutBatchId: 'batch-1',
        }),
      );
    });
  });
});
