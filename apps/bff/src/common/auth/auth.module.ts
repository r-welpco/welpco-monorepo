import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
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
  ],
  providers: [JwtStrategy, JwtAuthGuard, RolesGuard],
  exports: [JwtModule, PassportModule, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
