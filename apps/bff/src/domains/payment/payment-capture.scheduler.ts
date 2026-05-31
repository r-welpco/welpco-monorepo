import { Injectable, Logger } from '@nestjs/common';
// import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentService } from './payment.service';

/**
 * Delayed capture sweep (capture_eligible_at → Stripe capture).
 *
 * Disabled for now: the live checkout path captures synchronously in
 * `captureForServiceReceipt()` when the welper submits the service receipt.
 * `onBookingServiceCompleted()` (which sets capture_eligible_at) is not wired yet.
 *
 * Re-enable `@Cron` below when delayed capture after completion is product-active.
 */
@Injectable()
export class PaymentCaptureScheduler {
  private readonly logger = new Logger(PaymentCaptureScheduler.name);

  constructor(private readonly paymentService: PaymentService) {}

  // @Cron(CronExpression.EVERY_MINUTE)
  // async runDueCaptures(): Promise<void> {
  //   try {
  //     await this.paymentService.processDueCaptures();
  //   } catch (e) {
  //     this.logger.warn(`processDueCaptures: ${(e as Error).message}`);
  //   }
  // }
}
