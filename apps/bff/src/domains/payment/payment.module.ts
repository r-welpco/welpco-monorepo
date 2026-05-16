import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CustomerProfileModule } from '../profile-management/customer-profile/customer-profile.module';
import { BookingRequest } from '../booking/entities/booking-request.entity';
import { UserAccount } from '../user-management/entities/user-account.entity';
import { WelperProfile } from '../profile-management/entities/welper-profile.entity';
import { ApplicationSetting } from './entities/application-setting.entity';
import { BookingPayment } from './entities/booking-payment.entity';
import { ProcessedWebhookEvent } from './entities/processed-webhook-event.entity';
import { ApplicationSettingsService } from './application-settings.service';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { StripeWebhookController } from './stripe-webhook.controller';
import { PayoutController } from './payout.controller';
import { StripeConnectService } from './stripe-connect.service';
import { PaymentCaptureScheduler } from './payment-capture.scheduler';
import { EmailVerifiedGuardModule } from '../../common/guards/email-verified.guard.module';
import { NotificationModule } from '../notification/notification.module';
import { SafetyVerificationModule } from '../safety-verification/safety-verification.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      ApplicationSetting,
      BookingPayment,
      ProcessedWebhookEvent,
      UserAccount,
      BookingRequest,
      WelperProfile,
    ]),
    CustomerProfileModule,
    EmailVerifiedGuardModule,
    NotificationModule,
    SafetyVerificationModule,
  ],
  controllers: [PaymentController, StripeWebhookController, PayoutController],
  providers: [
    ApplicationSettingsService,
    PaymentService,
    PaymentCaptureScheduler,
    StripeConnectService,
  ],
  exports: [ApplicationSettingsService, PaymentService, StripeConnectService],
})
export class PaymentModule {}
