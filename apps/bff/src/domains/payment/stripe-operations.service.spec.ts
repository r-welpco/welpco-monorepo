import { ConfigService } from '@nestjs/config';
import type Stripe from 'stripe';
import { StripeOperationsService } from './stripe-operations.service';

describe('StripeOperationsService', () => {
  const bookingPaymentRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(async (value) => value),
  };
  const bookingRefundRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
    createQueryBuilder: jest.fn(),
  };
  const recoveryTaskRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
  };
  const transferStateRepo = {
    findOne: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
  };
  const bookingRepo = { findOne: jest.fn(), save: jest.fn() };
  const receiptRepo = { findOne: jest.fn(), save: jest.fn(), createQueryBuilder: jest.fn() };
  const resolutionRepo = {
    findOne: jest.fn(),
    save: jest.fn(async (value) => value),
    createQueryBuilder: jest.fn(),
  };
  const disputeRepo = {
    findOne: jest.fn(),
    save: jest.fn(async (value) => value),
  };
  const ledgerRepo = { findOne: jest.fn() };
  const ledgerService = {
    applyRefundDelta: jest.fn(),
    createLedgerForPaymentReleased: jest.fn(),
    restoreAfterDisputeResolved: jest.fn(),
  };
  const notificationService = { emitForUser: jest.fn() };
  let service: StripeOperationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new StripeOperationsService(
      { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService,
      bookingPaymentRepo as never,
      bookingRefundRepo as never,
      recoveryTaskRepo as never,
      transferStateRepo as never,
      bookingRepo as never,
      receiptRepo as never,
      resolutionRepo as never,
      disputeRepo as never,
      ledgerRepo as never,
      ledgerService as never,
      notificationService as never,
    );
  });

  it('keeps partial refunds open until the decision target is reached', async () => {
    const dispute = { id: 'd1', bookingId: 'b1', status: 'awaiting_refund' };
    const resolution = {
      id: 'r1',
      disputeId: 'd1',
      refundBaselineCents: 100,
      refundTargetCents: 1000,
    };
    disputeRepo.findOne.mockResolvedValue(dispute);
    resolutionRepo.findOne.mockResolvedValue(resolution);
    bookingRefundRepo.find.mockResolvedValue([{ amountCents: 600 }]);

    await service.reconcileRefundWorkflow('b1');

    expect(resolutionRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        refundConfirmedCents: 500,
        refundStatus: 'pending',
        workflowStatus: 'awaiting_refund',
      }),
    );
    expect(disputeRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'awaiting_refund' }));
  });

  it('records an over-refund as a finance exception and does not finalize the dispute', async () => {
    const dispute = { id: 'd1', bookingId: 'b1', status: 'awaiting_refund' };
    const resolution = {
      id: 'r1',
      disputeId: 'd1',
      refundBaselineCents: 0,
      refundTargetCents: 1000,
    };
    disputeRepo.findOne.mockResolvedValue(dispute);
    resolutionRepo.findOne.mockResolvedValue(resolution);
    bookingRefundRepo.find.mockResolvedValue([{ amountCents: 1200 }]);

    await service.reconcileRefundWorkflow('b1');

    expect(resolutionRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        workflowStatus: 'exception',
        refundException: expect.stringContaining('200 cents'),
      }),
    );
    expect(bookingRepo.save).not.toHaveBeenCalled();
  });

  it('allocates transfer reversal deltas oldest-first and ignores duplicate events', async () => {
    let transferState: Record<string, unknown> | null = null;
    transferStateRepo.findOne.mockImplementation(async () => transferState);
    transferStateRepo.save.mockImplementation(async (value) => {
      transferState = value;
      return value;
    });
    const oldest = {
      id: 't1',
      resolutionId: 'r1',
      requiredReversalCents: 600,
      recoveredCents: 0,
      status: 'open',
      completedAt: null,
    };
    const newest = {
      id: 't2',
      resolutionId: 'r2',
      requiredReversalCents: 600,
      recoveredCents: 0,
      status: 'open',
      completedAt: null,
    };
    recoveryTaskRepo.find.mockResolvedValue([oldest, newest]);
    resolutionRepo.findOne.mockResolvedValue(null);
    const transfer = {
      id: 'tr_1',
      amount: 2000,
      amount_reversed: 900,
      destination: 'acct_1',
      metadata: {},
      transfer_group: null,
    } as unknown as Stripe.Transfer;

    await service.syncTransfer(transfer);
    await service.syncTransfer(transfer);

    expect(oldest.recoveredCents).toBe(600);
    expect(oldest.status).toBe('completed');
    expect(newest.recoveredCents).toBe(300);
    expect(newest.status).toBe('partial');
    expect(recoveryTaskRepo.find).toHaveBeenCalledTimes(1);
  });
});
