import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { PayoutBatch } from './entities/payout-batch.entity';
import { WelperPayoutLedger } from './entities/welper-payout-ledger.entity';
import {
  PayoutBatchStatus,
  WelperPayoutLedgerStatus,
} from './entities/payout-ledger-status.enum';
import { WelperPayoutLedgerService } from './welper-payout-ledger.service';
import { StripeConnectService } from './stripe-connect.service';
import { createStripeClient } from './stripe-client';
import {
  getUpcomingPayoutFriday,
  isEligibleForPayoutFriday,
} from './payout-eligibility';
import { WelperProfile } from '../profile-management/entities/welper-profile.entity';
import { UserAccount } from '../user-management/entities/user-account.entity';
import { BookingRequest, BookingRequestStatus } from '../booking/entities/booking-request.entity';
import { PayoutMethodChoice } from '../profile-management/entities/payout-method-choice.enum';
import {
  E2E_STRIPE_CONNECT_ACCOUNT_PREFIX,
} from '../../common/signup-e2e-bypass';

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

export type PayoutBatchReviewDto = {
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
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    this.stripe = key ? createStripeClient(key) : null;
  }

  async getUpcomingPreview(): Promise<PayoutUpcomingPreviewDto> {
    const payoutFriday = getUpcomingPayoutFriday();
    const eligible = await this.findEligiblePendingLines(payoutFriday);
    const welperIds = new Set(eligible.map((l) => l.welperId));
    const existing = await this.batchRepo.findOne({
      where: {
        payoutFriday,
        status: In([
          PayoutBatchStatus.REVIEW,
          PayoutBatchStatus.APPROVED,
          PayoutBatchStatus.EXECUTING,
        ]),
      },
      order: { createdAt: 'DESC' },
    });
    return {
      payoutFriday,
      eligiblePendingCount: eligible.length,
      eligibleWelperCount: welperIds.size,
      eligibleWelperNetCents: eligible.reduce((s, l) => s + l.welperNetCents, 0),
      existingBatchId: existing?.id ?? null,
      existingBatchStatus: existing?.status ?? null,
    };
  }

  private async findEligiblePendingLines(payoutFriday: string): Promise<WelperPayoutLedger[]> {
    const pending = await this.ledgerRepo.find({
      where: {
        status: In([WelperPayoutLedgerStatus.PENDING, WelperPayoutLedgerStatus.FAILED]),
        stripeTransferId: IsNull(),
      },
      order: { paymentReleasedAt: 'ASC' },
    });
    const eligible: WelperPayoutLedger[] = [];
    for (const line of pending) {
      if (line.welperNetCents <= 0) continue;
      if (!isEligibleForPayoutFriday(line.paymentReleasedAt, payoutFriday)) continue;
      const booking = await this.bookingRepo.findOne({ where: { id: line.bookingId } });
      if (!booking || booking.status === BookingRequestStatus.DISPUTED) continue;
      if (
        booking.status !== BookingRequestStatus.PAYMENT_RELEASED &&
        booking.status !== BookingRequestStatus.COMPLETED
      ) {
        continue;
      }
      eligible.push(line);
    }
    return eligible;
  }

  /** Failed transfers with no Stripe id can re-enter a future Friday batch. */
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
    await this.resetRetryableFailedLines();
    const existing = await this.batchRepo.findOne({
      where: {
        payoutFriday: friday,
        status: In([PayoutBatchStatus.REVIEW, PayoutBatchStatus.APPROVED, PayoutBatchStatus.EXECUTING]),
      },
    });
    if (existing) {
      await this.ledgerService.releaseScheduledLinesFromBatch(existing.id);
      if (existing.status === PayoutBatchStatus.REVIEW) {
        await this.batchRepo.remove(existing);
      } else {
        throw new BadRequestException(
          `A batch for ${friday} is already ${existing.status} and cannot be rebuilt`,
        );
      }
    }

    const eligible = await this.findEligiblePendingLines(friday);
    const batch = this.batchRepo.create({
      payoutFriday: friday,
      status: PayoutBatchStatus.REVIEW,
      bookingCount: eligible.length,
      welperCount: new Set(eligible.map((l) => l.welperId)).size,
      totalWelperNetCents: eligible.reduce((s, l) => s + l.welperNetCents, 0),
      totalPlatformGrossCents: eligible.reduce((s, l) => s + l.platformGrossCents, 0),
      totalStripeFeeCents: eligible.reduce((s, l) => s + l.stripeFeeCents, 0),
      totalCustomerCapturedCents: eligible.reduce((s, l) => s + l.customerTotalCents, 0),
    });
    const saved = await this.batchRepo.save(batch);

    for (const line of eligible) {
      line.status = WelperPayoutLedgerStatus.SCHEDULED;
      line.payoutBatchId = saved.id;
      await this.ledgerRepo.save(line);
    }

    return this.getBatchReview(saved.id);
  }

  async listBatches(limit = 20, payoutFriday?: string): Promise<PayoutBatchReviewDto[]> {
    const rows = await this.batchRepo.find({
      where: payoutFriday ? { payoutFriday } : {},
      order: { payoutFriday: 'DESC' },
      take: Math.min(limit, 100),
    });
    return Promise.all(rows.map((b) => this.getBatchReview(b.id)));
  }

  async getBatchReview(batchId: string): Promise<PayoutBatchReviewDto> {
    const batch = await this.batchRepo.findOne({ where: { id: batchId } });
    if (!batch) throw new NotFoundException('Payout batch not found');

    const lines = await this.ledgerRepo.find({
      where: { payoutBatchId: batchId },
      order: { paymentReleasedAt: 'ASC' },
    });

    const welperMap = new Map<string, PayoutWelperRollupDto>();
    for (const line of lines) {
      let rollup = welperMap.get(line.welperId);
      if (!rollup) {
        const [user, profile] = await Promise.all([
          this.userRepo.findOne({ where: { id: line.welperId } }),
          this.welperProfileRepo.findOne({ where: { welperId: line.welperId } }),
        ]);
        const connectId = profile?.stripeConnectAccountId ?? null;
        const connectStatus = connectId
          ? await this.stripeConnect.getStatus(line.welperId).catch(() => null)
          : null;
        rollup = {
          welperId: line.welperId,
          welperEmail: user?.email ?? null,
          welperName: user?.email?.split('@')[0] ?? null,
          stripeConnectAccountId: connectId,
          connectReady:
            profile?.payoutMethodChoice === PayoutMethodChoice.STRIPE &&
            !!connectId &&
            (connectStatus?.onboardingComplete ?? false) &&
            (connectStatus?.payoutsEnabled ?? false),
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
        stripeFeeCents: line.stripeFeeCents,
        platformNetCents: line.platformGrossCents - line.stripeFeeCents,
        status: line.status,
        exclusionReason: line.exclusionReason,
      };
      rollup.lines.push(lineDto);
      rollup.bookingCount += 1;
      rollup.welperNetCents += line.welperNetCents;
      rollup.platformGrossCents += line.platformGrossCents;
      rollup.stripeFeeCents += line.stripeFeeCents;
      rollup.platformNetCents += line.platformGrossCents - line.stripeFeeCents;
      rollup.customerCapturedCents += line.customerTotalCents;
    }

    const welpers = [...welperMap.values()].sort((a, b) => b.welperNetCents - a.welperNetCents);

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
      executionSummary: batch.executionSummary,
      welpers,
    };
  }

  async approveAndExecute(batchId: string, adminUserId: string): Promise<PayoutBatchReviewDto> {
    const batch = await this.batchRepo.findOne({ where: { id: batchId } });
    if (!batch) throw new NotFoundException('Payout batch not found');
    if (batch.status !== PayoutBatchStatus.REVIEW) {
      throw new BadRequestException(`Batch is ${batch.status}; only review batches can be approved`);
    }
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const review = await this.getBatchReview(batchId);
    const notReady = review.welpers.filter((w) => w.welperNetCents > 0 && !w.connectReady);
    if (notReady.length > 0) {
      throw new BadRequestException(
        `${notReady.length} welper(s) are not Connect-ready for payout`,
      );
    }

    const disputed = await this.bookingRepo.count({
      where: {
        id: In(review.welpers.flatMap((w) => w.lines.map((l) => l.bookingId))),
        status: BookingRequestStatus.DISPUTED,
      },
    });
    if (disputed > 0) {
      throw new BadRequestException('Batch includes disputed bookings');
    }

    batch.status = PayoutBatchStatus.EXECUTING;
    batch.approvedBy = adminUserId;
    batch.approvedAt = new Date();
    await this.batchRepo.save(batch);

    const transferResults: Array<{
      welperId: string;
      amountCents: number;
      transferId?: string;
      error?: string;
    }> = [];

    for (const welper of review.welpers) {
      if (welper.welperNetCents <= 0) continue;
      const profile = await this.welperProfileRepo.findOne({
        where: { welperId: welper.welperId },
      });
      const accountId = profile?.stripeConnectAccountId;
      if (!accountId) {
        transferResults.push({
          welperId: welper.welperId,
          amountCents: welper.welperNetCents,
          error: 'missing_connect_account',
        });
        continue;
      }

      if (
        process.env.NODE_ENV !== 'production' &&
        accountId.startsWith(E2E_STRIPE_CONNECT_ACCOUNT_PREFIX)
      ) {
        transferResults.push({
          welperId: welper.welperId,
          amountCents: welper.welperNetCents,
          transferId: `e2e_tr_${batchId}_${welper.welperId}`,
        });
        await this.markWelperLinesTransferred(
          batchId,
          welper.welperId,
          `e2e_tr_${batchId}_${welper.welperId}`,
        );
        continue;
      }

      try {
        const transfer = await this.stripe.transfers.create(
          {
            amount: welper.welperNetCents,
            currency: 'cad',
            destination: accountId,
            transfer_group: batchId,
            metadata: {
              batchId,
              welperId: welper.welperId,
              payoutFriday: batch.payoutFriday,
            },
          },
          { idempotencyKey: `payout-batch-${batchId}-welper-${welper.welperId}` },
        );
        transferResults.push({
          welperId: welper.welperId,
          amountCents: welper.welperNetCents,
          transferId: transfer.id,
        });
        await this.markWelperLinesTransferred(batchId, welper.welperId, transfer.id);
      } catch (err) {
        this.logger.error(
          `Transfer failed welper=${welper.welperId} batch=${batchId}: ${(err as Error).message}`,
        );
        transferResults.push({
          welperId: welper.welperId,
          amountCents: welper.welperNetCents,
          error: (err as Error).message,
        });
        await this.ledgerRepo.update(
          {
            payoutBatchId: batchId,
            welperId: welper.welperId,
            status: WelperPayoutLedgerStatus.SCHEDULED,
          },
          { status: WelperPayoutLedgerStatus.FAILED },
        );
      }
    }

    const failures = transferResults.filter((r) => r.error);
    batch.executedAt = new Date();
    batch.executionSummary = { transfers: transferResults };
    if (transferResults.length === 0) {
      batch.status = PayoutBatchStatus.COMPLETED;
    } else if (failures.length === 0) {
      batch.status = PayoutBatchStatus.COMPLETED;
    } else if (failures.length === transferResults.length) {
      batch.status = PayoutBatchStatus.FAILED;
    } else {
      batch.status = PayoutBatchStatus.COMPLETED;
    }
    await this.batchRepo.save(batch);

    return this.getBatchReview(batchId);
  }

  private async markWelperLinesTransferred(
    batchId: string,
    welperId: string,
    transferId: string,
  ): Promise<void> {
    await this.ledgerRepo.update(
      {
        payoutBatchId: batchId,
        welperId,
        status: In([WelperPayoutLedgerStatus.SCHEDULED, WelperPayoutLedgerStatus.FAILED]),
      },
      {
        status: WelperPayoutLedgerStatus.TRANSFERRED,
        stripeTransferId: transferId,
      },
    );
  }

  async exportBatchCsv(batchId: string): Promise<string> {
    const review = await this.getBatchReview(batchId);
    const header =
      'welper_id,welper_email,booking_id,customer_total_cents,welper_net_cents,platform_gross_cents,stripe_fee_cents,platform_net_cents,stripe_transfer_id,payment_released_at';
    const rows: string[] = [header];
    for (const welper of review.welpers) {
      for (const line of welper.lines) {
        const ledger = await this.ledgerRepo.findOne({ where: { id: line.ledgerId } });
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
            ledger?.stripeTransferId ?? '',
            line.paymentReleasedAt,
          ].join(','),
        );
      }
    }
    return rows.join('\n');
  }

  async handleTransferWebhook(transfer: Stripe.Transfer): Promise<void> {
    const batchId = transfer.transfer_group ?? transfer.metadata?.batchId;
    const welperId = transfer.metadata?.welperId;
    if (!batchId || !welperId) return;
    await this.markWelperLinesTransferred(batchId, welperId, transfer.id);
  }

  async handleTransferFailed(transfer: Stripe.Transfer): Promise<void> {
    const batchId = transfer.transfer_group ?? transfer.metadata?.batchId;
    const welperId = transfer.metadata?.welperId;
    if (!batchId || !welperId) return;
    await this.ledgerRepo.update(
      {
        payoutBatchId: batchId,
        welperId,
        status: In([
          WelperPayoutLedgerStatus.SCHEDULED,
          WelperPayoutLedgerStatus.TRANSFERRED,
        ]),
      },
      { status: WelperPayoutLedgerStatus.FAILED },
    );
  }
}
