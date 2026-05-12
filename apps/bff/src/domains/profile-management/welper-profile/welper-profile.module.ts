import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WelperProfile } from '../entities/welper-profile.entity';
import { ServiceOffering } from '../entities/service-offering.entity';
import { Review } from '../../review/entities/review.entity';
import { BookingRequest } from '../../booking/entities/booking-request.entity';
import { WelperProfileService } from './welper-profile.service';
import { WelperProfileController } from './welper-profile.controller';
import { WelperProfileAggregatesService } from './welper-profile-aggregates.service';
import { EventsModule } from '../events/events.module';
import { GeocodeModule } from '../../geocode/geocode.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WelperProfile, ServiceOffering, Review, BookingRequest]),
    EventsModule,
    GeocodeModule,
  ],
  controllers: [WelperProfileController],
  providers: [WelperProfileService, WelperProfileAggregatesService],
  exports: [WelperProfileService, WelperProfileAggregatesService],
})
export class WelperProfileModule {}
