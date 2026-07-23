import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  hasTwilioCredentials,
  sendSms,
  type SendSmsResult,
  type TwilioSmsConfig,
} from '@welpco/sms';

export interface SmsOptions {
  to: string;
  body: string;
  from?: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly smsConfig: TwilioSmsConfig;
  private readonly deliveryMode: 'twilio' | 'stub';

  constructor(private readonly configService: ConfigService) {
    this.smsConfig = {
      accountSid: this.configService.get<string>('TWILIO_ACCOUNT_SID')?.trim(),
      authToken: this.configService.get<string>('TWILIO_AUTH_TOKEN')?.trim(),
      fromNumber: this.configService.get<string>('TWILIO_FROM_NUMBER')?.trim(),
      provider: this.resolveProvider(),
    };
    this.deliveryMode = hasTwilioCredentials(this.smsConfig)
      ? 'twilio'
      : 'stub';
    this.logger.log(
      `SMS service configured: ${this.deliveryMode}${
        this.deliveryMode === 'stub'
          ? ' (set TWILIO_* and SMS_PROVIDER=twilio for live sends)'
          : ''
      }`,
    );
  }

  getDeliveryMode(): 'twilio' | 'stub' {
    return this.deliveryMode;
  }

  async sendSms(options: SmsOptions): Promise<SendSmsResult> {
    const result = await sendSms(options, this.smsConfig);
    this.logger.debug(
      `SMS sent via ${result.provider} to=${options.to} sid=${result.sid} status=${result.status}`,
    );
    return result;
  }

  private resolveProvider(): 'twilio' | 'stub' | undefined {
    const raw = this.configService.get<string>('SMS_PROVIDER')?.trim().toLowerCase();
    if (raw === 'twilio' || raw === 'stub') return raw;
    return undefined;
  }
}
