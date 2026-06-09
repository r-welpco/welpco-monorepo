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
import { RolesGuard } from '../../common/auth/guards/roles.guard';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserData,
} from '../../common/auth/decorators/current-user.decorator';
import { StripeConnectService } from './stripe-connect.service';
import { CreateStripeConnectLinkDto } from './dto/create-stripe-connect-link.dto';
import {
  parseSignupE2eBypassHeader,
  SIGNUP_E2E_BYPASS_HEADER,
} from '../../common/signup-e2e-bypass';

@ApiTags('Payment')
@Controller('payment/connect')
export class PayoutController {
  constructor(private readonly stripeConnect: StripeConnectService) {}

  @Get('status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('welper')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Stripe Connect Express onboarding status for current welper' })
  async getStatus(@CurrentUser() user: CurrentUserData) {
    return this.stripeConnect.getStatus(user.userId);
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('welper')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh Stripe Connect status after returning from hosted onboarding',
  })
  async sync(@CurrentUser() user: CurrentUserData) {
    return this.stripeConnect.syncAccount(user.userId);
  }

  @Post('account-link')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('welper')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create Stripe Connect Express account link for signup or dashboard',
  })
  async createAccountLink(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateStripeConnectLinkDto,
    @Headers(SIGNUP_E2E_BYPASS_HEADER) e2eHeader?: string,
  ) {
    const e2eBypass = parseSignupE2eBypassHeader(e2eHeader);
    return this.stripeConnect.createAccountLink(user.userId, dto.locale ?? 'en', {
      e2eBypass,
    });
  }
}
