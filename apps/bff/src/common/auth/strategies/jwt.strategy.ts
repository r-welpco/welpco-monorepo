import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  email: string;
  accountType: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: (() => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) throw new Error('JWT_SECRET environment variable must be configured');
        return secret;
      })(),
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.email) {
      this.logger.warn(
        `Invalid token payload: missing sub or email. Payload: ${JSON.stringify({ sub: payload.sub, email: payload.email, accountType: payload.accountType })}`,
      );
      throw new UnauthorizedException('Invalid token payload');
    }
    this.logger.debug(`Token validated successfully for user ${payload.sub} (${payload.email})`);
    return {
      userId: payload.sub,
      email: payload.email,
      accountType: payload.accountType,
    };
  }
}
