import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../common/auth';
import { EmailVerifiedGuardModule } from '../../common/guards/email-verified.guard.module';
import { JobPosting, JobApplication } from './entities';
import { JobPostingService } from './job-posting.service';
import { JobPostingController } from './job-posting.controller';
import { BookingModule } from '../booking/booking.module';
import { CustomerProfileModule } from '../profile-management/customer-profile/customer-profile.module';
import { ServiceOfferingModule } from '../profile-management/service-offering/service-offering.module';
import { WelperProfileModule } from '../profile-management/welper-profile/welper-profile.module';
import { SafetyVerificationModule } from '../safety-verification/safety-verification.module';
import { CategoriesModule } from '../content-management/categories/categories.module';
import { NotificationModule } from '../notification/notification.module';
import { GeocodeModule } from '../geocode/geocode.module';
import { UsersModule } from '../user-management/users/users.module';
import { BookingRequest } from '../booking/entities/booking-request.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobPosting, JobApplication, BookingRequest]),
    AuthModule,
    EmailVerifiedGuardModule,
    forwardRef(() => BookingModule),
    CustomerProfileModule,
    ServiceOfferingModule,
    WelperProfileModule,
    SafetyVerificationModule,
    CategoriesModule,
    NotificationModule,
    GeocodeModule,
    UsersModule,
  ],
  controllers: [JobPostingController],
  providers: [JobPostingService],
  exports: [JobPostingService],
})
export class JobPostingModule {}
