import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentService } from './payment.service';

@Injectable()
export class PaymentCaptureScheduler {
  private readonly logger = new Logger(PaymentCaptureScheduler.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async runDueCaptures(): Promise<void> {
    try {
      await this.paymentService.processDueCaptures();
    } catch (e) {
      this.logger.warn(`processDueCaptures: ${(e as Error).message}`);
    }
    // NOTE: PaymentIntent reconciliation is intentionally disabled for now to
    // keep the payment flow simple. If webhooks prove unreliable in production,
    // we can re-enable a lightweight reconciliation pass here.
  }
}
