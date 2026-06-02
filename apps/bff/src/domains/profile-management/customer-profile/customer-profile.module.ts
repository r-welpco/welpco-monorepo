import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerProfile } from '../entities/customer-profile.entity';
import { UserAccount } from '../../user-management/entities/user-account.entity';
import { Review } from '../../review/entities/review.entity';
import { BookingRequest } from '../../booking/entities/booking-request.entity';
import { JobPosting } from '../../job-posting/entities/job-posting.entity';
import { CustomerProfileService } from './customer-profile.service';
import { CustomerProfileAggregatesService } from './customer-profile-aggregates.service';
import { CustomerProfileController } from './customer-profile.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerProfile,
      UserAccount,
      Review,
      BookingRequest,
      JobPosting,
    ]),
    EventsModule,
  ],
  controllers: [CustomerProfileController],
  providers: [CustomerProfileService, CustomerProfileAggregatesService],
  exports: [CustomerProfileService],
})
export class CustomerProfileModule {}

