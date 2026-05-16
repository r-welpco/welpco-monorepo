import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { BackgroundCheckService } from './background-check.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class CertnWebhookController {
  private readonly logger = new Logger(CertnWebhookController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly backgroundCheckService: BackgroundCheckService,
  ) {}

  @Post('certn')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Certn background check status webhook' })
  async handleCertn(
    @Body() body: Record<string, unknown>,
    @Headers('x-certn-signature') signature: string | undefined,
    @Headers('x-webhook-signature') altSignature: string | undefined,
  ) {
    const secret = this.config.get<string>('CERTN_WEBHOOK_SECRET');
    if (secret) {
      const sig = signature ?? altSignature;
      if (!sig || !this.verifySignature(JSON.stringify(body), sig, secret)) {
        throw new BadRequestException('Invalid Certn webhook signature');
      }
    } else {
      this.logger.warn('CERTN_WEBHOOK_SECRET not set — accepting webhook without verification');
    }

    await this.backgroundCheckService.handleCertnWebhook(body as never);
    return { received: true };
  }

  private verifySignature(raw: string, header: string, secret: string): boolean {
    const expected = createHmac('sha256', secret).update(raw).digest('hex');
    const provided = header.replace(/^sha256=/, '').trim();
    try {
      return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
    } catch {
      return false;
    }
  }
}
