import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationSetting } from '../payment/entities/application-setting.entity';
import { UserAccount } from '../user-management/entities/user-account.entity';
import { VerificationStatus } from '../user-management/entities/verification-status.entity';
import { WelperProfile } from '../profile-management/entities/welper-profile.entity';
import { BackgroundCheckOrder } from './entities/background-check-order.entity';
import { BackgroundCheckPricingService } from './background-check-pricing.service';
import { BackgroundCheckPaymentService } from './background-check-payment.service';
import { BackgroundCheckService } from './background-check.service';
import { CertnApiClient } from './certn-api.client';
import { VerificationController } from './verification.controller';
import { CertnWebhookController } from './certn-webhook.controller';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      BackgroundCheckOrder,
      ApplicationSetting,
      UserAccount,
      WelperProfile,
      VerificationStatus,
    ]),
  ],
  controllers: [VerificationController, CertnWebhookController],
  providers: [
    BackgroundCheckPricingService,
    BackgroundCheckService,
    BackgroundCheckPaymentService,
    CertnApiClient,
  ],
  exports: [BackgroundCheckService, BackgroundCheckPaymentService],
})
export class SafetyVerificationModule {}
