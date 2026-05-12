import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilityCalendar } from '../entities/availability-calendar.entity';
import { AvailabilityException } from '../entities/availability-exception.entity';
import { WelperProfile } from '../entities/welper-profile.entity';
import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './availability.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AvailabilityCalendar, AvailabilityException, WelperProfile]),
    EventsModule,
  ],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}

