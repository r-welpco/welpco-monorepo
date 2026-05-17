import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { createStripeClient } from '../payment/stripe-client';
import { UserAccount } from '../user-management/entities/user-account.entity';
import {
  BackgroundCheckOrder,
  BackgroundCheckPaymentStatus,
} from './entities/background-check-order.entity';
import { BackgroundCheckPricingService } from './background-check-pricing.service';
import { BackgroundCheckService } from './background-check.service';
import {
  E2E_BG_CHECK_SESSION_PREFIX,
  signupE2eBypassAllowed,
} from '../../common/signup-e2e-bypass';

export const BACKGROUND_CHECK_CHECKOUT_PURPOSE = 'background_check';

export interface BackgroundCheckCheckoutOptions {
  locale?: 'en' | 'fr';
  e2eBypass?: boolean;
}

@Injectable()
export class BackgroundCheckPaymentService {
  private readonly logger = new Logger(BackgroundCheckPaymentService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly pricingService: BackgroundCheckPricingService,
    @InjectRepository(BackgroundCheckOrder)
    private readonly orderRepo: Repository<BackgroundCheckOrder>,
    @InjectRepository(UserAccount)
    private readonly userRepo: Repository<UserAccount>,
    private readonly backgroundCheckService: BackgroundCheckService,
  ) {}

  private stripe(): Stripe {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!key) {
      throw new BadRequestException('Stripe is not configured');
    }
    return createStripeClient(key);
  }

  private backgroundCheckStepPath(locale: string): string {
    const prefix = locale === 'fr' ? '/fr' : '';
    return `${prefix}/register/step/background-check`;
  }

  async createCheckoutSession(
    userId: string,
    options: BackgroundCheckCheckoutOptions = {},
  ): Promise<{ url: string; sessionId: string }> {
    const locale = options.locale ?? 'en';
    await this.backgroundCheckService.assertAdultWelper(userId);
    await this.backgroundCheckService.markAdultPendingIfNeeded(userId);

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const pricing = await this.pricingService.getPricing();
    let order = await this.orderRepo.findOne({ where: { userId } });
    if (!order) {
      order = this.orderRepo.create({
        userId,
        amountCents: pricing.chargePriceCents,
        listAmountCents: pricing.listPriceCents,
        currency: pricing.currency,
        paymentStatus: BackgroundCheckPaymentStatus.PENDING,
      });
      await this.orderRepo.save(order);
    } else if (order.paymentStatus === BackgroundCheckPaymentStatus.PAID) {
      throw new BadRequestException('Background check fee is already paid');
    } else {
      order.amountCents = pricing.chargePriceCents;
      order.listAmountCents = pricing.listPriceCents;
      await this.orderRepo.save(order);
    }

    const baseUrl = this.config.get<string>('FRONTEND_URL') || 'http://localhost:8081';
    const stepPath = this.backgroundCheckStepPath(locale);
    const successUrl = `${baseUrl}${stepPath}?payment=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}${stepPath}?payment=cancelled`;

    if (signupE2eBypassAllowed(options.e2eBypass === true)) {
      const sessionId = `${E2E_BG_CHECK_SESSION_PREFIX}${order.id}`;
      order.stripeCheckoutSessionId = sessionId;
      await this.orderRepo.save(order);
      return {
        url: `${baseUrl}${stepPath}?payment=success&session_id=${sessionId}`,
        sessionId,
      };
    }

    const stripe = this.stripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      allow_promotion_codes: true,
      automatic_tax: { enabled: true },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: pricing.currency.toLowerCase(),
            unit_amount: pricing.chargePriceCents,
            tax_behavior: 'exclusive',
            product_data: {
              name: 'Welpco background check',
              description: 'Basic Canadian criminal record check (before tax)',
            },
          },
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        purpose: BACKGROUND_CHECK_CHECKOUT_PURPOSE,
        userId,
        orderId: order.id,
      },
    });

    if (!session.url) {
      throw new BadRequestException('Stripe did not return a checkout URL');
    }

    order.stripeCheckoutSessionId = session.id;
    await this.orderRepo.save(order);

    return { url: session.url, sessionId: session.id };
  }

  async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const purpose = session.metadata?.purpose;
    if (purpose !== BACKGROUND_CHECK_CHECKOUT_PURPOSE) return;

    const userId = session.metadata?.userId;
    const orderId = session.metadata?.orderId;
    if (!userId || !orderId) {
      this.logger.warn('Background check checkout missing metadata');
      return;
    }

    await this.markOrderPaidFromSession(session, userId, orderId);
  }

  async confirmReturn(
    userId: string,
    sessionId: string,
    options: { e2eBypass?: boolean } = {},
  ): Promise<void> {
    if (
      signupE2eBypassAllowed(options.e2eBypass === true) &&
      sessionId.startsWith(E2E_BG_CHECK_SESSION_PREFIX)
    ) {
      const orderId = sessionId.slice(E2E_BG_CHECK_SESSION_PREFIX.length);
      const order = await this.orderRepo.findOne({ where: { id: orderId, userId } });
      if (!order) {
        throw new BadRequestException('E2E background check order not found');
      }
      await this.markOrderPaidFromSession(
        { id: sessionId, payment_intent: null } as Stripe.Checkout.Session,
        userId,
        order.id,
      );
      return;
    }

    const stripe = this.stripe();
    let session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.userId !== userId) {
      throw new BadRequestException('Checkout session does not belong to this user');
    }
    if (session.metadata?.purpose !== BACKGROUND_CHECK_CHECKOUT_PURPOSE) {
      throw new BadRequestException('Invalid checkout session type');
    }
    // Stripe may redirect before payment_status flips to paid — brief retry for local dev.
    if (session.payment_status !== 'paid') {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      session = await stripe.checkout.sessions.retrieve(sessionId);
    }
    if (session.payment_status !== 'paid') {
      throw new BadRequestException('Payment has not completed yet');
    }
    const orderId = session.metadata?.orderId;
    if (!orderId) throw new BadRequestException('Checkout session missing order reference');
    await this.markOrderPaidFromSession(session, userId, orderId);
  }

  private async markOrderPaidFromSession(
    session: Stripe.Checkout.Session,
    userId: string,
    orderId: string,
  ): Promise<void> {
    const order = await this.orderRepo.findOne({ where: { id: orderId, userId } });
    if (!order) {
      this.logger.warn(`Background check order ${orderId} not found for user ${userId}`);
      return;
    }

    const alreadyPaid = order.paymentStatus === BackgroundCheckPaymentStatus.PAID;

    if (!alreadyPaid) {
      order.paymentStatus = BackgroundCheckPaymentStatus.PAID;
      order.paidAt = new Date();
    }

    order.stripeCheckoutSessionId = session.id;
    const pi = session.payment_intent;
    order.stripePaymentIntentId =
      typeof pi === 'string' ? pi : (pi as Stripe.PaymentIntent | null)?.id ?? null;
    await this.orderRepo.save(order);

    // Always run — if Certn invite failed earlier, webhook/confirm retries must not skip it.
    await this.backgroundCheckService.onPaymentSucceeded(order.id);
  }
}
