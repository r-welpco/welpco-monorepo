import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceOffering } from '../entities/service-offering.entity';
import { WelperProfile } from '../entities/welper-profile.entity';
import { ServiceOfferingService } from './service-offering.service';
import { ServiceOfferingController } from './service-offering.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceOffering, WelperProfile]),
    EventsModule,
  ],
  controllers: [ServiceOfferingController],
  providers: [ServiceOfferingService],
  exports: [ServiceOfferingService],
})
export class ServiceOfferingModule {}

