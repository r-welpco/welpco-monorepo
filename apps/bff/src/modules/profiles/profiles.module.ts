import { Module } from '@nestjs/common';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { ProfileManagementDomainModule } from '../../domains/profile-management/profile-management.module';
import { UsersModule } from '../../domains/user-management/users/users.module';
import { AuthModule } from '../../domains/user-management/auth/auth.module';

@Module({
  imports: [ProfileManagementDomainModule, UsersModule, AuthModule],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
