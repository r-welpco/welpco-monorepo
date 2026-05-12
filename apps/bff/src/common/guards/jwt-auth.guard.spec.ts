import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

function createMockContext(overrides: { getRequest?: () => object } = {}): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: overrides.getRequest ?? (() => ({ headers: {} })),
    }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  describe('canActivate', () => {
    it('should return true when route is marked Public', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const context = createMockContext();

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should delegate to parent when not Public', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const parentCanActivate = jest.fn().mockReturnValue(true);
      const guardProto = Object.getPrototypeOf(guard);
      const parentProto = Object.getPrototypeOf(guardProto);
      const spy = jest.spyOn(parentProto, 'canActivate').mockImplementation(parentCanActivate);

      const context = createMockContext({
        getRequest: () => ({ headers: { authorization: 'Bearer valid-token' } }),
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(parentCanActivate).toHaveBeenCalledWith(context);
      spy.mockRestore();
    });

    it('should throw when not Public and parent throws UnauthorizedException', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const parentProto = Object.getPrototypeOf(Object.getPrototypeOf(guard));
      jest.spyOn(parentProto, 'canActivate').mockImplementation(() => {
        throw new UnauthorizedException();
      });

      const context = createMockContext();

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);

      jest.restoreAllMocks();
    });
  });
});
