import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WelperPortfolioPhoto } from '../entities/welper-portfolio-photo.entity';
import { WelperProfileViewCount } from '../entities/welper-profile-view-count.entity';
import { WelperProfile } from '../entities/welper-profile.entity';
import { ServiceOffering } from '../entities/service-offering.entity';
import { NotificationModule } from '../../notification/notification.module';
import { AdminAuditModule } from '../../user-management/admin/admin-audit.module';
import { PortfolioService } from './portfolio.service';
import { HandleService } from './handle.service';
import { ProfileViewsService } from './profile-views.service';
import { PortfolioController } from './portfolio.controller';
import { PortfolioAdminController } from './portfolio-admin.controller';
import { SharingController } from './sharing.controller';

/**
 * SHARE MVP (BFF): shareable-profile foundation — portfolio photos with
 * moderation (SHARE-001), vanity handle (SHARE-002), view tracking
 * (SHARE-005). The S3 presigner comes from the global S3Module.
 */
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      WelperPortfolioPhoto,
      WelperProfileViewCount,
      WelperProfile,
      ServiceOffering,
    ]),
    NotificationModule,
    AdminAuditModule,
  ],
  controllers: [PortfolioController, SharingController, PortfolioAdminController],
  providers: [PortfolioService, HandleService, ProfileViewsService],
  exports: [PortfolioService, HandleService, ProfileViewsService],
})
export class SharingModule {}
