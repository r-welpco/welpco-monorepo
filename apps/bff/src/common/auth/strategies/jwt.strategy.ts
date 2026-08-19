import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import {
  AccountStatus,
  AccountType,
  UserAccount,
} from '../../../domains/user-management/entities/user-account.entity';
import type { Request } from 'express';
import { ROLE_MODE_HEADER, resolveEffectiveRole } from '../effective-role.util';

export interface JwtPayload {
  sub: string;
  email: string;
  accountType: string;
  authVersion?: number;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(UserAccount)
    private readonly userRepository: Repository<UserAccount>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: (() => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) throw new Error('JWT_SECRET environment variable must be configured');
        return secret;
      })(),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    if (!payload.sub) {
      this.logger.warn(
        `Invalid token payload: missing sub. Payload: ${JSON.stringify({ sub: payload.sub, accountType: payload.accountType })}`,
      );
      throw new UnauthorizedException('Invalid token payload');
    }

    const account = await this.userRepository.findOne({
      where: { id: payload.sub },
      select: [
        'id',
        'email',
        'accountType',
        'status',
        'signupCompleted',
        'authVersion',
      ],
    });
    if (!account) {
      throw new UnauthorizedException('Account no longer exists');
    }
    if (
      account.status === AccountStatus.SUSPENDED ||
      account.status === AccountStatus.DEACTIVATED
    ) {
      throw new UnauthorizedException('Account is inactive');
    }
    if (account.accountType === AccountType.GUARDIAN) {
      throw new UnauthorizedException('This account type is no longer supported');
    }
    if (
      account.accountType === AccountType.ADMIN &&
      account.status !== AccountStatus.ACTIVE
    ) {
      throw new UnauthorizedException('Admin account is inactive');
    }
    if ((payload.authVersion ?? 0) !== (account.authVersion ?? 0)) {
      throw new UnauthorizedException('Session has been revoked');
    }

    // Dual-role accounts: a Welper account may act as a customer for this
    // request via the X-Welpco-Role header. Downgrade-only — see
    // resolveEffectiveRole for the truth table.
    const effectiveRole = resolveEffectiveRole(
      account.accountType,
      req.headers[ROLE_MODE_HEADER],
    );
    if (!effectiveRole) {
      throw new UnauthorizedException('Unsupported account type');
    }

    return {
      userId: account.id,
      email: account.email,
      accountType: account.accountType,
      effectiveRole,
      signupCompleted: account.signupCompleted,
    };
  }
}
