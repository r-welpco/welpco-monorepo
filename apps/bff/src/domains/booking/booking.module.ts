import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../common/auth';
import { BookingRequest } from './entities/booking-request.entity';
import { BookingServiceReceipt } from './entities/booking-service-receipt.entity';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { ServiceOfferingModule } from '../profile-management/service-offering/service-offering.module';
import { ServiceQuestionsModule } from '../content-management/service-questions/service-questions.module';
import { AvailabilityModule } from '../profile-management/availability/availability.module';
import { NotificationModule } from '../notification/notification.module';
import { PaymentModule } from '../payment/payment.module';
import { CustomerProfileModule } from '../profile-management/customer-profile/customer-profile.module';
import { WelperProfileModule } from '../profile-management/welper-profile/welper-profile.module';
import { UsersModule } from '../user-management/users/users.module';
import { EmailVerifiedGuardModule } from '../../common/guards/email-verified.guard.module';
import { SafetyVerificationModule } from '../safety-verification/safety-verification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BookingRequest, BookingServiceReceipt]),
    AuthModule,
    ServiceOfferingModule,
    ServiceQuestionsModule,
    AvailabilityModule,
    NotificationModule,
    PaymentModule,
    CustomerProfileModule,
    WelperProfileModule,
    UsersModule,
    EmailVerifiedGuardModule,
    SafetyVerificationModule,
  ],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
