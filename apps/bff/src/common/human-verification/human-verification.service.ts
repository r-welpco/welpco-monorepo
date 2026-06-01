import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface TurnstileVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
  'error-codes'?: string[];
}

interface HumanVerificationParams {
  token?: string | null;
  honeypot?: string | null;
  action?: string;
  required?: boolean;
}

@Injectable()
export class HumanVerificationService {
  private readonly logger = new Logger(HumanVerificationService.name);

  constructor(private readonly configService: ConfigService) {}

  async assertVerified(params: HumanVerificationParams): Promise<void> {
    if (params.honeypot?.trim()) {
      throw new BadRequestException('Unable to process request');
    }

    const secret = this.configService.get<string>('TURNSTILE_SECRET_KEY')?.trim();
    const isProduction = process.env.NODE_ENV === 'production';

    if (!secret) {
      if (isProduction && params.required !== false) {
        throw new ServiceUnavailableException('Human verification is not configured');
      }
      return;
    }

    const token = params.token?.trim();
    if (!token) {
      if (params.required === false) return;
      throw new BadRequestException('Complete the human verification challenge');
    }

    const body = new URLSearchParams({
      secret,
      response: token,
    });

    let data: TurnstileVerifyResponse;
    try {
      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      data = (await response.json()) as TurnstileVerifyResponse;
    } catch (err) {
      this.logger.warn(
        `Turnstile verification request failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw new ServiceUnavailableException('Human verification is temporarily unavailable');
    }

    if (!data.success) {
      this.logger.warn(`Turnstile rejected request: ${(data['error-codes'] ?? []).join(',')}`);
      throw new BadRequestException('Human verification failed');
    }

    if (params.action && data.action && data.action !== params.action) {
      this.logger.warn(`Turnstile action mismatch: expected=${params.action} actual=${data.action}`);
      throw new BadRequestException('Human verification failed');
    }
  }
}
