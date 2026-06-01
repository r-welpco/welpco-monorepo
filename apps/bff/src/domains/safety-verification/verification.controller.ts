import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../../common/auth/decorators/current-user.decorator';
import { BackgroundCheckService } from './background-check.service';
import { BackgroundCheckPaymentService } from './background-check-payment.service';
import { ConfirmBackgroundCheckReturnDto } from './dto/confirm-background-check-return.dto';
import { CreateBackgroundCheckCheckoutDto } from './dto/create-background-check-checkout.dto';
import {
  parseSignupE2eBypassHeader,
  SIGNUP_E2E_BYPASS_HEADER,
} from '../../common/signup-e2e-bypass';

@ApiTags('Verification')
@Controller('verification/background-check')
export class VerificationController {
  constructor(
    private readonly backgroundCheckService: BackgroundCheckService,
    private readonly paymentService: BackgroundCheckPaymentService,
  ) {}

  @Get('pricing')
  @ApiOperation({ summary: 'Background check list and promo pricing (public)' })
  async getPricing() {
    return this.backgroundCheckService.getPricing();
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Background check payment and Certn status for current welper' })
  async getStatus(@CurrentUser() user: CurrentUserData) {
    return this.backgroundCheckService.getStatus(user.userId);
  }

  @Post('checkout-session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create Stripe Checkout session for background check fee' })
  async createCheckoutSession(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateBackgroundCheckCheckoutDto,
    @Headers(SIGNUP_E2E_BYPASS_HEADER) e2eHeader?: string,
  ) {
    const e2eBypass = parseSignupE2eBypassHeader(e2eHeader);
    return this.paymentService.createCheckoutSession(user.userId, {
      locale: dto.locale ?? 'en',
      e2eBypass,
    });
  }

  @Post('confirm-return')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sync payment after Stripe Checkout success redirect (webhook fallback)',
  })
  async confirmReturn(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: ConfirmBackgroundCheckReturnDto,
    @Headers(SIGNUP_E2E_BYPASS_HEADER) e2eHeader?: string,
  ) {
    const e2eBypass = parseSignupE2eBypassHeader(e2eHeader);
    await this.paymentService.confirmReturn(user.userId, dto.sessionId, {
      e2eBypass,
    });
    return this.backgroundCheckService.getStatus(user.userId);
  }

  @Post('retry-invite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retry Certn applicant invite after payment (when invite failed or was skipped)',
  })
  async retryInvite(@CurrentUser() user: CurrentUserData) {
    await this.backgroundCheckService.retryCertnInvite(user.userId);
    return this.backgroundCheckService.getStatus(user.userId);
  }

  @Post('resend-invite-email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend background check screening invite email to the welper',
  })
  async resendInviteEmail(@CurrentUser() user: CurrentUserData) {
    await this.backgroundCheckService.resendInviteEmail(user.userId);
    return this.backgroundCheckService.getStatus(user.userId);
  }
}
