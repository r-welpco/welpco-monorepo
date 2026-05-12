import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface TestUser {
  id: string;
  email: string;
  accountType: string;
}

export class TestAuthHelper {
  private jwtService: JwtService;
  private configService: ConfigService;

  constructor() {
    this.configService = new ConfigService({
      JWT_SECRET: 'test-secret-key',
      JWT_REFRESH_SECRET: 'test-refresh-secret-key',
      JWT_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
    });
    this.jwtService = new JwtService({
      secret: this.configService.get<string>('JWT_SECRET'),
    });
  }

  generateAccessToken(user: Partial<TestUser>): string {
    return this.jwtService.sign(
      {
        sub: user.id || 'test-user-id',
        email: user.email || 'test@example.com',
        accountType: user.accountType || 'Customer',
      },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
      },
    );
  }

  generateRefreshToken(user: Partial<TestUser>): string {
    return this.jwtService.sign(
      {
        sub: user.id || 'test-user-id',
        email: user.email || 'test@example.com',
        accountType: user.accountType || 'Customer',
      },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
      },
    );
  }

  generateTokens(user: Partial<TestUser>): { accessToken: string; refreshToken: string } {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
    };
  }
}
