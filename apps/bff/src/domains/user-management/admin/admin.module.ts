import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UserAccount, VerificationStatus } from '../entities';
import { CustomerProfile } from '../../profile-management/entities/customer-profile.entity';
import { WelperProfile } from '../../profile-management/entities/welper-profile.entity';
import { ServiceOffering } from '../../profile-management/entities/service-offering.entity';
import { Dispute } from '../../dispute/entities/dispute.entity';
import { Review } from '../../review/entities/review.entity';
import { Notification } from '../../notification/entities/notification.entity';
import { ReferralCode } from '../entities/referral-code.entity';
import { Referral } from '../entities/referral.entity';
import { SupportTicket } from '../../dispute/entities/support-ticket.entity';
import { BookingRequest } from '../../booking/entities/booking-request.entity';
import { BookingPayment } from '../../payment/entities/booking-payment.entity';
import { UsersModule } from '../users/users.module';
import { EventsModule } from '../events/events.module';
import { AuthModule } from '../auth/auth.module';
import { PaymentModule } from '../../payment/payment.module';
import { DisputeModule } from '../../dispute/dispute.module';
import { BookingModule } from '../../booking/booking.module';
import { AdminAuditModule } from './admin-audit.module';
import { AdminDashboardService } from './admin-dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserAccount,
      VerificationStatus,
      CustomerProfile,
      WelperProfile,
      ServiceOffering,
      Dispute,
      Review,
      Notification,
      ReferralCode,
      Referral,
      SupportTicket,
      BookingRequest,
      BookingPayment,
    ]),
    UsersModule,
    EventsModule,
    AuthModule,
    PaymentModule,
    DisputeModule,
    BookingModule,
    AdminAuditModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminDashboardService],
  exports: [AdminService, AdminDashboardService],
})
export class AdminModule {}

