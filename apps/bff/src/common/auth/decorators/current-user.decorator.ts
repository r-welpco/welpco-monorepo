import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { EffectiveAppRole } from '../effective-role.util';

export interface CurrentUserData {
  userId: string;
  email: string;
  accountType: string;
  effectiveRole: EffectiveAppRole;
  signupCompleted: boolean;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserData => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
