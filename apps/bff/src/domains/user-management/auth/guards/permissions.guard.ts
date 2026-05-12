import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AbilitiesFactory, Action } from '../abilities.factory';
import { PERMISSIONS_KEY } from '../../../../common/auth';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private abilitiesFactory: AbilitiesFactory,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<{
      action: string;
      subject: string;
    }>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const ability = this.abilitiesFactory.createForUser(user);

    if (!ability.can(requiredPermissions.action as Action, requiredPermissions.subject as any)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}

