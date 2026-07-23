import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { toE164 } from '@welpco/sms';
import { SmsService } from '../user-management/sms/sms.service';
import {
  AccountType,
  UserAccount,
} from '../user-management/entities/user-account.entity';
import { CustomerProfile } from '../profile-management/entities/customer-profile.entity';
import { WelperProfile } from '../profile-management/entities/welper-profile.entity';

@Injectable()
export class SmsNotificationService {
  private readonly logger = new Logger(SmsNotificationService.name);

  constructor(
    private readonly smsService: SmsService,
    @InjectRepository(UserAccount)
    private readonly userRepo: Repository<UserAccount>,
    @InjectRepository(CustomerProfile)
    private readonly customerProfileRepo: Repository<CustomerProfile>,
    @InjectRepository(WelperProfile)
    private readonly welperProfileRepo: Repository<WelperProfile>,
  ) {}

  /**
   * Send a plain SMS to the user's profile phone when present and valid.
   * No-ops (with a warning log) when phone is missing/invalid.
   */
  async sendNotificationSms(userId: string, body: string): Promise<void> {
    const to = await this.resolvePhoneE164(userId);
    if (!to) {
      this.logger.warn(
        `No valid phone for user ${userId}, skipping notification SMS`,
      );
      return;
    }
    await this.smsService.sendSms({ to, body });
  }

  async resolvePhoneE164(userId: string): Promise<string | null> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return null;

    if (user.accountType === AccountType.CUSTOMER) {
      const profile = await this.customerProfileRepo.findOne({
        where: { customerId: userId },
      });
      return toE164(profile?.phoneNumber ?? null);
    }

    if (user.accountType === AccountType.WELPER) {
      const profile = await this.welperProfileRepo.findOne({
        where: { welperId: userId },
      });
      return toE164(profile?.phoneNumber ?? null);
    }

    return null;
  }
}
