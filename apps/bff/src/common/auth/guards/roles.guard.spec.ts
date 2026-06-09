import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';

function mockContext(user: Record<string, unknown> | undefined): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['welper']);
  });

  it('allows welper when effectiveRole is welper despite JWT Customer accountType', () => {
    const ctx = mockContext({
      accountType: 'Customer',
      effectiveRole: 'welper',
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('denies welper route when effectiveRole is customer', () => {
    const ctx = mockContext({
      accountType: 'Welper',
      effectiveRole: 'customer',
    });
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('falls back to accountType when effectiveRole is absent', () => {
    const ctx = mockContext({ accountType: 'Welper' });
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
