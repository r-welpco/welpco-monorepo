import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser, Roles, RolesGuard } from '../../common/auth';
import { EmailVerifiedGuard } from '../../common/guards/email-verified.guard';
import { PaymentService } from './payment.service';
import { CompleteSetupIntentDto } from './dto/complete-setup-intent.dto';

interface AuthUser {
  userId: string;
  email: string;
  accountType: string;
}

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('setup-intent/complete')
  @UseGuards(RolesGuard, EmailVerifiedGuard)
  @Roles('customer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Persist default payment method after SetupIntent succeeds (client callback)',
    description:
      'Updates user_accounts.stripe_default_payment_method_id when webhooks are unavailable (e.g. local dev).',
  })
  async completeSetupIntent(
    @CurrentUser() user: AuthUser,
    @Body() body: CompleteSetupIntentDto,
  ) {
    await this.paymentService.completeSetupIntentForUser(user.userId, body.setupIntentId);
    return { ok: true };
  }

  @Post('setup-intent')
  @UseGuards(RolesGuard, EmailVerifiedGuard)
  @Roles('customer')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Stripe SetupIntent to save a card (customers)' })
  async createSetupIntent(@CurrentUser() user: AuthUser) {
    return this.paymentService.createSetupIntent(user.userId);
  }

  @Get('payment-methods')
  @UseGuards(RolesGuard)
  @Roles('customer')
  @ApiOperation({ summary: 'List saved payment methods' })
  async listPaymentMethods(@CurrentUser() user: AuthUser) {
    return this.paymentService.listPaymentMethods(user.userId);
  }

  @Post('payment-methods/:id/default')
  @UseGuards(RolesGuard, EmailVerifiedGuard)
  @Roles('customer')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', description: 'Stripe payment method id' })
  @ApiOperation({ summary: 'Set default payment method' })
  async setDefault(
    @CurrentUser() user: AuthUser,
    @Param('id') paymentMethodId: string,
  ) {
    await this.paymentService.setDefaultPaymentMethod(user.userId, paymentMethodId);
    return { ok: true };
  }

  @Delete('payment-methods/:id')
  @UseGuards(RolesGuard, EmailVerifiedGuard)
  @Roles('customer')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', description: 'Stripe payment method id' })
  @ApiOperation({ summary: 'Remove a payment method' })
  async detach(
    @CurrentUser() user: AuthUser,
    @Param('id') paymentMethodId: string,
  ) {
    await this.paymentService.detachPaymentMethod(user.userId, paymentMethodId);
    return { ok: true };
  }
}
