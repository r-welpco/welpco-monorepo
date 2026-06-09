import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DisputeService } from './dispute.service';
import { Dispute } from './entities/dispute.entity';
import { Resolution } from './entities/resolution.entity';
import { BookingRequest, BookingRequestStatus } from '../booking/entities/booking-request.entity';
import { PaymentService } from '../payment/payment.service';
import { WelperPayoutLedgerService } from '../payment/welper-payout-ledger.service';
import { ApplicationSettingsService } from '../payment/application-settings.service';
import { AdminAuditService } from '../user-management/admin/admin-audit.service';
import { S3UrlPresignerService } from '../../clients/s3';
import { UserAccount } from '../user-management/entities/user-account.entity';
import { CustomerProfile } from '../profile-management/entities/customer-profile.entity';
import { WelperProfile } from '../profile-management/entities/welper-profile.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationCategory } from '../notification/entities';
import { Message } from '../communication/entities';

describe('DisputeService', () => {
  let service: DisputeService;
  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      getRepository: jest.fn(),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => mockQueryRunner),
  };

  const mockDisputeRepo = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockResolutionRepo = {
    findOne: jest.fn(),
    save: jest.fn(async (resolution: Resolution) => resolution),
  };

  const mockBookingRepo = {
    findOne: jest.fn(),
  };

  const mockPaymentService = {
    refundCapturedAmount: jest.fn().mockResolvedValue({ ok: true, refundsCreated: 1 }),
    getTotalCapturedForBooking: jest.fn().mockResolvedValue({ totalCents: 10_000, currency: 'cad' }),
  };

  const mockApplicationSettings = {
    getDisputeReportWindowMinutes: jest.fn().mockResolvedValue(10),
  };

  // DISPUTES-001 (Day 16): hoist the presigner mock so the new evidence-presign
  // describe block can flip its config / signing return values per case.
  const mockS3Presigner = {
    isConfigured: jest.fn().mockReturnValue(false),
    getTtlSeconds: jest.fn().mockReturnValue(900),
    presignGet: jest.fn().mockResolvedValue(null),
    presignGetMany: jest.fn().mockResolvedValue([]),
    presignPut: jest.fn().mockResolvedValue(null),
  };

  const mockUserAccountRepo = { findOne: jest.fn().mockResolvedValue(null) };
  const mockCustomerProfileRepo = {
    findOne: jest.fn().mockResolvedValue(null),
  };
  const mockWelperProfileRepo = { findOne: jest.fn().mockResolvedValue(null) };
  const mockMessageRepo = {
    createQueryBuilder: jest.fn(),
  };

  // NOTIFICATIONS-001 (Day 16 dispatch 2): DisputeService now emits to the
  // counterparty on create, both parties on resolution, counterparty on
  // withdraw. Mock returns null (skipped) by default; tests assert the call
  // shape where it's the contract under test.
  const mockNotificationService = {
    emitForUser: jest.fn().mockResolvedValue(null),
  };

  const createDto = {
    subject: 'Issue with service',
    category: 'quality' as const,
    description: 'Details here',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    // Reset presigner defaults — individual cases override as needed.
    mockS3Presigner.isConfigured.mockReturnValue(false);
    mockS3Presigner.getTtlSeconds.mockReturnValue(900);
    mockS3Presigner.presignGet.mockResolvedValue(null);
    mockS3Presigner.presignGetMany.mockResolvedValue([]);
    mockS3Presigner.presignPut.mockResolvedValue(null);
    mockQueryRunner.connect.mockResolvedValue(undefined);
    mockQueryRunner.startTransaction.mockResolvedValue(undefined);
    mockQueryRunner.commitTransaction.mockResolvedValue(undefined);
    mockQueryRunner.rollbackTransaction.mockResolvedValue(undefined);
    mockQueryRunner.release.mockResolvedValue(undefined);
    mockResolutionRepo.save.mockImplementation(async (resolution: Resolution) => resolution);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisputeService,
        { provide: getRepositoryToken(Dispute), useValue: mockDisputeRepo },
        {
          provide: getRepositoryToken(Resolution),
          useValue: mockResolutionRepo,
        },
        {
          provide: getRepositoryToken(BookingRequest),
          useValue: mockBookingRepo,
        },
        {
          provide: getRepositoryToken(UserAccount),
          useValue: mockUserAccountRepo,
        },
        {
          provide: getRepositoryToken(CustomerProfile),
          useValue: mockCustomerProfileRepo,
        },
        {
          provide: getRepositoryToken(WelperProfile),
          useValue: mockWelperProfileRepo,
        },
        { provide: getRepositoryToken(Message), useValue: mockMessageRepo },
        { provide: DataSource, useValue: mockDataSource },
        { provide: PaymentService, useValue: mockPaymentService },
        {
          provide: WelperPayoutLedgerService,
          useValue: {
            excludeForDispute: jest.fn().mockResolvedValue(null),
            restoreAfterDisputeResolved: jest.fn().mockResolvedValue(undefined),
            recalculateBatchTotals: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: ApplicationSettingsService,
          useValue: mockApplicationSettings,
        },
        {
          provide: AdminAuditService,
          useValue: { record: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: S3UrlPresignerService,
          useValue: mockS3Presigner,
        },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<DisputeService>(DisputeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    function setupTxMocks(opts: {
      booking: BookingRequest | null;
      existingOpenDispute?: Dispute | null;
      saveDisputeImpl?: (d: Dispute) => Promise<Dispute>;
    }) {
      const bookingQb = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(opts.booking),
      };
      const openDisputeQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(opts.existingOpenDispute ?? null),
      };
      const disputeSave = jest.fn().mockImplementation(
        opts.saveDisputeImpl ??
          ((d: Dispute) =>
            Promise.resolve({
              ...d,
              id: 'dispute-new',
              createdAt: new Date('2026-03-01T12:00:00.000Z'),
              updatedAt: new Date('2026-03-01T12:00:00.000Z'),
            })),
      );
      const bookingSave = jest.fn().mockImplementation((b: BookingRequest) => Promise.resolve(b));
      const disputeCreate = jest.fn((partial: Partial<Dispute>) => ({ ...partial }) as Dispute);

      mockQueryRunner.manager.getRepository.mockImplementation((entity: unknown) => {
        if (entity === BookingRequest) {
          return {
            createQueryBuilder: jest.fn().mockReturnValue(bookingQb),
            save: bookingSave,
          };
        }
        if (entity === Dispute) {
          return {
            createQueryBuilder: jest.fn().mockReturnValue(openDisputeQb),
            create: disputeCreate,
            save: disputeSave,
          };
        }
        return {};
      });
    }

    it('creates dispute and sets booking to disputed', async () => {
      const booking = {
        id: 'booking-1',
        customerId: 'cust-1',
        welperId: 'welp-1',
        status: BookingRequestStatus.IN_PROGRESS,
      } as BookingRequest;

      setupTxMocks({ booking });

      const result = await service.create('booking-1', 'cust-1', 'Customer', createDto);

      expect(result.id).toBe('dispute-new');
      expect(result.status).toBe('open');
      expect(result.bookingId).toBe('booking-1');
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(booking.status).toBe(BookingRequestStatus.DISPUTED);
    });

    it('NOTIFICATIONS-001: emits a DISPUTE notification to the COUNTERPARTY (welper) when customer files', async () => {
      const booking = {
        id: 'booking-1',
        customerId: 'cust-1',
        welperId: 'welp-1',
        status: BookingRequestStatus.IN_PROGRESS,
      } as BookingRequest;
      setupTxMocks({ booking });

      await service.create('booking-1', 'cust-1', 'Customer', createDto);

      expect(mockNotificationService.emitForUser).toHaveBeenCalledTimes(1);
      const [recipient, params] = mockNotificationService.emitForUser.mock.calls[0]!;
      expect(recipient).toBe('welp-1'); // counterparty, NOT the filer
      expect(params.category).toBe(NotificationCategory.DISPUTE);
      expect(params.disputeEmailType).toBe('dispute_filed');
      expect(params.disputeEmailVariables).toMatchObject({
        subject: createDto.subject,
      });
      expect(params.metadata).toMatchObject({
        disputeId: 'dispute-new',
        bookingId: 'booking-1',
        status: 'open',
      });
    });

    it('NOTIFICATIONS-001: emits to the customer when WELPER files (recipient flips)', async () => {
      const booking = {
        id: 'booking-1',
        customerId: 'cust-1',
        welperId: 'welp-1',
        status: BookingRequestStatus.IN_PROGRESS,
      } as BookingRequest;
      setupTxMocks({ booking });

      await service.create('booking-1', 'welp-1', 'Welper', createDto);

      const [recipient] = mockNotificationService.emitForUser.mock.calls[0]!;
      expect(recipient).toBe('cust-1');
    });

    it('NOTIFICATIONS-001: a notification emit failure does not crash the create write', async () => {
      const booking = {
        id: 'booking-1',
        customerId: 'cust-1',
        welperId: 'welp-1',
        status: BookingRequestStatus.IN_PROGRESS,
      } as BookingRequest;
      setupTxMocks({ booking });
      mockNotificationService.emitForUser.mockRejectedValueOnce(new Error('email service down'));

      await expect(service.create('booking-1', 'cust-1', 'Customer', createDto)).resolves.toMatchObject({
        status: 'open',
      });
    });

    it('throws NotFoundException when booking missing', async () => {
      setupTxMocks({ booking: null });

      await expect(service.create('missing', 'cust-1', 'Customer', createDto)).rejects.toThrow(NotFoundException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is not a participant', async () => {
      const booking = {
        id: 'booking-1',
        customerId: 'cust-1',
        welperId: 'welp-1',
        status: BookingRequestStatus.IN_PROGRESS,
      } as BookingRequest;

      setupTxMocks({ booking });

      await expect(service.create('booking-1', 'stranger', 'Customer', createDto)).rejects.toThrow(ForbiddenException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('throws BadRequestException when transition to disputed is invalid', async () => {
      const booking = {
        id: 'booking-1',
        customerId: 'cust-1',
        welperId: 'welp-1',
        status: BookingRequestStatus.PENDING,
      } as BookingRequest;

      setupTxMocks({ booking });

      await expect(service.create('booking-1', 'cust-1', 'Customer', createDto)).rejects.toThrow(BadRequestException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    /**
     * DISPUTES-001 (Day 16): the dispute create path must accept and persist
     * the evidence array after ownership validation. This case locks the
     * persisted evidence contract in.
     */
    it('persists evidence array verbatim when supplied', async () => {
      const booking = {
        id: 'booking-1',
        customerId: 'cust-1',
        welperId: 'welp-1',
        status: BookingRequestStatus.IN_PROGRESS,
      } as BookingRequest;
      let captured: Partial<Dispute> | null = null;
      setupTxMocks({
        booking,
        saveDisputeImpl: (d: Dispute) => {
          captured = d;
          return Promise.resolve({
            ...d,
            id: 'dispute-with-evidence',
            createdAt: new Date('2026-05-05T10:00:00.000Z'),
            updatedAt: new Date('2026-05-05T10:00:00.000Z'),
          });
        },
      });

      const evidence = [
        { type: 'file' as const, key: 'disputes/cust-1/uuid-1.jpg' },
        { type: 'file' as const, key: 'disputes/cust-1/uuid-2.pdf' },
      ];

      await service.create('booking-1', 'cust-1', 'Customer', {
        ...createDto,
        evidence,
      });

      expect(captured).not.toBeNull();
      expect(captured!.evidence).toEqual(evidence);
    });

    it('rejects message evidence that is not part of the booking chat', async () => {
      const booking = {
        id: 'booking-1',
        customerId: 'cust-1',
        welperId: 'welp-1',
        status: BookingRequestStatus.IN_PROGRESS,
      } as BookingRequest;
      setupTxMocks({ booking });

      const messageEvidenceQb = {
        innerJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      mockMessageRepo.createQueryBuilder.mockReturnValue(messageEvidenceQb);

      await expect(
        service.create('booking-1', 'cust-1', 'Customer', {
          ...createDto,
          evidence: [{ type: 'message', id: 'message-from-other-booking' }],
        }),
      ).rejects.toThrow('Message evidence must belong to this booking');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('persists null evidence when none supplied (empty reports allowed)', async () => {
      const booking = {
        id: 'booking-1',
        customerId: 'cust-1',
        welperId: 'welp-1',
        status: BookingRequestStatus.IN_PROGRESS,
      } as BookingRequest;
      let captured: Partial<Dispute> | null = null;
      setupTxMocks({
        booking,
        saveDisputeImpl: (d: Dispute) => {
          captured = d;
          return Promise.resolve({
            ...d,
            id: 'dispute-no-evidence',
            createdAt: new Date('2026-05-05T10:00:00.000Z'),
            updatedAt: new Date('2026-05-05T10:00:00.000Z'),
          });
        },
      });

      await service.create('booking-1', 'cust-1', 'Customer', createDto);

      expect(captured).not.toBeNull();
      expect(captured!.evidence).toBeNull();
    });

    it('throws ConflictException when open dispute exists', async () => {
      const booking = {
        id: 'booking-1',
        customerId: 'cust-1',
        welperId: 'welp-1',
        status: BookingRequestStatus.IN_PROGRESS,
      } as BookingRequest;

      setupTxMocks({
        booking,
        existingOpenDispute: { id: 'existing' } as Dispute,
      });

      await expect(service.create('booking-1', 'cust-1', 'Customer', createDto)).rejects.toThrow(ConflictException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('throws BadRequestException when the post-completion report window has closed', async () => {
      const completedAt = new Date('2026-05-30T10:00:00.000Z');
      const booking = {
        id: 'booking-1',
        customerId: 'cust-1',
        welperId: 'welp-1',
        status: BookingRequestStatus.COMPLETED,
        completedAt,
        updatedAt: completedAt,
      } as BookingRequest;

      setupTxMocks({ booking });
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-05-30T10:11:00.000Z'));

      await expect(service.create('booking-1', 'cust-1', 'Customer', createDto)).rejects.toThrow(BadRequestException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('createResolution', () => {
    const adminId = 'admin-1';
    const baseDispute = {
      id: 'dispute-1',
      bookingId: 'booking-1',
      status: 'open',
    } as Dispute;

    function freshDisputedBooking(): BookingRequest {
      return {
        id: 'booking-1',
        customerId: 'cust-1',
        welperId: 'welp-1',
        status: BookingRequestStatus.DISPUTED,
        cancelledAt: null,
        cancelledBy: null,
        cancellationReason: null,
      } as BookingRequest;
    }

    function setupResolutionTxMocks(opts: {
      dispute: Dispute | null;
      disputeStatus?: string;
      existingResolution?: Resolution | null;
      booking?: BookingRequest | null;
    }) {
      const d = opts.dispute
        ? ({
            ...opts.dispute,
            status: opts.disputeStatus ?? opts.dispute.status,
          } as Dispute)
        : null;

      const disputeQb = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(d),
      };

      const defaultBooking = opts.booking !== undefined ? opts.booking : freshDisputedBooking();
      const bookingQb = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(defaultBooking),
      };

      const resolutionFindOne = jest.fn().mockResolvedValue(opts.existingResolution ?? null);
      const resolutionCreate = jest.fn((partial: Partial<Resolution>) => ({ ...partial }) as Resolution);
      const resolutionSave = jest.fn().mockImplementation((r: Resolution) =>
        Promise.resolve({
          ...r,
          id: 'res-1',
          resolvedAt: new Date('2026-03-02T15:00:00.000Z'),
        }),
      );
      const disputeSave = jest.fn().mockImplementation((x: Dispute) => Promise.resolve(x));
      const bookingSave = jest.fn().mockImplementation((b: BookingRequest) => Promise.resolve(b));

      mockQueryRunner.manager.getRepository.mockImplementation((entity: unknown) => {
        if (entity === Dispute) {
          return {
            createQueryBuilder: jest.fn().mockReturnValue(disputeQb),
            save: disputeSave,
          };
        }
        if (entity === Resolution) {
          return {
            findOne: resolutionFindOne,
            create: resolutionCreate,
            save: resolutionSave,
          };
        }
        if (entity === BookingRequest) {
          return {
            createQueryBuilder: jest.fn().mockReturnValue(bookingQb),
            save: bookingSave,
          };
        }
        return {};
      });
    }

    it('resolves with default completed outcome', async () => {
      setupResolutionTxMocks({ dispute: baseDispute });

      const result = await service.createResolution('dispute-1', adminId, {
        resolutionType: 'no_action',
      });

      expect(result.bookingId).toBe('booking-1');
      expect(result.bookingStatus).toBe('completed');
      expect(result.disputeId).toBe('dispute-1');
      expect(result.stripeRefund.status).toBe('not_applicable');
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('resolves with cancelled outcome and sets cancel fields', async () => {
      setupResolutionTxMocks({ dispute: baseDispute });

      const result = await service.createResolution('dispute-1', adminId, {
        resolutionType: 'refund',
        bookingOutcome: 'cancelled',
        notes: 'Full refund issued',
      });

      expect(result.bookingStatus).toBe('cancelled');
      const bookingRepo = mockQueryRunner.manager.getRepository(BookingRequest) as {
        save: jest.Mock;
      };
      const saved = bookingRepo.save.mock.calls[0][0] as BookingRequest;
      expect(saved.status).toBe(BookingRequestStatus.CANCELLED);
      expect(saved.cancelledBy).toBe(adminId);
      expect(saved.cancellationReason).toBe('Full refund issued');
      expect(result.stripeRefund.status).toBe('succeeded');
      expect(mockPaymentService.refundCapturedAmount).toHaveBeenCalled();
      expect(mockResolutionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          refundStatus: 'succeeded',
          refundsCreated: 1,
        }),
      );
    });

    it('persists a partial Stripe refund outcome for admin follow-up', async () => {
      setupResolutionTxMocks({ dispute: baseDispute });
      mockPaymentService.refundCapturedAmount.mockResolvedValueOnce({
        ok: false,
        refundsCreated: 1,
        message: 'second charge failed',
        partialFailure: true,
      });

      const result = await service.createResolution('dispute-1', adminId, {
        resolutionType: 'refund',
        bookingOutcome: 'cancelled',
      });

      expect(result.stripeRefund.status).toBe('partial');
      expect(mockResolutionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          refundStatus: 'partial',
          refundMessage: 'second charge failed',
          refundsCreated: 1,
        }),
      );
    });

    it('does not roll back after post-commit outcome persistence fails', async () => {
      setupResolutionTxMocks({ dispute: baseDispute });
      mockResolutionRepo.save.mockRejectedValueOnce(new Error('database unavailable'));

      await expect(
        service.createResolution('dispute-1', adminId, {
          resolutionType: 'refund',
          bookingOutcome: 'cancelled',
        }),
      ).rejects.toThrow('database unavailable');

      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).not.toHaveBeenCalled();
    });

    it('uses default cancellation reason when cancelled without notes', async () => {
      setupResolutionTxMocks({ dispute: baseDispute });

      await service.createResolution('dispute-1', adminId, {
        resolutionType: 'closed',
        bookingOutcome: 'cancelled',
      });

      const bookingRepo = mockQueryRunner.manager.getRepository(BookingRequest) as {
        save: jest.Mock;
      };
      const saved = bookingRepo.save.mock.calls[0][0] as BookingRequest;
      expect(saved.cancellationReason).toBe('Resolved as cancelled (dispute)');
    });

    it('throws NotFoundException when dispute missing', async () => {
      setupResolutionTxMocks({ dispute: null });

      await expect(
        service.createResolution('missing', adminId, {
          resolutionType: 'no_action',
        }),
      ).rejects.toThrow(NotFoundException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('throws BadRequestException when dispute is not resolvable', async () => {
      setupResolutionTxMocks({
        dispute: baseDispute,
        disputeStatus: 'resolved',
      });

      await expect(
        service.createResolution('dispute-1', adminId, {
          resolutionType: 'no_action',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException when resolution already exists', async () => {
      setupResolutionTxMocks({
        dispute: baseDispute,
        existingResolution: { id: 'r1' } as Resolution,
      });

      await expect(
        service.createResolution('dispute-1', adminId, {
          resolutionType: 'no_action',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException when booking is not disputed', async () => {
      setupResolutionTxMocks({
        dispute: baseDispute,
        booking: {
          ...freshDisputedBooking(),
          status: BookingRequestStatus.COMPLETED,
        } as BookingRequest,
      });

      await expect(
        service.createResolution('dispute-1', adminId, {
          resolutionType: 'no_action',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('resolves when booking was already cancelled while dispute stayed open', async () => {
      setupResolutionTxMocks({
        dispute: baseDispute,
        booking: {
          ...freshDisputedBooking(),
          status: BookingRequestStatus.CANCELLED,
          cancelledAt: new Date('2026-03-01T10:00:00.000Z'),
          cancelledBy: 'cust-1',
        } as BookingRequest,
      });

      const result = await service.createResolution('dispute-1', adminId, {
        resolutionType: 'no_action',
      });

      expect(result.bookingStatus).toBe('cancelled');
      expect(result.stripeRefund.status).toBe('not_applicable');
      const bookingRepo = mockQueryRunner.manager.getRepository(BookingRequest) as {
        save: jest.Mock;
      };
      expect(bookingRepo.save).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when booking row missing', async () => {
      setupResolutionTxMocks({
        dispute: baseDispute,
        booking: null,
      });

      await expect(
        service.createResolution('dispute-1', adminId, {
          resolutionType: 'no_action',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when refund requested but nothing was captured', async () => {
      setupResolutionTxMocks({ dispute: baseDispute });
      mockPaymentService.getTotalCapturedForBooking.mockResolvedValueOnce(null);

      await expect(
        service.createResolution('dispute-1', adminId, {
          resolutionType: 'refund',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('throws BadRequestException when partial refund exceeds captured total', async () => {
      setupResolutionTxMocks({ dispute: baseDispute });
      mockPaymentService.getTotalCapturedForBooking.mockResolvedValueOnce({
        totalCents: 1000,
        currency: 'cad',
      });

      await expect(
        service.createResolution('dispute-1', adminId, {
          resolutionType: 'partial_refund',
          refundAmount: 50,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('retryResolutionRefund', () => {
    it('retries with the existing resolution idempotency key and persists success', async () => {
      mockDisputeRepo.findOne.mockResolvedValue({
        id: 'dispute-1',
        bookingId: 'booking-1',
      });
      mockResolutionRepo.findOne.mockResolvedValue({
        id: 'res-1',
        disputeId: 'dispute-1',
        resolutionType: 'partial_refund',
        refundAmount: 25,
        refundStatus: 'failed',
      });
      mockPaymentService.refundCapturedAmount.mockResolvedValueOnce({
        ok: true,
        refundsCreated: 1,
      });

      const result = await service.retryResolutionRefund('dispute-1', 'admin-1');

      expect(result.status).toBe('succeeded');
      expect(mockPaymentService.refundCapturedAmount).toHaveBeenCalledWith('booking-1', 'res-1', 2500);
      expect(mockResolutionRepo.save).toHaveBeenCalledWith(expect.objectContaining({ refundStatus: 'succeeded' }));
    });

    it('does not retry a successful refund', async () => {
      mockDisputeRepo.findOne.mockResolvedValue({
        id: 'dispute-1',
        bookingId: 'booking-1',
      });
      mockResolutionRepo.findOne.mockResolvedValue({
        id: 'res-1',
        disputeId: 'dispute-1',
        resolutionType: 'refund',
        refundStatus: 'succeeded',
      });

      await expect(service.retryResolutionRefund('dispute-1', 'admin-1')).rejects.toThrow(BadRequestException);
      expect(mockPaymentService.refundCapturedAmount).not.toHaveBeenCalled();
    });

    it('rejects a legacy partial refund with no valid amount', async () => {
      mockDisputeRepo.findOne.mockResolvedValue({
        id: 'dispute-1',
        bookingId: 'booking-1',
      });
      mockResolutionRepo.findOne.mockResolvedValue({
        id: 'res-1',
        disputeId: 'dispute-1',
        resolutionType: 'partial_refund',
        refundAmount: null,
        refundStatus: 'failed',
      });

      await expect(service.retryResolutionRefund('dispute-1', 'admin-1')).rejects.toThrow(
        'Partial refund amount is missing or invalid',
      );
      expect(mockPaymentService.refundCapturedAmount).not.toHaveBeenCalled();
    });
  });

  /**
   * Wave 2 (BFF): the filer-can-withdraw safety contract.
   */
  describe('withdraw', () => {
    function setupWithdrawTxMocks(opts: { dispute: Dispute | null; booking?: BookingRequest | null }) {
      const disputeQb = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(opts.dispute),
      };
      const bookingQb = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(opts.booking ?? null),
      };
      const disputeSave = jest.fn().mockImplementation((d: Dispute) =>
        Promise.resolve({
          ...d,
          createdAt: new Date('2026-04-01T10:00:00.000Z'),
          updatedAt: new Date('2026-04-01T11:00:00.000Z'),
        }),
      );
      const bookingSave = jest.fn().mockImplementation((b: BookingRequest) => Promise.resolve(b));

      mockQueryRunner.manager.getRepository.mockImplementation((entity: unknown) => {
        if (entity === Dispute) {
          return {
            createQueryBuilder: jest.fn().mockReturnValue(disputeQb),
            save: disputeSave,
          };
        }
        if (entity === BookingRequest) {
          return {
            createQueryBuilder: jest.fn().mockReturnValue(bookingQb),
            save: bookingSave,
          };
        }
        return {};
      });
      return { disputeSave, bookingSave };
    }

    function openDispute(): Dispute {
      return {
        id: 'dispute-1',
        bookingId: 'booking-1',
        filerId: 'cust-1',
        filerType: 'customer',
        category: 'quality',
        subject: 'Issue',
        description: null,
        status: 'open',
        evidence: null,
      } as Dispute;
    }

    it('filer withdraws an open dispute and booking is restored to COMPLETED', async () => {
      const dispute = openDispute();
      const booking = {
        id: 'booking-1',
        customerId: 'cust-1',
        welperId: 'welp-1',
        status: BookingRequestStatus.DISPUTED,
        completedAt: null,
      } as BookingRequest;
      const { bookingSave } = setupWithdrawTxMocks({ dispute, booking });

      const result = await service.withdraw('dispute-1', 'cust-1');

      expect(result.status).toBe('withdrawn');
      expect(booking.status).toBe(BookingRequestStatus.COMPLETED);
      expect(booking.completedAt).toBeInstanceOf(Date);
      expect(bookingSave).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('non-filer is rejected with ForbiddenException', async () => {
      const dispute = openDispute(); // filerId = cust-1
      setupWithdrawTxMocks({ dispute });

      await expect(service.withdraw('dispute-1', 'welp-1')).rejects.toThrow(ForbiddenException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('already-resolved dispute cannot be withdrawn', async () => {
      const dispute = {
        ...openDispute(),
        status: 'resolved' as const,
      } as Dispute;
      setupWithdrawTxMocks({ dispute });

      await expect(service.withdraw('dispute-1', 'cust-1')).rejects.toThrow(BadRequestException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('escalated dispute cannot be withdrawn (admin already involved)', async () => {
      const dispute = {
        ...openDispute(),
        status: 'escalated' as const,
      } as Dispute;
      setupWithdrawTxMocks({ dispute });

      await expect(service.withdraw('dispute-1', 'cust-1')).rejects.toThrow(BadRequestException);
    });

    it('missing dispute throws NotFoundException', async () => {
      setupWithdrawTxMocks({ dispute: null });

      await expect(service.withdraw('missing', 'cust-1')).rejects.toThrow(NotFoundException);
    });

    it('booking in non-DISPUTED status is left alone (no silent state change)', async () => {
      const dispute = openDispute();
      const booking = {
        id: 'booking-1',
        customerId: 'cust-1',
        welperId: 'welp-1',
        // Booking was already cancelled out of band; we should NOT flip it back.
        status: BookingRequestStatus.CANCELLED,
      } as BookingRequest;
      const { bookingSave } = setupWithdrawTxMocks({ dispute, booking });

      const result = await service.withdraw('dispute-1', 'cust-1');

      expect(result.status).toBe('withdrawn');
      expect(booking.status).toBe(BookingRequestStatus.CANCELLED);
      expect(bookingSave).not.toHaveBeenCalled();
    });
  });

  /**
   * DISPUTES-001 (Day 16): the evidence presign endpoint mints a 15-min PUT
   * URL for the FE to upload directly to S3. This describe block locks the
   * service-level contract — the controller is a thin pass-through, the DTO
   * handles content-type / size validation.
   */
  describe('presignEvidenceUpload', () => {
    it('returns a key namespaced by user + extension derived from filename', async () => {
      mockS3Presigner.isConfigured.mockReturnValue(true);
      mockS3Presigner.presignPut.mockResolvedValue('https://s3/upload-url');

      const result = await service.presignEvidenceUpload('user-42', {
        fileName: 'receipt.PDF',
        contentType: 'application/pdf',
        sizeBytes: 12345,
      });

      expect(result.uploadUrl).toBe('https://s3/upload-url');
      expect(result.contentType).toBe('application/pdf');
      expect(result.ttlSeconds).toBe(900);
      // Key shape: disputes/<userId>/<uuid>.<ext>
      expect(result.key).toMatch(/^disputes\/user-42\/[a-z0-9-]+\.pdf$/i);
      // Service hands the SAME key to the presigner (no rewriting between
      // signing and the response).
      expect(mockS3Presigner.presignPut).toHaveBeenCalledWith(result.key, 'application/pdf');
    });

    it('falls back to a content-type-derived extension when filename has none', async () => {
      mockS3Presigner.isConfigured.mockReturnValue(true);
      mockS3Presigner.presignPut.mockResolvedValue('https://s3/upload-url');

      const result = await service.presignEvidenceUpload('user-42', {
        fileName: 'screenshot',
        contentType: 'image/jpeg',
      });

      expect(result.key).toMatch(/^disputes\/user-42\/[a-z0-9-]+\.jpg$/i);
    });

    it('throws ServiceUnavailableException when presigner is not configured', async () => {
      mockS3Presigner.isConfigured.mockReturnValue(false);

      await expect(
        service.presignEvidenceUpload('user-42', {
          fileName: 'x.png',
          contentType: 'image/png',
        }),
      ).rejects.toThrow(ServiceUnavailableException);
      expect(mockS3Presigner.presignPut).not.toHaveBeenCalled();
    });

    it('throws ServiceUnavailableException when signing returns null', async () => {
      mockS3Presigner.isConfigured.mockReturnValue(true);
      mockS3Presigner.presignPut.mockResolvedValue(null);

      await expect(
        service.presignEvidenceUpload('user-42', {
          fileName: 'x.png',
          contentType: 'image/png',
        }),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('isolates per-user namespace (a stolen key cannot reach another user)', async () => {
      mockS3Presigner.isConfigured.mockReturnValue(true);
      mockS3Presigner.presignPut.mockResolvedValue('https://s3/url');

      const a = await service.presignEvidenceUpload('alice', {
        fileName: 'a.jpg',
        contentType: 'image/jpeg',
      });
      const b = await service.presignEvidenceUpload('bob', {
        fileName: 'b.jpg',
        contentType: 'image/jpeg',
      });

      expect(a.key.startsWith('disputes/alice/')).toBe(true);
      expect(b.key.startsWith('disputes/bob/')).toBe(true);
      expect(a.key).not.toEqual(b.key);
    });

    it('rejects suspicious filename extensions (sanitised → fallback to mime)', async () => {
      mockS3Presigner.isConfigured.mockReturnValue(true);
      mockS3Presigner.presignPut.mockResolvedValue('https://s3/url');

      // 9-char extension is over the 8-char cap — service falls back to mime.
      const result = await service.presignEvidenceUpload('user-42', {
        fileName: 'oddfile.verylongext',
        contentType: 'image/png',
      });

      expect(result.key).toMatch(/\.png$/);
    });
  });
});
