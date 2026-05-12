import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAccount } from '../../domains/user-management/entities/user-account.entity';

/**
 * Day 15 — Phase 1 of the signup ↔ onboarding merge.
 *
 * Gates "bookable actions" (create-booking, payment-related ops, sensitive
 * account-settings updates) on the user having clicked their verification
 * email. The signup wizard itself does NOT require this — verification is
 * parallel-during, not pre-onboarding.
 *
 * Phase 1 only ships the guard + spec. Phase 3 wires it onto specific
 * endpoints (per `SIGNUP_MERGE_PLAN.md`). The guard is intentionally not
 * applied yet — this avoids breaking endpoints during the staged migration.
 *
 * Returns 403 with a structured body so the web error layer can show a
 * focused dialog ("Verify your email to confirm this booking") instead of a
 * generic 403 toast.
 */
@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(
    @InjectRepository(UserAccount)
    private readonly userRepo: Repository<UserAccount>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const principal = request.user as { userId?: string } | undefined;

    if (!principal?.userId) {
      // Auth-required endpoints sit behind JwtAuthGuard already; if no user
      // is on the request when this guard runs, treat as forbidden — this
      // also guards against accidental application without JwtAuthGuard.
      throw new ForbiddenException({
        code: 'EMAIL_VERIFICATION_REQUIRED',
        message: 'Verify your email to continue',
      });
    }

    const user = await this.userRepo.findOne({
      where: { id: principal.userId },
      select: ['id', 'emailVerified'],
    });
    if (!user || !user.emailVerified) {
      throw new ForbiddenException({
        code: 'EMAIL_VERIFICATION_REQUIRED',
        message: 'Verify your email to continue',
      });
    }
    return true;
  }
}
