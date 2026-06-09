/**
 * Single database module for the BFF. One PostgreSQL database (welpco_dev) for all domains.
 * Do not add per-domain DatabaseModules or separate DB names.
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  UserAccount,
  VerificationStatus,
  ReferralCode,
  Referral,
  EmailVerificationToken,
} from '../domains/user-management/entities';
import { AdminAuditLog } from '../domains/user-management/admin/admin-audit-log.entity';
import {
  CustomerProfile,
  WelperProfile,
  ServiceOffering,
  AvailabilityCalendar,
  AvailabilityException,
  FavoriteWelper,
} from '../domains/profile-management/entities';
import { Holiday } from '../domains/content-management/entities';
import {
  ServiceCategory,
  Question,
  ServiceQuestion,
  StaticContent,
  FAQItem,
  MarketingPhrase,
} from '../domains/content-management/entities';
import { BookingRequest, BookingServiceReceipt } from '../domains/booking/entities';
import { Notification, NotificationPreference } from '../domains/notification/entities';
import { ChatThread } from '../domains/communication/entities/chat-thread.entity';
import { Message } from '../domains/communication/entities/message.entity';
import { Review } from '../domains/review/entities/review.entity';
import { Dispute } from '../domains/dispute/entities/dispute.entity';
import { SupportTicket } from '../domains/dispute/entities/support-ticket.entity';
import { Resolution } from '../domains/dispute/entities/resolution.entity';
import { ApplicationSetting, BookingPayment, ProcessedWebhookEvent } from '../domains/payment/entities';
import { PayoutBatch } from '../domains/payment/entities/payout-batch.entity';
import { WelperPayoutLedger } from '../domains/payment/entities/welper-payout-ledger.entity';
import { BackgroundCheckOrder } from '../domains/safety-verification/entities';
import { MinorGuardianConsent } from '../domains/safety-verification/entities/minor-guardian-consent.entity';
import { JobPosting, JobApplication } from '../domains/job-posting/entities';
import { postgresSslOption } from './db-cli-options';

export const allEntities = [
  UserAccount,
  VerificationStatus,
  ReferralCode,
  Referral,
  EmailVerificationToken,
  CustomerProfile,
  WelperProfile,
  ServiceOffering,
  AvailabilityCalendar,
  AvailabilityException,
  FavoriteWelper,
  Holiday,
  ServiceCategory,
  Question,
  ServiceQuestion,
  StaticContent,
  FAQItem,
  MarketingPhrase,
  BookingRequest,
  BookingServiceReceipt,
  Notification,
  NotificationPreference,
  ChatThread,
  Message,
  Review,
  Dispute,
  SupportTicket,
  Resolution,
  ApplicationSetting,
  BookingPayment,
  ProcessedWebhookEvent,
  PayoutBatch,
  WelperPayoutLedger,
  BackgroundCheckOrder,
  MinorGuardianConsent,
  AdminAuditLog,
  JobPosting,
  JobApplication,
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isProduction = process.env.NODE_ENV === 'production';

        const host = configService.get<string>('DB_HOST') || (isProduction ? undefined : 'localhost');
        const password = configService.get<string>('DB_PASSWORD') || (isProduction ? undefined : 'welpco_dev');
        if (isProduction && (!host || !password)) {
          throw new Error('DB_HOST and DB_PASSWORD must be set in production');
        }

        return {
          type: 'postgres',
          host: host!,
          port: configService.get<number>('DB_PORT') || 5432,
          username: configService.get<string>('DB_USERNAME') || 'welpco',
          password: password!,
          database: configService.get<string>('DB_DATABASE') || 'welpco_dev',
          ssl: postgresSslOption(),
          entities: allEntities,
          synchronize: false, // Always use migrations - synchronize can cause data loss
          logging: process.env.NODE_ENV === 'development',
          extra: {
            // Connection pool sizing
            max: isProduction ? 20 : 5,
            min: isProduction ? 5 : 1,
            idleTimeoutMillis: 30_000,
            connectionTimeoutMillis: 5_000,
            // Prevent runaway queries from holding connections
            statement_timeout: 30_000,
          },
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature(allEntities),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
