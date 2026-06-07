import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationSetting } from '../payment/entities/application-setting.entity';
import { UserAccount } from '../user-management/entities/user-account.entity';
import { VerificationStatus } from '../user-management/entities/verification-status.entity';
import { WelperProfile } from '../profile-management/entities/welper-profile.entity';
import { BackgroundCheckOrder } from './entities/background-check-order.entity';
import { MinorGuardianConsent } from './entities/minor-guardian-consent.entity';
import { BackgroundCheckPricingService } from './background-check-pricing.service';
import { BackgroundCheckPaymentService } from './background-check-payment.service';
import { BackgroundCheckService } from './background-check.service';
import { GuardianConsentService } from './guardian-consent.service';
import { CertnApiClient } from './certn-api.client';
import { VerificationController } from './verification.controller';
import { GuardianConsentController } from './guardian-consent.controller';
import { CertnWebhookController } from './certn-webhook.controller';
import { EmailModule } from '../user-management/email/email.module';
import { CacheModule } from '../user-management/cache/cache.module';
import { AuthModule } from '../user-management/auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    EmailModule,
    CacheModule,
    forwardRef(() => AuthModule),
    TypeOrmModule.forFeature([
      BackgroundCheckOrder,
      MinorGuardianConsent,
      ApplicationSetting,
      UserAccount,
      WelperProfile,
      VerificationStatus,
    ]),
  ],
  controllers: [VerificationController, GuardianConsentController, CertnWebhookController],
  providers: [
    BackgroundCheckPricingService,
    BackgroundCheckService,
    BackgroundCheckPaymentService,
    GuardianConsentService,
    CertnApiClient,
  ],
  exports: [BackgroundCheckService, BackgroundCheckPaymentService, GuardianConsentService],
})
export class SafetyVerificationModule {}
