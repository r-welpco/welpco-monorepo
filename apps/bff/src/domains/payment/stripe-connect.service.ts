import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WelperProfile } from '../profile-management/entities/welper-profile.entity';
import { PayoutMethodChoice } from '../profile-management/entities/payout-method-choice.enum';
import { UserAccount } from '../user-management/entities/user-account.entity';
import { createStripeClient } from './stripe-client';
import {
  E2E_STRIPE_CONNECT_ACCOUNT_PREFIX,
  signupE2eBypassAllowed,
} from '../../common/signup-e2e-bypass';

export interface StripeConnectLinkOptions {
  e2eBypass?: boolean;
}

export interface StripeConnectStatus {
  hasAccount: boolean;
  onboardingComplete: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}

@Injectable()
export class StripeConnectService {
  private readonly logger = new Logger(StripeConnectService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(WelperProfile)
    private readonly welperProfileRepo: Repository<WelperProfile>,
    @InjectRepository(UserAccount)
    private readonly userRepo: Repository<UserAccount>,
  ) {}

  private stripe() {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!key) {
      throw new BadRequestException('Stripe is not configured');
    }
    return createStripeClient(key);
  }

  private frontendBase(): string {
    return this.config.get<string>('FRONTEND_URL') || 'http://localhost:8081';
  }

  private payoutStepPath(locale: string): string {
    const prefix = locale === 'fr' ? '/fr' : '';
    return `${prefix}/dashboard/profile?tab=payout`;
  }

  private isE2eConnectAccount(accountId: string): boolean {
    return accountId.startsWith(E2E_STRIPE_CONNECT_ACCOUNT_PREFIX);
  }

  private e2eConnectStatus(): StripeConnectStatus {
    return {
      hasAccount: true,
      onboardingComplete: true,
      chargesEnabled: true,
      payoutsEnabled: true,
      detailsSubmitted: true,
    };
  }

  async getStatus(userId: string): Promise<StripeConnectStatus> {
    const profile = await this.requireWelperProfile(userId);
    if (!profile.stripeConnectAccountId) {
      return {
        hasAccount: false,
        onboardingComplete: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
      };
    }
    const status = this.isE2eConnectAccount(profile.stripeConnectAccountId)
      ? this.e2eConnectStatus()
      : await this.fetchAccountStatus(profile.stripeConnectAccountId);
    await this.persistPayoutChoiceIfOnboardingComplete(profile, status);
    return status;
  }

  async syncAccount(userId: string): Promise<StripeConnectStatus> {
    const profile = await this.requireWelperProfile(userId);
    if (!profile.stripeConnectAccountId) {
      throw new BadRequestException('No Stripe Connect account exists yet');
    }
    const status = await this.fetchAccountStatus(profile.stripeConnectAccountId);
    await this.persistPayoutChoiceIfOnboardingComplete(profile, status);
    return status;
  }

  async isOnboardingComplete(userId: string): Promise<boolean> {
    const status = await this.getStatus(userId);
    return status.onboardingComplete;
  }

  async createAccountLink(
    userId: string,
    locale = 'en',
    options: StripeConnectLinkOptions = {},
  ): Promise<{ url: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const profile = await this.requireWelperProfile(userId);
    const base = this.frontendBase();
    const stepPath = this.payoutStepPath(locale);

    if (signupE2eBypassAllowed(options.e2eBypass === true)) {
      profile.stripeConnectAccountId = `${E2E_STRIPE_CONNECT_ACCOUNT_PREFIX}${userId}`;
      await this.welperProfileRepo.save(profile);
      return { url: `${base}${stepPath}?connect=return` };
    }

    const stripe = this.stripe();
    let accountId = profile.stripeConnectAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'CA',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { userId },
      });
      accountId = account.id;
      profile.stripeConnectAccountId = accountId;
      await this.welperProfileRepo.save(profile);
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      type: 'account_onboarding',
      refresh_url: `${base}${stepPath}?connect=refresh`,
      return_url: `${base}${stepPath}?connect=return`,
    });

    if (!link.url) {
      throw new BadRequestException('Stripe did not return an account link URL');
    }

    return { url: link.url };
  }

  private async fetchAccountStatus(accountId: string): Promise<StripeConnectStatus> {
    const stripe = this.stripe();
    try {
      const account = await stripe.accounts.retrieve(accountId);
      const detailsSubmitted = account.details_submitted === true;
      const chargesEnabled = account.charges_enabled === true;
      const payoutsEnabled = account.payouts_enabled === true;
      const onboardingComplete =
        detailsSubmitted && (chargesEnabled || payoutsEnabled);
      return {
        hasAccount: true,
        onboardingComplete,
        chargesEnabled,
        payoutsEnabled,
        detailsSubmitted,
      };
    } catch (err) {
      this.logger.warn(
        `Stripe Connect retrieve failed for ${accountId}: ${(err as Error).message}`,
      );
      throw new BadRequestException('Could not load Stripe Connect account status');
    }
  }

  private async persistPayoutChoiceIfOnboardingComplete(
    profile: WelperProfile,
    status: StripeConnectStatus,
  ): Promise<void> {
    if (
      !status.onboardingComplete ||
      profile.payoutMethodChoice === PayoutMethodChoice.STRIPE
    ) {
      return;
    }
    profile.payoutMethodChoice = PayoutMethodChoice.STRIPE;
    await this.welperProfileRepo.save(profile);
  }

  private async requireWelperProfile(userId: string): Promise<WelperProfile> {
    const profile = await this.welperProfileRepo.findOne({
      where: { welperId: userId },
    });
    if (!profile) throw new NotFoundException('Welper profile missing');
    return profile;
  }
}
