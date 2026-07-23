import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification, NotificationPreference } from './entities';
import { UserAccount } from '../user-management/entities/user-account.entity';
import { MinorGuardianConsent } from '../safety-verification/entities/minor-guardian-consent.entity';
import { CustomerProfile } from '../profile-management/entities/customer-profile.entity';
import { WelperProfile } from '../profile-management/entities/welper-profile.entity';
import { EmailModule } from '../user-management/email/email.module';
import { SmsModule } from '../user-management/sms/sms.module';
import {
  NotificationService,
  EMAIL_NOTIFICATION_SERVICE,
  SMS_NOTIFICATION_SERVICE,
} from './notification.service';
import { EmailNotificationService } from './email-notification.service';
import { SmsNotificationService } from './sms-notification.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      Notification,
      NotificationPreference,
      UserAccount,
      MinorGuardianConsent,
      CustomerProfile,
      WelperProfile,
    ]),
    EmailModule,
    SmsModule,
  ],
  providers: [
    NotificationService,
    EmailNotificationService,
    SmsNotificationService,
    {
      provide: EMAIL_NOTIFICATION_SERVICE,
      useExisting: EmailNotificationService,
    },
    {
      provide: SMS_NOTIFICATION_SERVICE,
      useExisting: SmsNotificationService,
    },
  ],
  exports: [NotificationService, EmailNotificationService, SmsNotificationService],
})
export class NotificationModule {}
