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
import { PayoutBatchStatus, WelperPayoutLedgerStatus } from './entities/payout-ledger-status.enum';
import { PayoutMethodChoice } from '../profile-management/entities/payout-method-choice.enum';
import * as payoutEligibility from './payout-eligibility';
import { buildTransferIdempotencyKey } from './payout-idempotency.util';
import { StripeOperationsService } from './stripe-operations.service';
import { NotificationService } from '../notification/notification.service';

describe('PayoutBatchService', () => {
  let service: PayoutBatchService;
  const transfersCreate = jest.fn();

  const mockBatchRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((x) => ({ id: 'batch-1', ...x })),
    save: jest.fn(async (x) => x),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const mockLedgerRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(async (x) => x),
    update: jest.fn(),
  };
  const mockWelperProfileRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
  };
  const mockUserRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
  };
  const mockBookingRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
  };
  const mockLedgerService = {
    releaseScheduledLinesFromBatch: jest.fn(),
    refreshPendingStripeFees: jest.fn(),
  };
  const mockStripeConnect = {
    getStatus: jest.fn().mockResolvedValue({ onboardingComplete: true, payoutsEnabled: true }),
  };
  const mockStripeOperations = {
    syncTransfer: jest.fn().mockResolvedValue(undefined),
  };

  const scheduledLine = {
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
    stripeTransferId: null,
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  function mockApproveTransaction(lines = [scheduledLine]) {
    mockDataSource.transaction.mockImplementation(async (fn) =>
      fn({
        getRepository: jest.fn((entity) => {
          if (entity === PayoutBatch) {
            return {
              findOne: jest.fn().mockResolvedValue({
                id: 'batch-1',
                status: PayoutBatchStatus.REVIEW,
                payoutDate: '2026-06-08',
              }),
              save: jest.fn(async (x) => x),
            };
          }
          if (entity === WelperPayoutLedger) {
            return {
              find: jest.fn().mockResolvedValue(lines),
              findOne: jest.fn(),
              save: jest.fn(async (line) => line),
              createQueryBuilder: jest.fn(() => ({
                setLock: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(lines),
              })),
            };
          }
          if (entity === BookingRequest) {
            return {
              findOne: jest.fn().mockResolvedValue({
                id: 'b1',
                status: BookingRequestStatus.PAYMENT_RELEASED,
              }),
              createQueryBuilder: jest.fn(() => ({
                setLock: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([{ id: 'b1', status: BookingRequestStatus.PAYMENT_RELEASED }]),
              })),
            };
          }
          return {};
        }),
      }),
    );
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    scheduledLine.status = WelperPayoutLedgerStatus.SCHEDULED;
    scheduledLine.stripeTransferId = null;
    scheduledLine.payoutBatchId = 'batch-1';
    jest.spyOn(payoutEligibility, 'isPayoutDateReached').mockReturnValue(true);
    transfersCreate.mockResolvedValue({ id: 'tr_test_1' });
    mockStripeConnect.getStatus.mockResolvedValue({
      onboardingComplete: true,
      payoutsEnabled: true,
    });

    mockUserRepo.find.mockResolvedValue([{ id: 'w1', email: 'welper@test.com' }]);
    mockWelperProfileRepo.find.mockResolvedValue([
      {
        welperId: 'w1',
        stripeConnectAccountId: 'acct_real_123',
        payoutMethodChoice: PayoutMethodChoice.STRIPE,
      },
    ]);
    mockBookingRepo.find.mockResolvedValue([{ id: 'b1', status: BookingRequestStatus.PAYMENT_RELEASED }]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayoutBatchService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((k: string) => (k === 'STRIPE_SECRET_KEY' ? 'sk_test' : undefined)),
          },
        },
        { provide: DataSource, useValue: mockDataSource },
        { provide: getRepositoryToken(PayoutBatch), useValue: mockBatchRepo },
        {
          provide: getRepositoryToken(WelperPayoutLedger),
          useValue: mockLedgerRepo,
        },
        {
          provide: getRepositoryToken(WelperProfile),
          useValue: mockWelperProfileRepo,
        },
        { provide: getRepositoryToken(UserAccount), useValue: mockUserRepo },
        {
          provide: getRepositoryToken(BookingRequest),
          useValue: mockBookingRepo,
        },
        { provide: WelperPayoutLedgerService, useValue: mockLedgerService },
        { provide: StripeConnectService, useValue: mockStripeConnect },
        { provide: StripeOperationsService, useValue: mockStripeOperations },
        {
          provide: NotificationService,
          useValue: {
            resolveLocaleForUser: jest.fn().mockResolvedValue('en'),
            emitForUser: jest.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();

    service = module.get(PayoutBatchService);
    (service as unknown as { stripe: { transfers: { create: jest.Mock } } }).stripe = {
      transfers: { create: transfersCreate },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('approveAndExecute', () => {
    it('rejects when the payout date has not been reached', async () => {
      jest.spyOn(payoutEligibility, 'isPayoutDateReached').mockReturnValue(false);
      mockBatchRepo.findOne.mockResolvedValue({
        id: 'batch-1',
        status: PayoutBatchStatus.REVIEW,
        payoutDate: '2026-06-08',
      });

      await expect(service.approveAndExecute('batch-1', 'admin-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(transfersCreate).not.toHaveBeenCalled();
    });

    it('rejects when welpers are not Connect-ready', async () => {
      mockBatchRepo.findOne.mockResolvedValue({
        id: 'batch-1',
        status: PayoutBatchStatus.REVIEW,
        payoutDate: '2026-06-08',
      });
      mockApproveTransaction();
      mockLedgerRepo.find.mockResolvedValue([scheduledLine]);
      mockWelperProfileRepo.findOne.mockResolvedValue({
        welperId: 'w1',
        stripeConnectAccountId: null,
        payoutMethodChoice: PayoutMethodChoice.STRIPE,
      });
      mockWelperProfileRepo.find.mockResolvedValue([
        {
          welperId: 'w1',
          stripeConnectAccountId: null,
          payoutMethodChoice: PayoutMethodChoice.STRIPE,
        },
      ]);
      mockStripeConnect.getStatus.mockResolvedValue({
        onboardingComplete: false,
        payoutsEnabled: false,
      });

      await expect(service.approveAndExecute('batch-1', 'admin-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(transfersCreate).not.toHaveBeenCalled();
    });

    it('rejects when Connect onboarding is complete but payouts are disabled', async () => {
      mockBatchRepo.findOne.mockResolvedValue({
        id: 'batch-1',
        status: PayoutBatchStatus.REVIEW,
        payoutDate: '2026-06-08',
      });
      mockApproveTransaction();
      mockLedgerRepo.find.mockResolvedValue([scheduledLine]);
      mockStripeConnect.getStatus.mockResolvedValueOnce({
        onboardingComplete: true,
        payoutsEnabled: false,
      });

      await expect(service.approveAndExecute('batch-1', 'admin-1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates Stripe transfers per welper when Connect-ready', async () => {
      mockBatchRepo.findOne.mockResolvedValue({
        id: 'batch-1',
        status: PayoutBatchStatus.REVIEW,
        payoutDate: '2026-06-08',
      });
      mockApproveTransaction();
      mockLedgerRepo.find.mockResolvedValue([scheduledLine]);
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
        expect.objectContaining({
          idempotencyKey: buildTransferIdempotencyKey('w1', ['l1']),
        }),
      );
      expect(result.welpers[0]?.welperNetCents).toBe(10000);
      expect(result.welpers[0]?.lines[0]?.status).toBe(WelperPayoutLedgerStatus.TRANSFERRED);
    });

    it('does not transfer when a dispute wins the booking lock first', async () => {
      mockBatchRepo.findOne.mockResolvedValue({
        id: 'batch-1',
        status: PayoutBatchStatus.REVIEW,
        payoutDate: '2026-06-08',
      });
      mockApproveTransaction();
      mockLedgerRepo.find.mockResolvedValue([scheduledLine]);
      mockWelperProfileRepo.findOne.mockResolvedValue({
        welperId: 'w1',
        stripeConnectAccountId: 'acct_real_123',
        payoutMethodChoice: PayoutMethodChoice.STRIPE,
      });

      const originalTransaction = mockDataSource.transaction.getMockImplementation()!;
      let transactionNumber = 0;
      mockDataSource.transaction.mockImplementation(async (fn) => {
        transactionNumber += 1;
        if (transactionNumber === 1) {
          return originalTransaction(fn);
        }
        return fn({
          getRepository: jest.fn((entity) => {
            if (entity === BookingRequest) {
              return {
                createQueryBuilder: jest.fn(() => ({
                  setLock: jest.fn().mockReturnThis(),
                  where: jest.fn().mockReturnThis(),
                  orderBy: jest.fn().mockReturnThis(),
                  getMany: jest.fn().mockResolvedValue([{ id: 'b1', status: BookingRequestStatus.DISPUTED }]),
                })),
              };
            }
            if (entity === WelperPayoutLedger) {
              return {
                createQueryBuilder: jest.fn(() => ({
                  setLock: jest.fn().mockReturnThis(),
                  where: jest.fn().mockReturnThis(),
                  orderBy: jest.fn().mockReturnThis(),
                  getMany: jest.fn().mockResolvedValue([scheduledLine]),
                })),
              };
            }
            return {};
          }),
        });
      });

      const result = await service.approveAndExecute('batch-1', 'admin-1');

      expect(transfersCreate).not.toHaveBeenCalled();
      expect(result.status).toBeDefined();
      expect(mockLedgerRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({ welperId: 'w1' }),
        expect.objectContaining({ status: WelperPayoutLedgerStatus.FAILED }),
      );
    });
  });

  describe('buildDraftBatch', () => {
    it('schedules eligible pending ledger lines', async () => {
      const monday = '2026-06-08';
      const txBatchRepo = {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn((x) => ({ id: 'batch-1', ...x })),
        save: jest.fn(async (x) => x),
        remove: jest.fn(),
      };
      const txLedgerRepo = {
        update: jest.fn().mockResolvedValue(undefined),
        findOne: jest.fn(),
        save: jest.fn(async (x) => x),
        createQueryBuilder: jest.fn(() => ({
          setLock: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([
            {
              id: 'l1',
              welperId: 'w1',
              bookingId: 'b1',
              customerId: 'c1',
              paymentReleasedAt: new Date('2026-05-20T12:00:00.000Z'),
              customerSubtotalCents: 6250,
              customerTaxCents: 813,
              customerTotalCents: 7063,
              welperGrossCents: 5000,
              welperRefundCents: 0,
              welperNetCents: 5000,
              platformGrossCents: 1250,
              stripeFeeCents: 80,
              status: WelperPayoutLedgerStatus.PENDING,
              exclusionReason: null,
            },
          ]),
        })),
      };
      const txBookingRepo = {
        createQueryBuilder: jest.fn(() => ({
          setLock: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([
            {
              id: 'b1',
              status: BookingRequestStatus.PAYMENT_RELEASED,
            },
          ]),
        })),
      };

      mockDataSource.transaction.mockImplementation(async (fn) =>
        fn({
          update: jest.fn().mockResolvedValue(undefined),
          getRepository: jest.fn((entity) => {
            if (entity === PayoutBatch) return txBatchRepo;
            if (entity === WelperPayoutLedger) return txLedgerRepo;
            if (entity === BookingRequest) return txBookingRepo;
            return {};
          }),
        }),
      );

      const line = {
        id: 'l1',
        welperId: 'w1',
        bookingId: 'b1',
        customerId: 'c1',
        paymentReleasedAt: new Date('2026-05-20T12:00:00.000Z'),
        customerSubtotalCents: 6250,
        customerTaxCents: 813,
        customerTotalCents: 7063,
        welperGrossCents: 5000,
        welperRefundCents: 0,
        welperNetCents: 5000,
        platformGrossCents: 1250,
        stripeFeeCents: 80,
        status: WelperPayoutLedgerStatus.PENDING,
        exclusionReason: null,
      };
      mockLedgerRepo.find.mockResolvedValue([line]);
      mockBookingRepo.findOne.mockResolvedValue({
        id: 'b1',
        status: BookingRequestStatus.PAYMENT_RELEASED,
      });
      mockBatchRepo.findOne.mockResolvedValue({
        id: 'batch-1',
        payoutDate: monday,
        status: PayoutBatchStatus.REVIEW,
        bookingCount: 1,
        welperCount: 1,
        totalWelperNetCents: 5000,
        totalPlatformGrossCents: 1250,
        totalStripeFeeCents: 80,
        totalCustomerCapturedCents: 7000,
        executionSummary: null,
        approvedBy: null,
        approvedAt: null,
        executedAt: null,
      });
      mockLedgerRepo.find.mockImplementation(async (opts) => {
        if (opts?.where?.payoutBatchId === 'batch-1') {
          return [
            {
              ...line,
              status: WelperPayoutLedgerStatus.SCHEDULED,
              payoutBatchId: 'batch-1',
            },
          ];
        }
        return [line];
      });

      mockUserRepo.find.mockResolvedValue([{ id: 'w1', email: 'welper@test.com' }]);
      mockWelperProfileRepo.find.mockResolvedValue([
        {
          welperId: 'w1',
          stripeConnectAccountId: 'acct_1',
          payoutMethodChoice: PayoutMethodChoice.STRIPE,
        },
      ]);

      const result = await service.buildDraftBatch(monday);

      expect(result.id).toBe('batch-1');

      expect(txBatchRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: PayoutBatchStatus.REVIEW,
          bookingCount: 1,
        }),
      );
      expect(txLedgerRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: WelperPayoutLedgerStatus.SCHEDULED,
          payoutBatchId: 'batch-1',
        }),
      );
    });

    it('rejects non-Monday payout dates', async () => {
      await expect(service.buildDraftBatch('2026-06-06')).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  it('delegates manual Stripe fee refresh to the payout ledger service', async () => {
    mockLedgerService.refreshPendingStripeFees.mockResolvedValue({
      scanned: 3,
      recovered: 2,
      stillPending: 1,
    });

    await expect(service.refreshPendingStripeFees()).resolves.toEqual({
      scanned: 3,
      recovered: 2,
      stillPending: 1,
    });
  });
});
