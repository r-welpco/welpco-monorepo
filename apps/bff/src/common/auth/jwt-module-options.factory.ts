import type { JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

type ExpiresIn = NonNullable<JwtSignOptions['expiresIn']>;

function jwtExpiresIn(value: string | undefined, fallback: string): ExpiresIn {
  const v = value?.trim();
  return (v && v.length > 0 ? v : fallback) as ExpiresIn;
}

/**
 * Shared Nest JwtModule options. Uses string TTLs (e.g. 15m, 7d) from env — same contract as jsonwebtoken.
 */
export function createJwtModuleOptions(configService: ConfigService): JwtModuleOptions {
  const secret = configService.get<string>('JWT_SECRET');
  if (!secret?.trim()) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  const expiresIn = jwtExpiresIn(
    configService.get<string>('JWT_EXPIRES_IN'),
    '15m',
  );
  return {
    secret,
    signOptions: { expiresIn },
  };
}

export function accessTokenSignOptions(
  configService: ConfigService,
): JwtSignOptions {
  const secret = configService.get<string>('JWT_SECRET');
  if (!secret?.trim()) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  const expiresIn = jwtExpiresIn(
    configService.get<string>('JWT_EXPIRES_IN'),
    '15m',
  );
  return { secret, expiresIn };
}

export function refreshTokenSignOptions(
  configService: ConfigService,
): JwtSignOptions {
  const secret = configService.get<string>('JWT_REFRESH_SECRET');
  if (!secret?.trim()) {
    throw new Error('JWT_REFRESH_SECRET environment variable is required');
  }
  const expiresIn = jwtExpiresIn(
    configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
    '7d',
  );
  return { secret, expiresIn };
}
