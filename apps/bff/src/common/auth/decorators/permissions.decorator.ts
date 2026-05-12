import { SetMetadata } from '@nestjs/common';
import { Subject } from '@casl/ability';

export const PERMISSIONS_KEY = 'permissions';

export interface PermissionMetadata {
  action: string;
  subject: string | Subject;
}

export const Permissions = (action: string, subject: string | Subject) =>
  SetMetadata(PERMISSIONS_KEY, { action, subject } as PermissionMetadata);
