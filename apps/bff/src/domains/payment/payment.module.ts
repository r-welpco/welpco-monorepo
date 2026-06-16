import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CustomerProfileModule } from '../profile-management/customer-profile/customer-profile.module';
import { CustomerProfile } from '../profile-management/entities/customer-profile.entity';
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
import { BookingTaxService } from './booking-tax.service';
import { EmailVerifiedGuardModule } from '../../common/guards/email-verified.guard.module';
import { NotificationModule } from '../notification/notification.module';
import { SafetyVerificationModule } from '../safety-verification/safety-verification.module';
import { BookingServiceReceipt } from '../booking/entities/booking-service-receipt.entity';
import { PayoutBatch } from './entities/payout-batch.entity';
import { WelperPayoutLedger } from './entities/welper-payout-ledger.entity';
import { WelperPayoutLedgerService } from './welper-payout-ledger.service';
import { PayoutBatchService } from './payout-batch.service';
import { BookingRefund } from './entities/booking-refund.entity';
import { PaymentRecoveryTask } from './entities/payment-recovery-task.entity';
import { StripeTransferState } from './entities/stripe-transfer-state.entity';
import { Resolution } from '../dispute/entities/resolution.entity';
import { Dispute } from '../dispute/entities/dispute.entity';
import { StripeOperationsService } from './stripe-operations.service';

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
      CustomerProfile,
      BookingServiceReceipt,
      PayoutBatch,
      WelperPayoutLedger,
      BookingRefund,
      PaymentRecoveryTask,
      StripeTransferState,
      Resolution,
      Dispute,
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
    BookingTaxService,
    WelperPayoutLedgerService,
    PayoutBatchService,
    StripeOperationsService,
  ],
  exports: [
    ApplicationSettingsService,
    PaymentService,
    StripeConnectService,
    BookingTaxService,
    WelperPayoutLedgerService,
    PayoutBatchService,
    StripeOperationsService,
  ],
})
export class PaymentModule {}
