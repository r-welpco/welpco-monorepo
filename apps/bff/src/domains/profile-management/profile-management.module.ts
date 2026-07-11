import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../../common/auth';
import { CustomerProfileModule } from './customer-profile/customer-profile.module';
import { WelperProfileModule } from './welper-profile/welper-profile.module';
import { ServiceOfferingModule } from './service-offering/service-offering.module';
import { AvailabilityModule } from './availability/availability.module';
import { FavoriteModule } from './favorite/favorite.module';
import { EventsModule } from './events/events.module';
import { ProfileCreationModule } from './profile-creation/profile-creation.module';
import { SharingModule } from './sharing/sharing.module';

/**
 * Profile management domain module. Does not include DatabaseModule or HealthModule - the BFF provides those at app level.
 */
@Module({
  imports: [
    ConfigModule,
    AuthModule,
    EventsModule,
    ProfileCreationModule,
    CustomerProfileModule,
    WelperProfileModule,
    ServiceOfferingModule,
    AvailabilityModule,
    FavoriteModule,
    SharingModule,
  ],
  exports: [
    ProfileCreationModule,
    CustomerProfileModule,
    WelperProfileModule,
    ServiceOfferingModule,
    AvailabilityModule,
    FavoriteModule,
    SharingModule,
  ],
})
export class ProfileManagementDomainModule {}
