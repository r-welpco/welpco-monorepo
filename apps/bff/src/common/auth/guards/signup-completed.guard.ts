import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class SignupCompletedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user as
      | {
          effectiveRole?: string;
          signupCompleted?: boolean;
        }
      | undefined;

    if (user?.effectiveRole === 'admin') {
      return true;
    }
    if (user?.signupCompleted === true) {
      return true;
    }
    throw new ForbiddenException({
      code: 'SIGNUP_COMPLETION_REQUIRED',
      message: 'Complete signup to continue',
    });
  }
}
