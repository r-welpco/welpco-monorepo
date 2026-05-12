import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationSetting } from './entities/application-setting.entity';

export const PAYMENT_CAPTURE_DELAY_KEY = 'payment_capture_delay_minutes';

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
