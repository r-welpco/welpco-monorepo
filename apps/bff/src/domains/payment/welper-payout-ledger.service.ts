import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { BookingRequest, BookingRequestStatus } from '../booking/entities/booking-request.entity';
import { BookingServiceReceipt } from '../booking/entities/booking-service-receipt.entity';
import {
  computePlatformGrossCents,
  computeWelperGrossCentsFromCustomerSubtotal,
  computeWelperRefundShareCents,
} from '../booking/booking-pricing';
import { BookingPayment, BookingPaymentRecordStatus } from './entities/booking-payment.entity';
import { WelperPayoutLedger } from './entities/welper-payout-ledger.entity';
import { PayoutBatch } from './entities/payout-batch.entity';
import { WelperPayoutLedgerStatus } from './entities/payout-ledger-status.enum';
import { createStripeClient } from './stripe-client';
import { isStripeFeeSynced, syncStripeFeeForPaymentIntent } from './stripe-fee.util';
import { applyTotalsToBatch, computeTotalsFromLines } from './payout-batch-totals.util';

export const STRIPE_FEE_PENDING_REASON = 'stripe_fee_pending';

@Injectable()
export class WelperPayoutLedgerService {
  private readonly logger = new Logger(WelperPayoutLedgerService.name);
  private readonly stripe: Stripe | null;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(WelperPayoutLedger)
    private readonly ledgerRepo: Repository<WelperPayoutLedger>,
    @InjectRepository(BookingRequest)
    private readonly bookingRepo: Repository<BookingRequest>,
    @InjectRepository(BookingServiceReceipt)
    private readonly receiptRepo: Repository<BookingServiceReceipt>,
    @InjectRepository(BookingPayment)
    private readonly bookingPaymentRepo: Repository<BookingPayment>,
    @InjectRepository(PayoutBatch)
    private readonly batchRepo: Repository<PayoutBatch>,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    this.stripe = key ? createStripeClient(key) : null;
  }

  async syncStripeFeesForBooking(bookingId: string): Promise<{ totalFeeCents: number; allSynced: boolean }> {
    if (!this.stripe) return { totalFeeCents: 0, allSynced: false };
    const rows = await this.bookingPaymentRepo.find({
      where: { bookingId, status: BookingPaymentRecordStatus.CAPTURED },
    });
    if (rows.length === 0) return { totalFeeCents: 0, allSynced: true };

    let totalFee = 0;
    let allSynced = true;
    for (const row of rows) {
      if (isStripeFeeSynced(row.stripeFeeCents, row.stripeBalanceTransactionId)) {
        totalFee += row.stripeFeeCents ?? 0;
        continue;
      }
      try {
        const { feeCents, balanceTransactionId, synced } = await syncStripeFeeForPaymentIntent(
          this.stripe,
          row.stripePaymentIntentId,
        );
        if (synced) {
          row.stripeFeeCents = feeCents;
          row.stripeBalanceTransactionId = balanceTransactionId;
          await this.bookingPaymentRepo.save(row);
          totalFee += feeCents;
        } else {
          allSynced = false;
        }
      } catch (err) {
        allSynced = false;
        this.logger.warn(`Stripe fee sync failed for PI ${row.stripePaymentIntentId}: ${(err as Error).message}`);
      }
    }
    return { totalFeeCents: totalFee, allSynced };
  }

  async recalculateBatchTotals(batchId: string): Promise<void> {
    const batch = await this.batchRepo.findOne({ where: { id: batchId } });
    if (!batch) return;
    const lines = await this.ledgerRepo.find({
      where: {
        payoutBatchId: batchId,
        status: WelperPayoutLedgerStatus.SCHEDULED,
      },
    });
    applyTotalsToBatch(batch, computeTotalsFromLines(lines));
    await this.batchRepo.save(batch);
  }

  /** Create or refresh ledger row when customer payment is fully captured. */
  async createLedgerForPaymentReleased(bookingId: string): Promise<WelperPayoutLedger | null> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
    });
    if (!booking || booking.status !== BookingRequestStatus.PAYMENT_RELEASED) {
      return null;
    }
    if (!booking.paymentReleasedAt) {
      throw new BadRequestException('Booking missing payment_released_at');
    }

    const receipt = await this.receiptRepo.findOne({ where: { bookingId } });
    if (!receipt) {
      this.logger.warn(`No service receipt for booking ${bookingId}; skipping payout ledger`);
      return null;
    }

    const existing = await this.ledgerRepo.findOne({ where: { bookingId } });
    if (existing?.status === WelperPayoutLedgerStatus.TRANSFERRED) {
      return existing;
    }

    const { totalFeeCents, allSynced } = await this.syncStripeFeesForBooking(bookingId);
    return this.upsertLedgerForReleasedBooking(booking, receipt, {
      totalFeeCents,
      allSynced,
    });
  }

  async upsertLedgerForReleasedBooking(
    booking: BookingRequest,
    receipt: BookingServiceReceipt,
    fees: { totalFeeCents: number; allSynced: boolean },
    manager?: EntityManager,
  ): Promise<WelperPayoutLedger> {
    if (!booking.paymentReleasedAt) {
      throw new BadRequestException('Booking missing payment_released_at');
    }
    const ledgerRepo = manager ? manager.getRepository(WelperPayoutLedger) : this.ledgerRepo;
    const existing = await ledgerRepo.findOne({
      where: { bookingId: booking.id },
    });
    if (existing?.status === WelperPayoutLedgerStatus.TRANSFERRED) {
      return existing;
    }

    const { totalFeeCents, allSynced } = fees;
    const welperGrossCents = computeWelperGrossCentsFromCustomerSubtotal(receipt.subtotalCents);
    const platformGrossCents = computePlatformGrossCents(receipt.subtotalCents);
    const welperRefundCents = existing?.welperRefundCents ?? 0;
    const welperNetCents = Math.max(0, welperGrossCents - welperRefundCents);

    const feePending = !allSynced;
    const payload: Partial<WelperPayoutLedger> = {
      bookingId: booking.id,
      welperId: booking.welperId,
      customerId: booking.customerId,
      paymentReleasedAt: booking.paymentReleasedAt,
      customerSubtotalCents: receipt.subtotalCents,
      customerTaxCents: receipt.taxCents,
      customerTotalCents: receipt.totalCents,
      welperGrossCents,
      welperRefundCents,
      welperNetCents,
      platformGrossCents,
      stripeFeeCents: feePending ? null : totalFeeCents,
      status: feePending
        ? WelperPayoutLedgerStatus.EXCLUDED
        : welperNetCents <= 0
          ? WelperPayoutLedgerStatus.EXCLUDED
          : existing?.status === WelperPayoutLedgerStatus.EXCLUDED &&
              existing.exclusionReason === STRIPE_FEE_PENDING_REASON
            ? WelperPayoutLedgerStatus.PENDING
            : existing?.status === WelperPayoutLedgerStatus.EXCLUDED
              ? WelperPayoutLedgerStatus.PENDING
              : (existing?.status ?? WelperPayoutLedgerStatus.PENDING),
      exclusionReason: feePending ? STRIPE_FEE_PENDING_REASON : welperNetCents <= 0 ? 'fully_refunded' : null,
    };

    if (existing) {
      if (existing.status === WelperPayoutLedgerStatus.SCHEDULED) {
        Object.assign(existing, payload);
        return ledgerRepo.save(existing);
      }
      if (
        existing.status !== WelperPayoutLedgerStatus.EXCLUDED &&
        existing.status !== WelperPayoutLedgerStatus.FAILED
      ) {
        Object.assign(existing, payload);
        return ledgerRepo.save(existing);
      }
      if (existing.status === WelperPayoutLedgerStatus.EXCLUDED && welperNetCents > 0 && !feePending) {
        existing.status = WelperPayoutLedgerStatus.PENDING;
        existing.exclusionReason = null;
        Object.assign(existing, payload);
        return ledgerRepo.save(existing);
      }
      if (feePending) {
        Object.assign(existing, payload);
        return ledgerRepo.save(existing);
      }
      return existing;
    }

    return ledgerRepo.save(ledgerRepo.create(payload));
  }

  async excludeForDispute(bookingId: string, manager?: EntityManager): Promise<string | null> {
    const repo = manager ? manager.getRepository(WelperPayoutLedger) : this.ledgerRepo;
    const row = manager
      ? await repo
          .createQueryBuilder('ledger')
          .setLock('pessimistic_write')
          .where('ledger.booking_id = :bookingId', { bookingId })
          .getOne()
      : await repo.findOne({ where: { bookingId } });
    if (!row || row.status === WelperPayoutLedgerStatus.TRANSFERRED) return null;
    const batchId = row.status === WelperPayoutLedgerStatus.SCHEDULED ? row.payoutBatchId : null;
    if (row.status === WelperPayoutLedgerStatus.SCHEDULED && row.payoutBatchId) {
      row.payoutBatchId = null;
    }
    row.status = WelperPayoutLedgerStatus.EXCLUDED;
    row.exclusionReason = 'dispute_open';
    await repo.save(row);
    if (batchId && !manager) {
      await this.recalculateBatchTotals(batchId);
    }
    return batchId;
  }

  async restoreAfterDisputeResolved(bookingId: string): Promise<void> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
    });
    if (!booking || booking.status === BookingRequestStatus.DISPUTED) return;
    const row = await this.ledgerRepo.findOne({ where: { bookingId } });
    if (!row || row.status !== WelperPayoutLedgerStatus.EXCLUDED) return;
    if (row.exclusionReason !== 'dispute_open') return;
    if (row.welperNetCents <= 0) return;
    row.status = WelperPayoutLedgerStatus.PENDING;
    row.exclusionReason = null;
    await this.ledgerRepo.save(row);
  }

  /** Apply incremental customer refund to welper ledger share. */
  async applyRefundDelta(bookingId: string, refundDeltaCents: number): Promise<void> {
    if (refundDeltaCents <= 0) return;
    const row = await this.ledgerRepo.findOne({ where: { bookingId } });
    if (!row) return;
    if (row.status === WelperPayoutLedgerStatus.TRANSFERRED) {
      this.logger.warn(`Refund after transfer for booking ${bookingId}; manual ops required`);
      return;
    }

    const welperShare = computeWelperRefundShareCents(
      refundDeltaCents,
      row.customerSubtotalCents,
      row.customerTotalCents,
    );
    row.welperRefundCents = Math.min(row.welperGrossCents, (row.welperRefundCents ?? 0) + welperShare);
    row.welperNetCents = Math.max(0, row.welperGrossCents - row.welperRefundCents);

    const batchId = row.payoutBatchId;
    if (row.welperNetCents <= 0) {
      row.status = WelperPayoutLedgerStatus.EXCLUDED;
      row.exclusionReason = 'fully_refunded';
      row.payoutBatchId = null;
    } else if (row.status === WelperPayoutLedgerStatus.SCHEDULED) {
      row.status = WelperPayoutLedgerStatus.PENDING;
      row.payoutBatchId = null;
    }

    await this.ledgerRepo.save(row);
    if (batchId) {
      await this.recalculateBatchTotals(batchId);
    }
  }

  async releaseScheduledLinesFromBatch(batchId: string): Promise<void> {
    await this.ledgerRepo.update(
      { payoutBatchId: batchId, status: WelperPayoutLedgerStatus.SCHEDULED },
      { status: WelperPayoutLedgerStatus.PENDING, payoutBatchId: null },
    );
  }

  async refreshPendingStripeFees(limit = 100): Promise<{ scanned: number; recovered: number; stillPending: number }> {
    const rows = await this.ledgerRepo.find({
      where: {
        status: WelperPayoutLedgerStatus.EXCLUDED,
        exclusionReason: STRIPE_FEE_PENDING_REASON,
      },
      order: { updatedAt: 'ASC' },
      take: Math.min(Math.max(limit, 1), 200),
    });

    let recovered = 0;
    for (const row of rows) {
      const refreshed = await this.createLedgerForPaymentReleased(row.bookingId);
      if (refreshed?.status === WelperPayoutLedgerStatus.PENDING && refreshed.exclusionReason == null) {
        recovered += 1;
      }
    }

    return {
      scanned: rows.length,
      recovered,
      stillPending: rows.length - recovered,
    };
  }

  async findById(id: string): Promise<WelperPayoutLedger> {
    const row = await this.ledgerRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Payout ledger row not found');
    return row;
  }
}
