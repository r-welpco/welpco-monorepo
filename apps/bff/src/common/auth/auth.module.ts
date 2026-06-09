import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserAccount } from '../../domains/user-management/entities/user-account.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { SignupCompletedGuard } from './guards/signup-completed.guard';
import { createJwtModuleOptions } from './jwt-module-options.factory';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        createJwtModuleOptions(configService),
      inject: [ConfigService],
    }),
    ConfigModule,
    TypeOrmModule.forFeature([UserAccount]),
  ],
  providers: [JwtStrategy, JwtAuthGuard, RolesGuard, SignupCompletedGuard],
  exports: [
    JwtModule,
    PassportModule,
    JwtAuthGuard,
    RolesGuard,
    SignupCompletedGuard,
  ],
})
export class AuthModule {}
