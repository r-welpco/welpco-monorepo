import { Module } from '@nestjs/common';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { ProfileManagementDomainModule } from '../../domains/profile-management/profile-management.module';
import { UsersModule } from '../../domains/user-management/users/users.module';

@Module({
  imports: [ProfileManagementDomainModule, UsersModule],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
