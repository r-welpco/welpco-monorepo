import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PaymentService } from './payment.service';

/**
 * Deferred booking authorization and stale Stripe reconciliation.
 */
@Injectable()
export class PaymentCaptureScheduler {
  private readonly logger = new Logger(PaymentCaptureScheduler.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Cron('*/15 * * * *')
  async runPaymentOperations(): Promise<void> {
    try {
      await this.paymentService.processDeferredAuthorizations();
      await this.paymentService.cancelExpiredAuthorizationBookings();
      await this.paymentService.reconcileStalePaymentRows();
      await this.paymentService.retryPendingTaxTransactions();
    } catch (e) {
      this.logger.warn(`payment operations scheduler: ${(e as Error).message}`);
    }
  }
}
