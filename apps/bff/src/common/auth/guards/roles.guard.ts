import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { roleFromAccountType } from '../effective-role.util';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      return false;
    }
    const effectiveRole =
      user.effectiveRole ?? roleFromAccountType(user.accountType);
    if (!effectiveRole) {
      return false;
    }
    return requiredRoles.some(
      (role) => role.toLowerCase() === String(effectiveRole).toLowerCase(),
    );
  }
}
