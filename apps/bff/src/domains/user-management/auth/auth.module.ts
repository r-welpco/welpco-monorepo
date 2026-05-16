import { DynamicModule, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  JwtStrategy,
  JwtAuthGuard,
  RolesGuard,
  createJwtModuleOptions,
} from '../../../common/auth';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AbilitiesFactory } from './abilities.factory';
import { PermissionsGuard } from './guards/permissions.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';
import {
  UserAccount,
  VerificationStatus,
  EmailVerificationToken,
} from '../entities';
import { EventsModule } from '../events/events.module';
import { ReferralModule } from '../referral/referral.module';
import { CacheModule } from '../cache/cache.module';
import { EmailVerificationService } from './email-verification.service';
import { PasswordResetService } from './password-reset.service';
import { AccountLockoutService } from './account-lockout.service';
import { SignupOrchestratorService } from './signup-orchestrator.service';
import { EmailModule } from '../email/email.module';
import { ProfileCreationModule } from '../../profile-management/profile-creation/profile-creation.module';
import {
  CustomerProfile,
  WelperProfile,
  ServiceOffering,
  AvailabilityCalendar,
} from '../../profile-management/entities';
import { NotificationPreference } from '../../notification/entities/notification-preference.entity';
import { NotificationModule } from '../../notification/notification.module';
import { SafetyVerificationModule } from '../../safety-verification/safety-verification.module';
import { GeocodeModule } from '../../geocode/geocode.module';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        createJwtModuleOptions(configService),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      UserAccount,
      VerificationStatus,
      EmailVerificationToken,
      CustomerProfile,
      WelperProfile,
      ServiceOffering,
      AvailabilityCalendar,
      NotificationPreference,
    ]),
    EventsModule,
    ReferralModule,
    CacheModule,
    EmailModule,
    ProfileCreationModule,
    NotificationModule,
    SafetyVerificationModule,
    GeocodeModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: 'DomainAuthService', useExisting: AuthService },
    EmailVerificationService,
    PasswordResetService,
    AccountLockoutService,
    SignupOrchestratorService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    AbilitiesFactory,
    PermissionsGuard,
    RateLimitGuard,
  ],
  exports: [
    AuthService,
    'DomainAuthService',
    AbilitiesFactory,
    AccountLockoutService,
    EmailVerificationService,
    PasswordResetService,
    SignupOrchestratorService,
  ],
})
export class AuthModule {
  /** When used from BFF, set registerController: false to avoid duplicate auth routes. */
  static forRoot(options?: { registerController?: boolean }): DynamicModule {
    const registerController = options?.registerController !== false;
    return {
      module: AuthModule,
      controllers: registerController ? [AuthController] : [],
    };
  }
}

