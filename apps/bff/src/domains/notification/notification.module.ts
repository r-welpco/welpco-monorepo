import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification, NotificationPreference } from './entities';
import { UserAccount } from '../user-management/entities/user-account.entity';
import { MinorGuardianConsent } from '../safety-verification/entities/minor-guardian-consent.entity';
import { EmailModule } from '../user-management/email/email.module';
import { NotificationService, EMAIL_NOTIFICATION_SERVICE } from './notification.service';
import { EmailNotificationService } from './email-notification.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      Notification,
      NotificationPreference,
      UserAccount,
      MinorGuardianConsent,
    ]),
    EmailModule,
  ],
  providers: [
    NotificationService,
    EmailNotificationService,
    {
      provide: EMAIL_NOTIFICATION_SERVICE,
      useExisting: EmailNotificationService,
    },
  ],
  exports: [NotificationService, EmailNotificationService],
})
export class NotificationModule {}
