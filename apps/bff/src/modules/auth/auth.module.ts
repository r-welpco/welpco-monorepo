import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserManagementDomainModule } from '../../domains/user-management/user-management.module';
import { ProfileManagementDomainModule } from '../../domains/profile-management/profile-management.module';
import { RateLimitGuard } from '../../domains/user-management/auth/guards/rate-limit.guard';

@Module({
  imports: [
    UserManagementDomainModule,
    ProfileManagementDomainModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, RateLimitGuard],
  exports: [AuthService],
})
export class AuthModule {}
