import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DiscoveryCategoriesCacheModule } from './common/discovery-categories-cache/discovery-categories-cache.module';
import { S3Module } from './clients/s3';
import { DatabaseModule } from './database/database.module';
import { UserManagementDomainModule } from './domains/user-management/user-management.module';
import { ProfileManagementDomainModule } from './domains/profile-management/profile-management.module';
import { ContentManagementDomainModule } from './domains/content-management/content-management.module';
import { ServiceDiscoveryModule } from './domains/service-discovery/service-discovery.module';
import { BookingModule } from './domains/booking/booking.module';
import { CommunicationModule } from './domains/communication/communication.module';
import { ReviewModule } from './domains/review/review.module';
import { DisputeModule } from './domains/dispute/dispute.module';
import { NotificationModule } from './domains/notification/notification.module';
import { GeocodeModule } from './domains/geocode/geocode.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { ContentModule } from './modules/content/content.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { HealthModule } from './health/health.module';
import { PaymentModule } from './domains/payment/payment.module';
import { SafetyVerificationModule } from './domains/safety-verification/safety-verification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ScheduleModule.forRoot(),
    DiscoveryCategoriesCacheModule,
    S3Module,
    DatabaseModule,
    AuthModule,
    UserManagementDomainModule,
    ProfileManagementDomainModule,
    ContentManagementDomainModule,
    ServiceDiscoveryModule,
    BookingModule,
    CommunicationModule,
    ReviewModule,
    DisputeModule,
    NotificationModule,
    GeocodeModule,
    UsersModule,
    ProfilesModule,
    ContentModule,
    NotificationsModule,
    UploadsModule,
    HealthModule,
    PaymentModule,
    SafetyVerificationModule,
  ],
})
export class AppModule {}
