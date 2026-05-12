import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { EmailVerifiedGuard } from './email-verified.guard';
import { UserAccount } from '../../domains/user-management/entities/user-account.entity';

/**
 * Day 15 — Phase 1 of the signup ↔ onboarding merge.
 *
 * Specs the guard contract (per `SIGNUP_MERGE_PLAN.md` Phase 1):
 *  - 403 with `EMAIL_VERIFICATION_REQUIRED` when not verified.
 *  - true when verified.
 *  - 403 (not 401) when no principal is present — a misconfigured route is
 *    surfaced as a verification problem, not an auth problem, because Phase 3
 *    only ever applies the guard *after* JwtAuthGuard. The guard is not the
 *    auth gate.
 */
describe('EmailVerifiedGuard', () => {
  let guard: EmailVerifiedGuard;
  let userRepo: jest.Mocked<Repository<UserAccount>>;

  const mkContext = (user?: { userId?: string }): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailVerifiedGuard,
        {
          provide: getRepositoryToken(UserAccount),
          useValue: { findOne: jest.fn() },
        },
      ],
    }).compile();
    guard = module.get(EmailVerifiedGuard);
    userRepo = module.get(getRepositoryToken(UserAccount));
  });

  it('returns true when the user is verified', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 'u1',
      emailVerified: true,
    } as UserAccount);
    await expect(
      guard.canActivate(mkContext({ userId: 'u1' })),
    ).resolves.toBe(true);
  });

  it('throws ForbiddenException with code EMAIL_VERIFICATION_REQUIRED when not verified', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 'u1',
      emailVerified: false,
    } as UserAccount);
    let caught: any;
    try {
      await guard.canActivate(mkContext({ userId: 'u1' }));
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ForbiddenException);
    expect((caught.getResponse() as any).code).toBe(
      'EMAIL_VERIFICATION_REQUIRED',
    );
  });

  it('throws ForbiddenException when no principal is on the request', async () => {
    await expect(guard.canActivate(mkContext(undefined))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('throws ForbiddenException when the user no longer exists', async () => {
    userRepo.findOne.mockResolvedValue(null);
    await expect(
      guard.canActivate(mkContext({ userId: 'u1' })),
    ).rejects.toThrow(ForbiddenException);
  });
});
