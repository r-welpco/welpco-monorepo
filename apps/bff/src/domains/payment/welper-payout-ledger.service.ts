import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { BookingRequest, BookingRequestStatus } from '../booking/entities/booking-request.entity';
import { BookingServiceReceipt } from '../booking/entities/booking-service-receipt.entity';
import {
  computePlatformGrossCents,
  computeWelperGrossCentsFromCustomerSubtotal,
  computeWelperRefundShareCents,
} from '../booking/booking-pricing';
import {
  BookingPayment,
  BookingPaymentKind,
  BookingPaymentRecordStatus,
} from './entities/booking-payment.entity';
import { WelperPayoutLedger } from './entities/welper-payout-ledger.entity';
import { WelperPayoutLedgerStatus } from './entities/payout-ledger-status.enum';
import { createStripeClient } from './stripe-client';
import { syncStripeFeeForPaymentIntent } from './stripe-fee.util';

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
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    this.stripe = key ? createStripeClient(key) : null;
  }

  async syncStripeFeesForBooking(bookingId: string): Promise<number> {
    if (!this.stripe) return 0;
    const rows = await this.bookingPaymentRepo.find({
      where: { bookingId, status: BookingPaymentRecordStatus.CAPTURED },
    });
    let totalFee = 0;
    for (const row of rows) {
      if (row.stripeFeeCents != null && row.stripeBalanceTransactionId) {
        totalFee += row.stripeFeeCents;
        continue;
      }
      try {
        const { feeCents, balanceTransactionId } = await syncStripeFeeForPaymentIntent(
          this.stripe,
          row.stripePaymentIntentId,
        );
        row.stripeFeeCents = feeCents;
        row.stripeBalanceTransactionId = balanceTransactionId;
        await this.bookingPaymentRepo.save(row);
        totalFee += feeCents;
      } catch (err) {
        this.logger.warn(
          `Stripe fee sync failed for PI ${row.stripePaymentIntentId}: ${(err as Error).message}`,
        );
      }
    }
    return totalFee;
  }

  /** Create or refresh ledger row when customer payment is fully captured. */
  async createLedgerForPaymentReleased(bookingId: string): Promise<WelperPayoutLedger | null> {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
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

    const stripeFeeCents = await this.syncStripeFeesForBooking(bookingId);
    const welperGrossCents = computeWelperGrossCentsFromCustomerSubtotal(receipt.subtotalCents);
    const platformGrossCents = computePlatformGrossCents(receipt.subtotalCents);
    const welperRefundCents = existing?.welperRefundCents ?? 0;
    const welperNetCents = Math.max(0, welperGrossCents - welperRefundCents);

    const payload: Partial<WelperPayoutLedger> = {
      bookingId,
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
      stripeFeeCents,
      status:
        welperNetCents <= 0
          ? WelperPayoutLedgerStatus.EXCLUDED
          : existing?.status === WelperPayoutLedgerStatus.EXCLUDED
            ? WelperPayoutLedgerStatus.PENDING
            : (existing?.status ?? WelperPayoutLedgerStatus.PENDING),
      exclusionReason: welperNetCents <= 0 ? 'fully_refunded' : null,
    };

    if (existing) {
      if (existing.status === WelperPayoutLedgerStatus.SCHEDULED) {
        Object.assign(existing, payload);
        return this.ledgerRepo.save(existing);
      } else if (
        existing.status !== WelperPayoutLedgerStatus.EXCLUDED &&
        existing.status !== WelperPayoutLedgerStatus.FAILED
      ) {
        Object.assign(existing, payload);
        return this.ledgerRepo.save(existing);
      } else if (existing.status === WelperPayoutLedgerStatus.EXCLUDED && welperNetCents > 0) {
        existing.status = WelperPayoutLedgerStatus.PENDING;
        existing.exclusionReason = null;
        Object.assign(existing, payload);
        return this.ledgerRepo.save(existing);
      }
      return existing;
    }

    return this.ledgerRepo.save(this.ledgerRepo.create(payload));
  }

  async excludeForDispute(bookingId: string): Promise<void> {
    const row = await this.ledgerRepo.findOne({ where: { bookingId } });
    if (!row || row.status === WelperPayoutLedgerStatus.TRANSFERRED) return;
    if (row.status === WelperPayoutLedgerStatus.SCHEDULED && row.payoutBatchId) {
      row.payoutBatchId = null;
    }
    row.status = WelperPayoutLedgerStatus.EXCLUDED;
    row.exclusionReason = 'dispute_open';
    await this.ledgerRepo.save(row);
  }

  async restoreAfterDisputeResolved(bookingId: string): Promise<void> {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
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
      this.logger.warn(
        `Refund after transfer for booking ${bookingId}; manual ops required`,
      );
      return;
    }

    const welperShare = computeWelperRefundShareCents(
      refundDeltaCents,
      row.customerSubtotalCents,
      row.customerTotalCents,
    );
    row.welperRefundCents = Math.min(
      row.welperGrossCents,
      (row.welperRefundCents ?? 0) + welperShare,
    );
    row.welperNetCents = Math.max(0, row.welperGrossCents - row.welperRefundCents);

    if (row.welperNetCents <= 0) {
      row.status = WelperPayoutLedgerStatus.EXCLUDED;
      row.exclusionReason = 'fully_refunded';
      row.payoutBatchId = null;
    } else if (row.status === WelperPayoutLedgerStatus.SCHEDULED) {
      row.status = WelperPayoutLedgerStatus.PENDING;
      row.payoutBatchId = null;
    }

    await this.ledgerRepo.save(row);
  }

  async releaseScheduledLinesFromBatch(batchId: string): Promise<void> {
    await this.ledgerRepo.update(
      { payoutBatchId: batchId, status: WelperPayoutLedgerStatus.SCHEDULED },
      { status: WelperPayoutLedgerStatus.PENDING, payoutBatchId: null },
    );
  }

  async findById(id: string): Promise<WelperPayoutLedger> {
    const row = await this.ledgerRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Payout ledger row not found');
    return row;
  }
}
