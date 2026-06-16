import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import Stripe from 'stripe';
import { createStripeClient } from './stripe-client';
import { BookingPayment } from './entities/booking-payment.entity';
import { BookingRefund } from './entities/booking-refund.entity';
import { PaymentRecoveryTask } from './entities/payment-recovery-task.entity';
import { StripeTransferState } from './entities/stripe-transfer-state.entity';
import { BookingRequest, BookingRequestStatus } from '../booking/entities/booking-request.entity';
import { BookingServiceReceipt } from '../booking/entities/booking-service-receipt.entity';
import { Resolution } from '../dispute/entities/resolution.entity';
import { Dispute } from '../dispute/entities/dispute.entity';
import { WelperPayoutLedger } from './entities/welper-payout-ledger.entity';
import { WelperPayoutLedgerStatus } from './entities/payout-ledger-status.enum';
import { computeWelperRefundShareCents } from '../booking/booking-pricing';
import { WelperPayoutLedgerService } from './welper-payout-ledger.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationCategory } from '../notification/entities';

export type RefundAllocation = {
  paymentIntentId: string;
  chargeId: string;
  capturedCents: number;
  refundedCents: number;
  refundableCents: number;
  recommendedRefundCents: number;
  stripeDashboardUrl: string;
};

export type RefundDecisionSnapshot = {
  capturedTotalCents: number;
  refundedBaselineCents: number;
  additionalRefundTargetCents: number;
  currency: string;
  allocation: RefundAllocation[];
};

export type PaymentRecoveryTaskSummary = {
  id: string;
  bookingId: string;
  resolutionId: string;
  stripeTransferId: string;
  requiredReversalCents: number;
  recoveredCents: number;
  outstandingCents: number;
  status: string;
  stripeDashboardUrl: string;
  exceptionMessage: string | null;
  createdAt: string;
};

@Injectable()
export class StripeOperationsService {
  private readonly logger = new Logger(StripeOperationsService.name);
  private readonly stripe: Stripe | null;
  private readonly liveMode: boolean;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(BookingPayment)
    private readonly bookingPaymentRepo: Repository<BookingPayment>,
    @InjectRepository(BookingRefund)
    private readonly bookingRefundRepo: Repository<BookingRefund>,
    @InjectRepository(PaymentRecoveryTask)
    private readonly recoveryTaskRepo: Repository<PaymentRecoveryTask>,
    @InjectRepository(StripeTransferState)
    private readonly transferStateRepo: Repository<StripeTransferState>,
    @InjectRepository(BookingRequest)
    private readonly bookingRepo: Repository<BookingRequest>,
    @InjectRepository(BookingServiceReceipt)
    private readonly receiptRepo: Repository<BookingServiceReceipt>,
    @InjectRepository(Resolution)
    private readonly resolutionRepo: Repository<Resolution>,
    @InjectRepository(Dispute)
    private readonly disputeRepo: Repository<Dispute>,
    @InjectRepository(WelperPayoutLedger)
    private readonly ledgerRepo: Repository<WelperPayoutLedger>,
    private readonly ledgerService: WelperPayoutLedgerService,
    private readonly notificationService: NotificationService,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    this.stripe = key ? createStripeClient(key) : null;
    this.liveMode = key?.startsWith('sk_live_') === true;
  }

  private requireStripe(): Stripe {
    if (!this.stripe) throw new BadRequestException('Stripe is not configured');
    return this.stripe;
  }

  private paymentDashboardUrl(paymentIntentId: string): string {
    return `https://dashboard.stripe.com/${this.liveMode ? '' : 'test/'}payments/${paymentIntentId}`;
  }

  private transferDashboardUrl(transferId: string): string {
    return `https://dashboard.stripe.com/${this.liveMode ? '' : 'test/'}connect/transfers/${transferId}`;
  }

  async listOpenRecoveryTasks(): Promise<PaymentRecoveryTaskSummary[]> {
    const tasks = await this.recoveryTaskRepo.find({
      where: { status: In(['open', 'partial']) },
      order: { createdAt: 'ASC' },
    });
    return tasks.map((task) => ({
      id: task.id,
      bookingId: task.bookingId,
      resolutionId: task.resolutionId,
      stripeTransferId: task.stripeTransferId,
      requiredReversalCents: task.requiredReversalCents,
      recoveredCents: task.recoveredCents,
      outstandingCents: Math.max(0, task.requiredReversalCents - task.recoveredCents),
      status: task.status,
      stripeDashboardUrl: task.stripeDashboardUrl,
      exceptionMessage: task.exceptionMessage,
      createdAt: task.createdAt.toISOString(),
    }));
  }

  async getRecoveryTaskForResolution(resolutionId: string): Promise<PaymentRecoveryTaskSummary | null> {
    const task = await this.recoveryTaskRepo.findOne({ where: { resolutionId } });
    if (!task) return null;
    return {
      id: task.id,
      bookingId: task.bookingId,
      resolutionId: task.resolutionId,
      stripeTransferId: task.stripeTransferId,
      requiredReversalCents: task.requiredReversalCents,
      recoveredCents: task.recoveredCents,
      outstandingCents: Math.max(0, task.requiredReversalCents - task.recoveredCents),
      status: task.status,
      stripeDashboardUrl: task.stripeDashboardUrl,
      exceptionMessage: task.exceptionMessage,
      createdAt: task.createdAt.toISOString(),
    };
  }

  async getRefundDecisionSnapshot(
    bookingId: string,
    requestedTargetCents?: number,
  ): Promise<RefundDecisionSnapshot> {
    const stripe = this.requireStripe();
    const rows = await this.bookingPaymentRepo.find({
      where: { bookingId },
      order: { createdAt: 'ASC' },
    });
    const capturedRows = rows.filter((row) => row.capturedAt != null);
    if (capturedRows.length === 0) throw new BadRequestException('No captured payments exist for this booking');

    const chargeRows: Array<RefundAllocation & { createdAt: Date }> = [];
    for (const row of capturedRows) {
      const pi = await stripe.paymentIntents.retrieve(row.stripePaymentIntentId, {
        expand: ['latest_charge'],
      });
      const latestCharge = pi.latest_charge;
      const charge =
        typeof latestCharge === 'string'
          ? await stripe.charges.retrieve(latestCharge)
          : latestCharge && typeof latestCharge === 'object'
            ? latestCharge
            : null;
      if (!charge) continue;
      chargeRows.push({
        paymentIntentId: row.stripePaymentIntentId,
        chargeId: charge.id,
        capturedCents: charge.amount,
        refundedCents: charge.amount_refunded,
        refundableCents: Math.max(0, charge.amount - charge.amount_refunded),
        recommendedRefundCents: 0,
        stripeDashboardUrl: this.paymentDashboardUrl(row.stripePaymentIntentId),
        createdAt: row.createdAt,
      });
      const refunds = await stripe.refunds.list({ charge: charge.id, limit: 100 });
      for (const refund of refunds.data) {
        await this.syncRefund(refund, { reconcile: false });
      }
    }

    const capturedTotalCents = chargeRows.reduce((sum, row) => sum + row.capturedCents, 0);
    const refundedBaselineCents = chargeRows.reduce((sum, row) => sum + row.refundedCents, 0);
    const remainingRefundable = chargeRows.reduce((sum, row) => sum + row.refundableCents, 0);
    const additionalRefundTargetCents = requestedTargetCents ?? remainingRefundable;
    if (additionalRefundTargetCents <= 0) {
      throw new BadRequestException('No refundable balance remains for this booking');
    }
    if (additionalRefundTargetCents > remainingRefundable) {
      throw new BadRequestException(`Refund target exceeds the remaining refundable amount (${remainingRefundable})`);
    }

    let remaining = additionalRefundTargetCents;
    const allocation = [...chargeRows]
      .sort((a, b) => +b.createdAt - +a.createdAt)
      .map(({ createdAt: _createdAt, ...row }) => {
        const recommendedRefundCents = Math.min(remaining, row.refundableCents);
        remaining -= recommendedRefundCents;
        return { ...row, recommendedRefundCents };
      });

    return {
      capturedTotalCents,
      refundedBaselineCents,
      additionalRefundTargetCents,
      currency: capturedRows[capturedRows.length - 1]?.currency ?? 'cad',
      allocation,
    };
  }

  async syncRefund(refund: Stripe.Refund, options?: { reconcile?: boolean }): Promise<BookingRefund | null> {
    const stripe = this.requireStripe();
    const paymentIntentId =
      typeof refund.payment_intent === 'string'
        ? refund.payment_intent
        : refund.payment_intent?.id ??
          (typeof refund.charge === 'string'
            ? ((await stripe.charges.retrieve(refund.charge)).payment_intent as string | null)
            : typeof refund.charge === 'object' && refund.charge
              ? typeof refund.charge.payment_intent === 'string'
                ? refund.charge.payment_intent
                : refund.charge.payment_intent?.id
              : null);
    if (!paymentIntentId) return null;

    const payment = await this.bookingPaymentRepo.findOne({
      where: { stripePaymentIntentId: paymentIntentId },
    });
    if (!payment) return null;
    const chargeId = typeof refund.charge === 'string' ? refund.charge : refund.charge?.id;
    if (!chargeId) return null;

    const activeResolution = await this.resolutionRepo
      .createQueryBuilder('resolution')
      .innerJoin(Dispute, 'dispute', 'dispute.id = resolution.dispute_id')
      .where('dispute.booking_id = :bookingId', { bookingId: payment.bookingId })
      .andWhere('resolution.workflow_status IN (:...statuses)', {
        statuses: ['awaiting_refund', 'awaiting_recovery', 'exception'],
      })
      .orderBy('resolution.created_at', 'DESC')
      .getOne();

    let row = await this.bookingRefundRepo.findOne({ where: { stripeRefundId: refund.id } });
    const previousStatus = row?.status;
    if (!row) {
      row = this.bookingRefundRepo.create({
        bookingId: payment.bookingId,
        resolutionId: activeResolution?.id ?? null,
        stripeRefundId: refund.id,
        stripeChargeId: chargeId,
        stripePaymentIntentId: paymentIntentId,
        amountCents: refund.amount,
        currency: refund.currency,
        status: refund.status ?? 'pending',
        failureReason: refund.failure_reason ?? null,
        initiatedAt: new Date(refund.created * 1000),
        succeededAt: refund.status === 'succeeded' ? new Date() : null,
        taxReversalStatus: null,
        stripeTaxReversalId: null,
        taxReversalError: null,
      });
    } else {
      row.resolutionId ??= activeResolution?.id ?? null;
      row.amountCents = refund.amount;
      row.status = refund.status ?? 'pending';
      row.failureReason = refund.failure_reason ?? null;
      if (refund.status === 'succeeded' && !row.succeededAt) row.succeededAt = new Date();
    }
    row = await this.bookingRefundRepo.save(row);

    if (row.status === 'succeeded' && previousStatus !== 'succeeded') {
      const succeededForPayment = await this.bookingRefundRepo.find({
        where: { stripePaymentIntentId: paymentIntentId, status: 'succeeded' },
      });
      const confirmedForPayment = succeededForPayment.reduce((sum, item) => sum + item.amountCents, 0);
      const previousRefunded = payment.refundedAmountCents ?? 0;
      payment.refundedAmountCents = confirmedForPayment;
      const capturedAmount = payment.capturedAmountCents ?? payment.amountCents;
      if (capturedAmount > 0 && confirmedForPayment >= capturedAmount) {
        payment.fullyRefundedAt ??= new Date();
      }
      await this.bookingPaymentRepo.save(payment);
      const refundDelta = Math.max(0, confirmedForPayment - previousRefunded);
      if (refundDelta > 0) {
        await this.ledgerService.applyRefundDelta(payment.bookingId, refundDelta);
        try {
          await this.notificationService.emitForUser(payment.customerId, {
            category: NotificationCategory.PAYMENT,
            title: 'Refund issued',
            body: `A refund of CAD ${(refundDelta / 100).toFixed(2)} was issued in Stripe.`,
            metadata: {
              bookingId: payment.bookingId,
              stripeRefundId: refund.id,
              amountCents: refundDelta,
              kind: 'refund',
            },
          });
        } catch (err) {
          this.logger.warn(`Failed to notify refund ${refund.id}: ${(err as Error).message}`);
        }
      }
      await this.recordTaxReversal(row);
    }
    if (options?.reconcile !== false) {
      await this.reconcileRefundWorkflow(payment.bookingId);
    }
    return row;
  }

  async syncChargeRefunds(charge: Stripe.Charge): Promise<void> {
    const stripe = this.requireStripe();
    const refunds = await stripe.refunds.list({ charge: charge.id, limit: 100 });
    for (const refund of refunds.data) {
      await this.syncRefund(refund, { reconcile: false });
    }
    const pi = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
    if (!pi) return;
    const payment = await this.bookingPaymentRepo.findOne({ where: { stripePaymentIntentId: pi } });
    if (payment) await this.reconcileRefundWorkflow(payment.bookingId);
  }

  async reconcileBookingRefunds(bookingId: string): Promise<void> {
    const stripe = this.requireStripe();
    const payments = await this.bookingPaymentRepo.find({ where: { bookingId } });
    for (const payment of payments.filter((row) => row.capturedAt != null)) {
      const pi = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId, {
        expand: ['latest_charge'],
      });
      const charge =
        typeof pi.latest_charge === 'string'
          ? await stripe.charges.retrieve(pi.latest_charge)
          : pi.latest_charge && typeof pi.latest_charge === 'object'
            ? pi.latest_charge
            : null;
      if (charge) await this.syncChargeRefunds(charge);
    }
    await this.reconcileRefundWorkflow(bookingId);
  }

  async reconcileRefundWorkflow(bookingId: string): Promise<void> {
    const dispute = await this.disputeRepo.findOne({
      where: { bookingId, status: In(['awaiting_refund', 'awaiting_recovery'] as never[]) },
      order: { createdAt: 'DESC' },
    });
    if (!dispute) return;
    const resolution = await this.resolutionRepo.findOne({ where: { disputeId: dispute.id } });
    if (!resolution || !resolution.refundTargetCents) return;

    const successful = await this.bookingRefundRepo.find({
      where: { bookingId, status: 'succeeded' },
    });
    const totalSucceeded = successful.reduce((sum, row) => sum + row.amountCents, 0);
    const confirmed = Math.max(0, totalSucceeded - (resolution.refundBaselineCents ?? 0));
    resolution.refundConfirmedCents = confirmed;
    resolution.refundStatus = confirmed >= resolution.refundTargetCents ? 'succeeded' : 'pending';
    resolution.stripeLastSyncedAt = new Date();
    resolution.refundException =
      confirmed > resolution.refundTargetCents
        ? `Confirmed refunds exceed the decision target by ${confirmed - resolution.refundTargetCents} cents`
        : null;

    if (resolution.refundException) {
      resolution.workflowStatus = 'exception';
      dispute.status = 'awaiting_refund';
      await Promise.all([this.resolutionRepo.save(resolution), this.disputeRepo.save(dispute)]);
      return;
    }

    if (confirmed < resolution.refundTargetCents) {
      resolution.workflowStatus = 'awaiting_refund';
      dispute.status = 'awaiting_refund';
      await Promise.all([this.resolutionRepo.save(resolution), this.disputeRepo.save(dispute)]);
      return;
    }

    const ledger = await this.ledgerRepo.findOne({ where: { bookingId } });
    if (ledger?.status === WelperPayoutLedgerStatus.TRANSFERRED && ledger.stripeTransferId) {
      const required = computeWelperRefundShareCents(
        resolution.refundTargetCents,
        ledger.customerSubtotalCents,
        ledger.customerTotalCents,
      );
      let task = await this.recoveryTaskRepo.findOne({ where: { resolutionId: resolution.id } });
      if (!task) {
        task = this.recoveryTaskRepo.create({
          bookingId,
          resolutionId: resolution.id,
          stripeTransferId: ledger.stripeTransferId,
          requiredReversalCents: required,
          recoveredCents: 0,
          status: required > 0 ? 'open' : 'completed',
          stripeDashboardUrl: this.transferDashboardUrl(ledger.stripeTransferId),
          exceptionMessage: null,
          completedAt: required > 0 ? null : new Date(),
        });
        await this.recoveryTaskRepo.save(task);
      }
      if (task.status !== 'completed') {
        resolution.workflowStatus = 'awaiting_recovery';
        dispute.status = 'awaiting_recovery';
        await Promise.all([this.resolutionRepo.save(resolution), this.disputeRepo.save(dispute)]);
        return;
      }
    }

    await this.finalizeRefundResolution(dispute, resolution);
  }

  async syncTransfer(transfer: Stripe.Transfer): Promise<void> {
    let state = await this.transferStateRepo.findOne({
      where: { stripeTransferId: transfer.id },
    });
    const previousReversed = state?.amountReversedCents ?? 0;
    const destination =
      typeof transfer.destination === 'string' ? transfer.destination : transfer.destination?.id ?? null;
    if (!state) {
      state = this.transferStateRepo.create({
        stripeTransferId: transfer.id,
        amountCents: transfer.amount,
        amountReversedCents: transfer.amount_reversed,
        destinationAccountId: destination,
        payoutBatchId: transfer.metadata?.batchId ?? transfer.transfer_group ?? null,
        welperId: transfer.metadata?.welperId ?? null,
        lastEventAt: new Date(),
      });
    } else {
      state.amountCents = transfer.amount;
      state.amountReversedCents = transfer.amount_reversed;
      state.destinationAccountId = destination;
      state.lastEventAt = new Date();
    }
    await this.transferStateRepo.save(state);

    let delta = Math.max(0, transfer.amount_reversed - previousReversed);
    if (delta <= 0) return;
    const tasks = await this.recoveryTaskRepo.find({
      where: { stripeTransferId: transfer.id, status: In(['open', 'partial']) },
      order: { createdAt: 'ASC' },
    });
    for (const task of tasks) {
      if (delta <= 0) break;
      const outstanding = Math.max(0, task.requiredReversalCents - task.recoveredCents);
      const applied = Math.min(outstanding, delta);
      task.recoveredCents += applied;
      delta -= applied;
      if (task.recoveredCents >= task.requiredReversalCents) {
        task.status = 'completed';
        task.completedAt = new Date();
      } else {
        task.status = 'partial';
      }
      await this.recoveryTaskRepo.save(task);
      if (task.status === 'completed') {
        const resolution = await this.resolutionRepo.findOne({ where: { id: task.resolutionId } });
        const dispute = resolution
          ? await this.disputeRepo.findOne({ where: { id: resolution.disputeId } })
          : null;
        if (resolution && dispute) await this.finalizeRefundResolution(dispute, resolution);
      }
    }
  }

  async reconcileTransferById(transferId: string): Promise<void> {
    const transfer = await this.requireStripe().transfers.retrieve(transferId);
    await this.syncTransfer(transfer);
  }

  async ensureTaxTransaction(bookingId: string): Promise<boolean> {
    const stripe = this.requireStripe();
    const receipt = await this.receiptRepo.findOne({ where: { bookingId } });
    if (!receipt?.stripeTaxCalculationId) return false;
    if (receipt.stripeTaxTransactionStatus === 'succeeded' && receipt.stripeTaxTransactionId) return true;
    receipt.stripeTaxTransactionStatus = 'pending';
    receipt.stripeTaxTransactionError = null;
    await this.receiptRepo.save(receipt);
    try {
      const transaction = await stripe.tax.transactions.createFromCalculation(
        {
          calculation: receipt.stripeTaxCalculationId,
          reference: `booking-${bookingId}`,
          metadata: { bookingId, receiptId: receipt.id },
          posted_at: Math.floor((receipt.confirmedAt ?? new Date()).getTime() / 1000),
        },
        { idempotencyKey: `tax-transaction-booking-${bookingId}` },
      );
      receipt.stripeTaxTransactionId = transaction.id;
      receipt.stripeTaxTransactionStatus = 'succeeded';
      await this.receiptRepo.save(receipt);
      return true;
    } catch (err) {
      receipt.stripeTaxTransactionStatus = 'failed';
      receipt.stripeTaxTransactionError = (err as Error).message;
      await this.receiptRepo.save(receipt);
      this.logger.warn(`Stripe Tax transaction failed for booking ${bookingId}: ${(err as Error).message}`);
      return false;
    }
  }

  async retryPendingTaxTransactions(limit = 50): Promise<{
    scanned: number;
    recovered: number;
    reversalScanned: number;
    reversalRecovered: number;
  }> {
    const receipts = await this.receiptRepo
      .createQueryBuilder('receipt')
      .where('receipt.stripe_tax_calculation_id IS NOT NULL')
      .andWhere(
        "(receipt.stripe_tax_transaction_status IS NULL OR receipt.stripe_tax_transaction_status != 'succeeded')",
      )
      .orderBy('receipt.updated_at', 'ASC')
      .take(Math.min(Math.max(limit, 1), 200))
      .getMany();
    let recovered = 0;
    for (const receipt of receipts) {
      if (await this.ensureTaxTransaction(receipt.bookingId)) {
        recovered += 1;
        await this.ledgerService.createLedgerForPaymentReleased(receipt.bookingId);
      }
    }
    const reversalResult = await this.retryPendingTaxReversals(limit);
    return {
      scanned: receipts.length,
      recovered,
      reversalScanned: reversalResult.scanned,
      reversalRecovered: reversalResult.recovered,
    };
  }

  async retryPendingTaxReversals(limit = 50): Promise<{ scanned: number; recovered: number }> {
    const refunds = await this.bookingRefundRepo
      .createQueryBuilder('refund')
      .where("refund.status = 'succeeded'")
      .andWhere(
        "(refund.tax_reversal_status IS NULL OR refund.tax_reversal_status != 'succeeded')",
      )
      .orderBy('refund.updated_at', 'ASC')
      .take(Math.min(Math.max(limit, 1), 200))
      .getMany();
    let recovered = 0;
    for (const refund of refunds) {
      await this.recordTaxReversal(refund);
      if (refund.taxReversalStatus === 'succeeded') recovered += 1;
    }
    return { scanned: refunds.length, recovered };
  }

  private async recordTaxReversal(refund: BookingRefund): Promise<void> {
    const stripe = this.requireStripe();
    const receipt = await this.receiptRepo.findOne({ where: { bookingId: refund.bookingId } });
    if (!receipt?.stripeTaxTransactionId) {
      refund.taxReversalStatus = 'waiting_for_transaction';
      await this.bookingRefundRepo.save(refund);
      return;
    }
    if (refund.taxReversalStatus === 'succeeded') return;
    refund.taxReversalStatus = 'pending';
    refund.taxReversalError = null;
    await this.bookingRefundRepo.save(refund);
    try {
      const fullRefund = refund.amountCents >= receipt.totalCents;
      const reversal = await stripe.tax.transactions.createReversal(
        {
          mode: fullRefund ? 'full' : 'partial',
          original_transaction: receipt.stripeTaxTransactionId,
          reference: `refund-${refund.stripeRefundId}`,
          ...(fullRefund ? {} : { flat_amount: -refund.amountCents }),
          metadata: {
            bookingId: refund.bookingId,
            stripeRefundId: refund.stripeRefundId,
          },
        },
        { idempotencyKey: `tax-reversal-${refund.stripeRefundId}` },
      );
      refund.stripeTaxReversalId = reversal.id;
      refund.taxReversalStatus = 'succeeded';
      await this.bookingRefundRepo.save(refund);
    } catch (err) {
      refund.taxReversalStatus = 'failed';
      refund.taxReversalError = (err as Error).message;
      await this.bookingRefundRepo.save(refund);
      this.logger.warn(`Stripe Tax reversal failed for refund ${refund.stripeRefundId}: ${(err as Error).message}`);
    }
  }

  private async finalizeRefundResolution(dispute: Dispute, resolution: Resolution): Promise<void> {
    const booking = await this.bookingRepo.findOne({ where: { id: dispute.bookingId } });
    if (!booking) throw new NotFoundException('Booking not found for refund resolution');
    const outcome = resolution.pendingBookingOutcome === 'cancelled' ? 'cancelled' : 'completed';
    booking.status =
      outcome === 'cancelled' ? BookingRequestStatus.CANCELLED : BookingRequestStatus.COMPLETED;
    if (outcome === 'cancelled') {
      booking.cancelledAt ??= new Date();
      booking.cancellationReason ??= resolution.notes ?? 'Resolved with external Stripe refund';
    }
    dispute.status = 'resolved';
    resolution.workflowStatus = 'completed';
    resolution.refundStatus = 'succeeded';
    resolution.refundException = null;
    await Promise.all([
      this.bookingRepo.save(booking),
      this.disputeRepo.save(dispute),
      this.resolutionRepo.save(resolution),
    ]);
    if (outcome === 'completed') {
      await this.ledgerService.restoreAfterDisputeResolved(booking.id);
    }
    for (const userId of [booking.customerId, booking.welperId]) {
      try {
        await this.notificationService.emitForUser(userId, {
          category: NotificationCategory.DISPUTE,
          title: 'Dispute resolved',
          body: 'The refund and any required payout recovery have been confirmed.',
          metadata: {
            bookingId: booking.id,
            disputeId: dispute.id,
            kind: 'external_refund_confirmed',
          },
        });
      } catch (err) {
        this.logger.warn(`Failed to notify refund finalization for ${userId}: ${(err as Error).message}`);
      }
    }
  }
}
