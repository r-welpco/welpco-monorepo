import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationSetting } from './entities/application-setting.entity';

export const PAYMENT_CAPTURE_DELAY_KEY = 'payment_capture_delay_minutes';
export const BOOKING_TAX_RATE_BPS_KEY = 'booking_tax_rate_bps';

@Injectable()
export class ApplicationSettingsService {
  constructor(
    @InjectRepository(ApplicationSetting)
    private readonly repo: Repository<ApplicationSetting>,
  ) {}

  async getPaymentCaptureDelayMinutes(): Promise<number> {
    const row = await this.repo.findOne({ where: { key: PAYMENT_CAPTURE_DELAY_KEY } });
    const n = parseInt(row?.value ?? '30', 10);
    return Number.isFinite(n) && n >= 0 ? n : 30;
  }

  /**
   * Booking tax rate in basis points (bps). Example: 1495 = 14.95%.
   * Defaults to 0 when unset.
   */
  async getBookingTaxRateBps(): Promise<number> {
    const row = await this.repo.findOne({ where: { key: BOOKING_TAX_RATE_BPS_KEY } });
    const n = parseInt(row?.value ?? '0', 10);
    if (!Number.isFinite(n) || n < 0) return 0;
    // Hard guard against nonsense config.
    return Math.min(n, 10000);
  }

  async setValue(key: string, value: string): Promise<ApplicationSetting> {
    let row = await this.repo.findOne({ where: { key } });
    if (!row) {
      row = this.repo.create({ key, value });
    } else {
      row.value = value;
    }
    return this.repo.save(row);
  }
}
