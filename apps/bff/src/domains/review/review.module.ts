import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../common/auth';
import { Review } from './entities/review.entity';
import { BookingRequest } from '../booking/entities/booking-request.entity';
import { WelperProfile } from '../profile-management/entities/welper-profile.entity';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, BookingRequest, WelperProfile]),
    AuthModule,
    NotificationModule,
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [ReviewService],
})
export class ReviewModule {}
