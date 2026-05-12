import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventPublisherService } from './event-publisher.service';
import { CustomerProfile } from '../entities/customer-profile.entity';
import { WelperProfile } from '../entities/welper-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerProfile, WelperProfile]),
  ],
  providers: [EventPublisherService],
  exports: [EventPublisherService],
})
export class EventsModule {}
