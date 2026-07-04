import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, IsNull, Repository } from 'typeorm';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { PayoutBatch } from './entities/payout-batch.entity';
import { WelperPayoutLedger } from './entities/welper-payout-ledger.entity';
import { PayoutBatchStatus, WelperPayoutLedgerStatus } from './entities/payout-ledger-status.enum';
import { WelperPayoutLedgerService } from './welper-payout-ledger.service';
import { StripeConnectService } from './stripe-connect.service';
import { createStripeClient } from './stripe-client';
import {
  assertBuildablePayoutFriday,
  getUpcomingPayoutFriday,
  isEligibleForPayoutFriday,
  isPayoutFridayReached,
} from './payout-eligibility';
import { WelperProfile } from '../profile-management/entities/welper-profile.entity';
import { UserAccount } from '../user-management/entities/user-account.entity';
import { BookingRequest, BookingRequestStatus } from '../booking/entities/booking-request.entity';
import { PayoutMethodChoice } from '../profile-management/entities/payout-method-choice.enum';
import { E2E_STRIPE_CONNECT_ACCOUNT_PREFIX } from '../../common/signup-e2e-bypass';
import { buildTransferIdempotencyKey } from './payout-idempotency.util';
import { computeTotalsFromLines } from './payout-batch-totals.util';
import { StripeOperationsService } from './stripe-operations.service';

export type PayoutBatchLineDto = {
  ledgerId: string;
  bookingId: string;
  customerId: string;
  paymentReleasedAt: string;
  customerSubtotalCents: number;
  customerTaxCents: number;
  customerTotalCents: number;
  welperGrossCents: number;
  welperRefundCents: number;
  welperNetCents: number;
  platformGrossCents: number;
  stripeFeeCents: number;
  platformNetCents: number;
  status: WelperPayoutLedgerStatus;
  exclusionReason: string | null;
  stripeTransferId: string | null;
};

export type PayoutWelperRollupDto = {
  welperId: string;
  welperEmail: string | null;
  welperName: string | null;
  stripeConnectAccountId: string | null;
  connectReady: boolean;
  bookingCount: number;
  welperNetCents: number;
  platformGrossCents: number;
  stripeFeeCents: number;
  platformNetCents: number;
  customerCapturedCents: number;
  lines: PayoutBatchLineDto[];
};

export type PayoutBatchSummaryDto = {
  id: string;
  payoutFriday: string;
  status: PayoutBatchStatus;
  bookingCount: number;
  welperCount: number;
  totalWelperNetCents: number;
  totalPlatformGrossCents: number;
  totalStripeFeeCents: number;
  totalCustomerCapturedCents: number;
  totalPlatformNetCents: number;
  approvedBy: string | null;
  approvedAt: string | null;
  executedAt: string | null;
};

export type PayoutBatchReviewDto = PayoutBatchSummaryDto & {
  executionSummary: Record<string, unknown> | null;
  welpers: PayoutWelperRollupDto[];
};

export type PayoutUpcomingPreviewDto = {
  payoutFriday: string;
  eligiblePendingCount: number;
  eligibleWelperCount: number;
  eligibleWelperNetCents: number;
  existingBatchId: string | null;
  existingBatchStatus: PayoutBatchStatus | null;
  welpers: PayoutWelperRollupDto[];
};

type TransferResult = {
  welperId: string;
  amountCents: number;
  transferId?: string;
  error?: string;
};

@Injectable()
export class PayoutBatchService {
  private readonly logger = new Logger(PayoutBatchService.name);
  private readonly stripe: Stripe | null;

  constructor(
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
    @InjectRepository(PayoutBatch)
    private readonly batchRepo: Repository<PayoutBatch>,
    @InjectRepository(WelperPayoutLedger)
    private readonly ledgerRepo: Repository<WelperPayoutLedger>,
    @InjectRepository(WelperProfile)
    private readonly welperProfileRepo: Repository<WelperProfile>,
    @InjectRepository(UserAccount)
    private readonly userRepo: Repository<UserAccount>,
    @InjectRepository(BookingRequest)
    private readonly bookingRepo: Repository<BookingRequest>,
    private readonly ledgerService: WelperPayoutLedgerService,
    private readonly stripeConnect: StripeConnectService,
    private readonly stripeOperationsService: StripeOperationsService,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    this.stripe = key ? createStripeClient(key) : null;
  }

  async getUpcomingPreview(): Promise<PayoutUpcomingPreviewDto> {
    const payoutFriday = getUpcomingPayoutFriday();
    const existing = await this.batchRepo.findOne({
      where: {
        payoutFriday,
        status: In([PayoutBatchStatus.REVIEW, PayoutBatchStatus.APPROVED, PayoutBatchStatus.EXECUTING]),
      },
      order: { createdAt: 'DESC' },
    });

    if (existing?.status === PayoutBatchStatus.REVIEW) {
      const review = await this.getBatchReview(existing.id);
      return {
        payoutFriday,
        eligiblePendingCount: review.bookingCount,
        eligibleWelperCount: review.welperCount,
        eligibleWelperNetCents: review.totalWelperNetCents,
        existingBatchId: existing.id,
        existingBatchStatus: existing.status,
        welpers: review.welpers,
      };
    }

    const eligible = await this.findEligiblePendingLines(payoutFriday);
    const welperIds = new Set(eligible.map((l) => l.welperId));
    const welpers = await this.rollupWelpersFromLedgerLines(eligible, false);

    return {
      payoutFriday,
      eligiblePendingCount: eligible.length,
      eligibleWelperCount: welperIds.size,
      eligibleWelperNetCents: eligible.reduce((s, l) => s + l.welperNetCents, 0),
      existingBatchId: existing?.id ?? null,
      existingBatchStatus: existing?.status ?? null,
      welpers,
    };
  }

  private async findEligiblePendingLines(
    payoutFriday: string,
    manager?: EntityManager,
  ): Promise<WelperPayoutLedger[]> {
    const ledgerRepo = manager ? manager.getRepository(WelperPayoutLedger) : this.ledgerRepo;
    const bookingRepo = manager ? manager.getRepository(BookingRequest) : this.bookingRepo;
    const pending = manager
      ? await ledgerRepo
          .createQueryBuilder('ledger')
          .setLock('pessimistic_write')
          .where('ledger.status IN (:...statuses)', {
            statuses: [WelperPayoutLedgerStatus.PENDING, WelperPayoutLedgerStatus.FAILED],
          })
          .andWhere('ledger.stripe_transfer_id IS NULL')
          .orderBy('ledger.payment_released_at', 'ASC')
          .getMany()
      : await ledgerRepo.find({
          where: {
            status: In([WelperPayoutLedgerStatus.PENDING, WelperPayoutLedgerStatus.FAILED]),
            stripeTransferId: IsNull(),
          },
          order: { paymentReleasedAt: 'ASC' },
        });
    const candidateLines = pending.filter(
      (line) =>
        line.welperNetCents > 0 &&
        line.exclusionReason !== 'stripe_fee_pending' &&
        isEligibleForPayoutFriday(line.paymentReleasedAt, payoutFriday),
    );
    if (candidateLines.length === 0) return [];

    const bookingIds = [...new Set(candidateLines.map((line) => line.bookingId))];
    const bookings = manager
      ? await bookingRepo
          .createQueryBuilder('booking')
          .setLock('pessimistic_read')
          .where('booking.id IN (:...bookingIds)', { bookingIds })
          .getMany()
      : await bookingRepo.find({
          where: {
            id: In(bookingIds),
          },
        });
    const bookingStatusById = new Map(bookings.map((booking) => [booking.id, booking.status]));
    const eligible: WelperPayoutLedger[] = [];
    for (const line of candidateLines) {
      const bookingStatus = bookingStatusById.get(line.bookingId);
      if (!bookingStatus || bookingStatus === BookingRequestStatus.DISPUTED) continue;
      if (bookingStatus !== BookingRequestStatus.PAYMENT_RELEASED && bookingStatus !== BookingRequestStatus.COMPLETED) {
        continue;
      }
      eligible.push(line);
    }
    return eligible;
  }

  /** Only reset failed rows confirmed to have no Stripe transfer id. */
  private async resetRetryableFailedLines(): Promise<void> {
    await this.ledgerRepo.update(
      {
        status: WelperPayoutLedgerStatus.FAILED,
        stripeTransferId: IsNull(),
      },
      {
        status: WelperPayoutLedgerStatus.PENDING,
        payoutBatchId: null,
      },
    );
  }

  async buildDraftBatch(payoutFriday?: string): Promise<PayoutBatchReviewDto> {
    const friday = payoutFriday ?? getUpcomingPayoutFriday();
    try {
      assertBuildablePayoutFriday(friday);
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }

    const batchId = await this.dataSource.transaction(async (manager) => {
      await manager.update(
        WelperPayoutLedger,
        { status: WelperPayoutLedgerStatus.FAILED, stripeTransferId: IsNull() },
        { status: WelperPayoutLedgerStatus.PENDING, payoutBatchId: null },
      );

      const batchRepo = manager.getRepository(PayoutBatch);
      const ledgerRepo = manager.getRepository(WelperPayoutLedger);

      const existing = await batchRepo.findOne({
        where: {
          payoutFriday: friday,
          status: In([PayoutBatchStatus.REVIEW, PayoutBatchStatus.APPROVED, PayoutBatchStatus.EXECUTING]),
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (existing) {
        if (existing.status !== PayoutBatchStatus.REVIEW) {
          throw new BadRequestException(`A batch for ${friday} is already ${existing.status} and cannot be rebuilt`);
        }
        await ledgerRepo.update(
          {
            payoutBatchId: existing.id,
            status: WelperPayoutLedgerStatus.SCHEDULED,
          },
          { status: WelperPayoutLedgerStatus.PENDING, payoutBatchId: null },
        );
        await batchRepo.remove(existing);
      }

      const eligible = await this.findEligiblePendingLines(friday, manager);

      const totals = computeTotalsFromLines(eligible);
      const batch = batchRepo.create({
        payoutFriday: friday,
        status: PayoutBatchStatus.REVIEW,
        ...totals,
      });
      const saved = await batchRepo.save(batch);

      for (const line of eligible) {
        line.status = WelperPayoutLedgerStatus.SCHEDULED;
        line.payoutBatchId = saved.id;
        await ledgerRepo.save(line);
      }

      return saved.id;
    });

    return this.getBatchReview(batchId);
  }

  async listBatchSummaries(limit = 20, payoutFriday?: string): Promise<PayoutBatchSummaryDto[]> {
    const rows = await this.batchRepo.find({
      where: payoutFriday ? { payoutFriday } : {},
      order: { payoutFriday: 'DESC' },
      take: Math.min(limit, 100),
    });
    return rows.map((batch) => this.toBatchSummaryDto(batch));
  }

  async listBatches(limit = 20, payoutFriday?: string): Promise<PayoutBatchSummaryDto[]> {
    return this.listBatchSummaries(limit, payoutFriday);
  }

  async refreshPendingStripeFees() {
    return this.ledgerService.refreshPendingStripeFees();
  }

  private toBatchSummaryDto(batch: PayoutBatch): PayoutBatchSummaryDto {
    return {
      id: batch.id,
      payoutFriday: batch.payoutFriday,
      status: batch.status,
      bookingCount: batch.bookingCount,
      welperCount: batch.welperCount,
      totalWelperNetCents: batch.totalWelperNetCents,
      totalPlatformGrossCents: batch.totalPlatformGrossCents,
      totalStripeFeeCents: batch.totalStripeFeeCents,
      totalCustomerCapturedCents: batch.totalCustomerCapturedCents,
      totalPlatformNetCents: batch.totalPlatformGrossCents - batch.totalStripeFeeCents,
      approvedBy: batch.approvedBy,
      approvedAt: batch.approvedAt?.toISOString() ?? null,
      executedAt: batch.executedAt?.toISOString() ?? null,
    };
  }

  async getBatchReview(batchId: string, options?: { liveConnectCheck?: boolean }): Promise<PayoutBatchReviewDto> {
    const liveConnectCheck = options?.liveConnectCheck ?? false;
    const batch = await this.batchRepo.findOne({ where: { id: batchId } });
    if (!batch) throw new NotFoundException('Payout batch not found');

    const lines = await this.ledgerRepo.find({
      where: { payoutBatchId: batchId },
      order: { paymentReleasedAt: 'ASC' },
    });

    const welpers = await this.rollupWelpersFromLedgerLines(lines, liveConnectCheck);
    const totals = computeTotalsFromLines(lines);

    return {
      ...this.toBatchSummaryDto(batch),
      bookingCount: totals.bookingCount,
      welperCount: totals.welperCount,
      totalWelperNetCents: totals.totalWelperNetCents,
      totalPlatformGrossCents: totals.totalPlatformGrossCents,
      totalStripeFeeCents: totals.totalStripeFeeCents,
      totalCustomerCapturedCents: totals.totalCustomerCapturedCents,
      totalPlatformNetCents: totals.totalPlatformGrossCents - totals.totalStripeFeeCents,
      executionSummary: batch.executionSummary,
      welpers,
    };
  }

  private async rollupWelpersFromLedgerLines(
    lines: WelperPayoutLedger[],
    liveConnectCheck: boolean,
  ): Promise<PayoutWelperRollupDto[]> {
    const welperIds = [...new Set(lines.map((l) => l.welperId))];
    const [users, profiles] = await Promise.all([
      welperIds.length ? this.userRepo.find({ where: { id: In(welperIds) } }) : Promise.resolve([] as UserAccount[]),
      welperIds.length
        ? this.welperProfileRepo.find({ where: { welperId: In(welperIds) } })
        : Promise.resolve([] as WelperProfile[]),
    ]);
    const userById = new Map(users.map((u) => [u.id, u]));
    const profileByWelperId = new Map(profiles.map((p) => [p.welperId, p]));

    const connectStatusByWelper = new Map<string, Awaited<ReturnType<StripeConnectService['getStatus']>>>();
    if (liveConnectCheck) {
      for (let start = 0; start < welperIds.length; start += 5) {
        await Promise.all(
          welperIds.slice(start, start + 5).map(async (welperId) => {
            try {
              connectStatusByWelper.set(welperId, await this.stripeConnect.getStatus(welperId));
            } catch {
              connectStatusByWelper.set(welperId, {
                hasAccount: false,
                onboardingComplete: false,
                chargesEnabled: false,
                payoutsEnabled: false,
                detailsSubmitted: false,
              });
            }
          }),
        );
      }
    }

    const welperMap = new Map<string, PayoutWelperRollupDto>();
    for (const line of lines) {
      let rollup = welperMap.get(line.welperId);
      if (!rollup) {
        const user = userById.get(line.welperId);
        const profile = profileByWelperId.get(line.welperId);
        const connectId = profile?.stripeConnectAccountId ?? null;
        const connectStatus = liveConnectCheck ? connectStatusByWelper.get(line.welperId) : null;
        rollup = {
          welperId: line.welperId,
          welperEmail: user?.email ?? null,
          welperName: user?.email?.split('@')[0] ?? null,
          stripeConnectAccountId: connectId,
          connectReady: liveConnectCheck
            ? profile?.payoutMethodChoice === PayoutMethodChoice.STRIPE &&
              !!connectId &&
              (connectStatus?.onboardingComplete ?? false) &&
              (connectStatus?.payoutsEnabled ?? false)
            : profile?.payoutMethodChoice === PayoutMethodChoice.STRIPE && !!connectId,
          bookingCount: 0,
          welperNetCents: 0,
          platformGrossCents: 0,
          stripeFeeCents: 0,
          platformNetCents: 0,
          customerCapturedCents: 0,
          lines: [],
        };
        welperMap.set(line.welperId, rollup);
      }
      const lineDto: PayoutBatchLineDto = {
        ledgerId: line.id,
        bookingId: line.bookingId,
        customerId: line.customerId,
        paymentReleasedAt: line.paymentReleasedAt.toISOString(),
        customerSubtotalCents: line.customerSubtotalCents,
        customerTaxCents: line.customerTaxCents,
        customerTotalCents: line.customerTotalCents,
        welperGrossCents: line.welperGrossCents,
        welperRefundCents: line.welperRefundCents,
        welperNetCents: line.welperNetCents,
        platformGrossCents: line.platformGrossCents,
        stripeFeeCents: line.stripeFeeCents ?? 0,
        platformNetCents: line.platformGrossCents - (line.stripeFeeCents ?? 0),
        status: line.status,
        exclusionReason: line.exclusionReason,
        stripeTransferId: line.stripeTransferId,
      };
      rollup.lines.push(lineDto);
      rollup.bookingCount += 1;
      rollup.welperNetCents += line.welperNetCents;
      rollup.platformGrossCents += line.platformGrossCents;
      rollup.stripeFeeCents += line.stripeFeeCents ?? 0;
      rollup.platformNetCents += line.platformGrossCents - (line.stripeFeeCents ?? 0);
      rollup.customerCapturedCents += line.customerTotalCents;
    }

    return [...welperMap.values()].sort((a, b) => b.welperNetCents - a.welperNetCents);
  }

  async approveAndExecute(batchId: string, adminUserId: string): Promise<PayoutBatchReviewDto> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const batch = await this.batchRepo.findOne({ where: { id: batchId } });
    if (!batch) throw new NotFoundException('Payout batch not found');
    if (batch.status !== PayoutBatchStatus.REVIEW) {
      throw new BadRequestException(`Batch is ${batch.status}; only review batches can be approved`);
    }
    if (!isPayoutFridayReached(batch.payoutFriday)) {
      throw new BadRequestException(
        `Transfers are only allowed on or after payout Friday (${batch.payoutFriday}, America/Toronto)`,
      );
    }

    const review = await this.getBatchReview(batchId, {
      liveConnectCheck: true,
    });
    const notReady = review.welpers.filter((w) => w.welperNetCents > 0 && !w.connectReady);
    if (notReady.length > 0) {
      throw new BadRequestException(`${notReady.length} welper(s) are not Connect-ready for payout`);
    }

    const lockedLines = await this.dataSource.transaction(async (manager) => {
      const batchRepo = manager.getRepository(PayoutBatch);
      const ledgerRepo = manager.getRepository(WelperPayoutLedger);
      const bookingRepo = manager.getRepository(BookingRequest);

      const lockedBatch = await batchRepo.findOne({
        where: { id: batchId, status: PayoutBatchStatus.REVIEW },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lockedBatch) {
        throw new BadRequestException('Batch is no longer in review status');
      }

      const lines = await ledgerRepo.find({
        where: {
          payoutBatchId: batchId,
          status: WelperPayoutLedgerStatus.SCHEDULED,
        },
        lock: { mode: 'pessimistic_write' },
      });

      for (const line of lines) {
        if (line.welperNetCents <= 0) {
          throw new BadRequestException(`Ledger line ${line.id} has zero welper net`);
        }
        if (line.stripeTransferId) {
          throw new BadRequestException(`Ledger line ${line.id} already has a Stripe transfer`);
        }
        if (!isEligibleForPayoutFriday(line.paymentReleasedAt, lockedBatch.payoutFriday)) {
          throw new BadRequestException(
            `Booking ${line.bookingId} has not met the 7-day hold for ${lockedBatch.payoutFriday}`,
          );
        }
        const booking = await bookingRepo.findOne({
          where: { id: line.bookingId },
        });
        if (!booking || booking.status === BookingRequestStatus.DISPUTED) {
          throw new BadRequestException(`Booking ${line.bookingId} is disputed or missing`);
        }
      }

      lockedBatch.status = PayoutBatchStatus.EXECUTING;
      lockedBatch.approvedBy = adminUserId;
      lockedBatch.approvedAt = new Date();
      await batchRepo.save(lockedBatch);

      return lines;
    });

    const linesByWelper = new Map<string, WelperPayoutLedger[]>();
    for (const line of lockedLines) {
      const group = linesByWelper.get(line.welperId) ?? [];
      group.push(line);
      linesByWelper.set(line.welperId, group);
    }

    const transferResults: TransferResult[] = [];

    for (const [welperId, lines] of linesByWelper) {
      const welperNetCents = lines.reduce((s, l) => s + l.welperNetCents, 0);
      if (welperNetCents <= 0) continue;

      if (lines.some((l) => l.stripeTransferId)) {
        transferResults.push({
          welperId,
          amountCents: welperNetCents,
          transferId: lines.find((l) => l.stripeTransferId)?.stripeTransferId ?? undefined,
        });
        continue;
      }

      const profile = await this.welperProfileRepo.findOne({
        where: { welperId },
      });
      const accountId = profile?.stripeConnectAccountId;
      if (!accountId) {
        transferResults.push({
          welperId,
          amountCents: welperNetCents,
          error: 'missing_connect_account',
        });
        await this.markWelperLinesFailed(batchId, welperId);
        continue;
      }

      try {
        const transfer = await this.transferWelperLinesAtomically(batch, welperId, lines, accountId);
        transferResults.push({
          welperId,
          amountCents: transfer.amountCents,
          transferId: transfer.transferId,
        });
      } catch (err) {
        this.logger.error(`Transfer failed welper=${welperId} batch=${batchId}: ${(err as Error).message}`);
        transferResults.push({
          welperId,
          amountCents: welperNetCents,
          error: (err as Error).message,
        });
        await this.markWelperLinesFailed(batchId, welperId);
        continue;
      }
    }

    const failures = transferResults.filter((r) => r.error);
    const successes = transferResults.filter((r) => r.transferId && !r.error);
    batch.executedAt = new Date();
    batch.executionSummary = { transfers: transferResults };
    if (transferResults.length === 0) {
      batch.status = PayoutBatchStatus.COMPLETED;
    } else if (failures.length === 0) {
      batch.status = PayoutBatchStatus.COMPLETED;
    } else if (successes.length === 0) {
      batch.status = PayoutBatchStatus.FAILED;
    } else {
      batch.status = PayoutBatchStatus.PARTIAL;
    }
    await this.batchRepo.save(batch);

    return this.getBatchReview(batchId);
  }

  /**
   * Keep the booking and ledger locks until Stripe accepts the transfer and the
   * transfer id is persisted. Dispute creation locks these rows in the same
   * order, so exactly one side can cross the payout boundary first.
   */
  private async transferWelperLinesAtomically(
    batch: PayoutBatch,
    welperId: string,
    expectedLines: WelperPayoutLedger[],
    accountId: string,
  ): Promise<{ transferId: string; amountCents: number }> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const expectedLineIds = expectedLines.map((line) => line.id).sort();
    const bookingIds = [...new Set(expectedLines.map((line) => line.bookingId))].sort();

    return this.dataSource.transaction(async (manager) => {
      const bookingRepo = manager.getRepository(BookingRequest);
      const ledgerRepo = manager.getRepository(WelperPayoutLedger);

      const bookings = await bookingRepo
        .createQueryBuilder('booking')
        .setLock('pessimistic_write')
        .where('booking.id IN (:...bookingIds)', { bookingIds })
        .orderBy('booking.id', 'ASC')
        .getMany();
      if (bookings.length !== bookingIds.length) {
        throw new BadRequestException('A payout booking is missing');
      }
      if (
        bookings.some(
          (booking) =>
            booking.status !== BookingRequestStatus.PAYMENT_RELEASED &&
            booking.status !== BookingRequestStatus.COMPLETED,
        )
      ) {
        throw new BadRequestException('A payout booking is disputed or no longer payable');
      }

      const lines = await ledgerRepo
        .createQueryBuilder('ledger')
        .setLock('pessimistic_write')
        .where('ledger.id IN (:...lineIds)', { lineIds: expectedLineIds })
        .orderBy('ledger.id', 'ASC')
        .getMany();
      if (
        lines.length !== expectedLineIds.length ||
        lines.some(
          (line) =>
            line.payoutBatchId !== batch.id ||
            line.welperId !== welperId ||
            line.status !== WelperPayoutLedgerStatus.SCHEDULED ||
            !!line.stripeTransferId,
        )
      ) {
        throw new BadRequestException('Payout lines changed before transfer');
      }

      const amountCents = lines.reduce((sum, line) => sum + line.welperNetCents, 0);
      if (amountCents <= 0) {
        throw new BadRequestException('Payout amount must be positive');
      }

      const idempotencyKey = buildTransferIdempotencyKey(
        welperId,
        lines.map((line) => line.id),
      );
      const transferId =
        process.env.NODE_ENV !== 'production' && accountId.startsWith(E2E_STRIPE_CONNECT_ACCOUNT_PREFIX)
          ? `e2e_tr_${batch.id}_${welperId}`
          : (
              await this.stripe!.transfers.create(
                {
                  amount: amountCents,
                  currency: 'cad',
                  destination: accountId,
                  transfer_group: batch.id,
                  metadata: {
                    batchId: batch.id,
                    welperId,
                    payoutFriday: batch.payoutFriday,
                  },
                },
                { idempotencyKey },
              )
            ).id;

      for (const line of lines) {
        line.status = WelperPayoutLedgerStatus.TRANSFERRED;
        line.stripeTransferId = transferId;
        await ledgerRepo.save(line);
      }

      return { transferId, amountCents };
    });
  }

  private async markWelperLinesTransferred(batchId: string, welperId: string, transferId: string): Promise<void> {
    await this.ledgerRepo.update(
      {
        payoutBatchId: batchId,
        welperId,
        status: In([WelperPayoutLedgerStatus.SCHEDULED, WelperPayoutLedgerStatus.FAILED]),
        stripeTransferId: IsNull(),
      },
      {
        status: WelperPayoutLedgerStatus.TRANSFERRED,
        stripeTransferId: transferId,
      },
    );
  }

  private async markWelperLinesFailed(batchId: string, welperId: string): Promise<void> {
    await this.ledgerRepo.update(
      {
        payoutBatchId: batchId,
        welperId,
        status: WelperPayoutLedgerStatus.SCHEDULED,
        stripeTransferId: IsNull(),
      },
      { status: WelperPayoutLedgerStatus.FAILED },
    );
  }

  async exportBatchCsv(batchId: string): Promise<string> {
    const review = await this.getBatchReview(batchId);
    const header =
      'welper_id,welper_email,booking_id,customer_total_cents,welper_net_cents,platform_gross_cents,stripe_fee_cents,platform_net_cents,stripe_transfer_id,payment_released_at';
    const rows: string[] = [header];
    const csv = (value: string | number | null | undefined) => {
      const text = value == null ? '' : String(value);
      return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    for (const welper of review.welpers) {
      for (const line of welper.lines) {
        rows.push(
          [
            welper.welperId,
            welper.welperEmail ?? '',
            line.bookingId,
            line.customerTotalCents,
            line.welperNetCents,
            line.platformGrossCents,
            line.stripeFeeCents,
            line.platformNetCents,
            line.stripeTransferId ?? '',
            line.paymentReleasedAt,
          ].map(csv).join(','),
        );
      }
    }
    return rows.join('\n');
  }

  async handleTransferWebhook(transfer: Stripe.Transfer): Promise<void> {
    await this.stripeOperationsService.syncTransfer(transfer);
    const batchId = transfer.transfer_group ?? transfer.metadata?.batchId;
    const welperId = transfer.metadata?.welperId;
    if (!batchId || !welperId) return;
    await this.markWelperLinesTransferred(batchId, welperId, transfer.id);
  }

  async handleTransferReversed(transfer: Stripe.Transfer): Promise<void> {
    await this.stripeOperationsService.syncTransfer(transfer);
    const batchId = transfer.transfer_group ?? transfer.metadata?.batchId;
    const welperId = transfer.metadata?.welperId;
    this.logger.warn(
      `Transfer reversed: transfer=${transfer.id} batch=${batchId ?? 'unknown'} welper=${welperId ?? 'unknown'}`,
    );
  }
}
