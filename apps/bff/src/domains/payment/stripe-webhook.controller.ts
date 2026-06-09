import {
  Controller,
  Post,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
  HttpException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Request } from 'express';

type RequestWithRawBody = Request & { rawBody?: Buffer };
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { PaymentService } from './payment.service';
import { PayoutBatchService } from './payout-batch.service';
import { createStripeClient } from './stripe-client';
import { BackgroundCheckPaymentService } from '../safety-verification/background-check-payment.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly paymentService: PaymentService,
    private readonly payoutBatchService: PayoutBatchService,
    private readonly backgroundCheckPaymentService: BackgroundCheckPaymentService,
  ) {}

  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Stripe webhook (signature verified)',
    description:
      'Configure events including checkout.session.completed (background check), payment_intent.*, setup_intent.succeeded, charge.refunded, transfer.created, transfer.reversed, and payout.failed.',
  })
  async handleStripe(
    @Req() req: RequestWithRawBody,
    @Headers('stripe-signature') signature: string | undefined,
  ) {
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!secret || !key) {
      this.logger.error(
        'Stripe webhook rejected: STRIPE_WEBHOOK_SECRET and STRIPE_SECRET_KEY must both be set',
      );
      throw new HttpException(
        'Stripe webhook is not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    const raw = req.rawBody;
    if (!raw || !Buffer.isBuffer(raw)) {
      throw new BadRequestException('Missing raw body for webhook verification');
    }
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }
    const stripe = createStripeClient(key);
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(raw, signature, secret);
    } catch (err) {
      this.logger.warn(`Webhook signature: ${(err as Error).message}`);
      throw new BadRequestException('Invalid webhook signature');
    }
    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.purpose === 'background_check') {
          await this.backgroundCheckPaymentService.handleCheckoutSessionCompleted(session);
          return { received: true };
        }
      }
      await this.paymentService.processWebhookEvent(event);
      if (event.type === 'transfer.created') {
        await this.payoutBatchService.handleTransferWebhook(
          event.data.object as Stripe.Transfer,
        );
      } else if (event.type === 'transfer.reversed') {
        await this.payoutBatchService.handleTransferReversed(
          event.data.object as Stripe.Transfer,
        );
      } else if (event.type === 'payout.failed') {
        const payout = event.data.object as Stripe.Payout;
        this.logger.warn(
          `Stripe Connect payout.failed: id=${payout.id} amount=${payout.amount} destination=${typeof payout.destination === 'string' ? payout.destination : payout.destination?.id ?? 'unknown'}`,
        );
      }
    } catch (e) {
      this.logger.error(`Webhook processing failed: ${(e as Error).message}`);
      throw new HttpException('Webhook processing failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return { received: true };
  }
}
