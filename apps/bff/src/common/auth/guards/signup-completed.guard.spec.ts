import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SignupCompletedGuard } from './signup-completed.guard';

function context(user: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as ExecutionContext;
}

describe('SignupCompletedGuard', () => {
  const guard = new SignupCompletedGuard();

  it('allows completed customer and welper accounts', () => {
    expect(
      guard.canActivate(
        context({ effectiveRole: 'customer', signupCompleted: true }),
      ),
    ).toBe(true);
  });

  it('allows admins without product signup state', () => {
    expect(
      guard.canActivate(
        context({ effectiveRole: 'admin', signupCompleted: false }),
      ),
    ).toBe(true);
  });

  it('rejects incomplete product accounts', () => {
    expect(() =>
      guard.canActivate(
        context({ effectiveRole: 'welper', signupCompleted: false }),
      ),
    ).toThrow(ForbiddenException);
  });
});
