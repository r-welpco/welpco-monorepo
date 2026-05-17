import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationSetting } from '../payment/entities/application-setting.entity';

export const BG_CHECK_LIST_PRICE_KEY = 'background_check_list_price_cents';
export const BG_CHECK_PROMO_PRICE_KEY = 'background_check_promo_price_cents';
export const BG_CHECK_PROMO_ENABLED_KEY = 'background_check_promo_enabled';

export interface BackgroundCheckPricing {
  listPriceCents: number;
  promoPriceCents: number;
  promoEnabled: boolean;
  chargePriceCents: number;
  currency: string;
}

@Injectable()
export class BackgroundCheckPricingService {
  constructor(
    @InjectRepository(ApplicationSetting)
    private readonly settingsRepo: Repository<ApplicationSetting>,
  ) {}

  async getPricing(): Promise<BackgroundCheckPricing> {
    const keys = [BG_CHECK_LIST_PRICE_KEY, BG_CHECK_PROMO_PRICE_KEY, BG_CHECK_PROMO_ENABLED_KEY];
    const rows = await this.settingsRepo.find({ where: keys.map((key) => ({ key })) });
    const byKey = new Map(rows.map((r) => [r.key, r.value]));

    const listPriceCents = this.parseCents(byKey.get(BG_CHECK_LIST_PRICE_KEY), 1999);
    const promoPriceCents = this.parseCents(byKey.get(BG_CHECK_PROMO_PRICE_KEY), 1999);
    const promoEnabled = (byKey.get(BG_CHECK_PROMO_ENABLED_KEY) ?? 'false').toLowerCase() === 'true';
    const chargePriceCents = promoEnabled ? promoPriceCents : listPriceCents;

    return {
      listPriceCents,
      promoPriceCents,
      promoEnabled,
      chargePriceCents,
      currency: 'CAD',
    };
  }

  private parseCents(raw: string | null | undefined, fallback: number): number {
    const n = parseInt(raw ?? '', 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  }
}
