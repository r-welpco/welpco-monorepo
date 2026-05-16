import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WelperProfile } from '../profile-management/entities/welper-profile.entity';
import { ServiceOffering } from '../profile-management/entities/service-offering.entity';
import { ProfileManagementDomainModule } from '../profile-management/profile-management.module';
import { ContentManagementDomainModule } from '../content-management/content-management.module';
import { GeocodeModule } from '../geocode/geocode.module';
import { SafetyVerificationModule } from '../safety-verification/safety-verification.module';
import { ServiceDiscoveryController } from './service-discovery.controller';
import { ServiceDiscoveryService } from './service-discovery.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WelperProfile, ServiceOffering]),
    ProfileManagementDomainModule,
    ContentManagementDomainModule,
    GeocodeModule,
    SafetyVerificationModule,
  ],
  controllers: [ServiceDiscoveryController],
  providers: [ServiceDiscoveryService],
})
export class ServiceDiscoveryModule {}
