import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerProfile } from '../entities/customer-profile.entity';
import { UserAccount } from '../../user-management/entities/user-account.entity';
import { CustomerProfileService } from './customer-profile.service';
import { CustomerProfileController } from './customer-profile.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerProfile, UserAccount]),
    EventsModule,
  ],
  controllers: [CustomerProfileController],
  providers: [CustomerProfileService],
  exports: [CustomerProfileService],
})
export class CustomerProfileModule {}

