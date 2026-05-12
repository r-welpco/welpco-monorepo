import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from './cache/cache.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GuardianModule } from './guardian/guardian.module';
import { ReferralModule } from './referral/referral.module';
import { AdminModule } from './admin/admin.module';
import { EmailModule } from './email/email.module';
import { ProfileManagementDomainModule } from '../profile-management/profile-management.module';

/**
 * User management domain module. Does not include DatabaseModule - the BFF provides a single DatabaseModule at app level.
 * AuthModule.forRoot({ registerController: false }) so BFF provides the auth API; domain only provides AuthService.
 * Imports ProfileManagementDomainModule so AuthService can call ProfileCreationService.createProfileForUser (sync registration).
 */
@Module({
  imports: [
    ConfigModule,
    CacheModule,
    EmailModule,
    AuthModule.forRoot({ registerController: false }),
    UsersModule,
    GuardianModule,
    ReferralModule,
    AdminModule,
    ProfileManagementDomainModule,
  ],
  exports: [AuthModule, UsersModule, AdminModule, ReferralModule],
})
export class UserManagementDomainModule {}
