import { ForbiddenException } from '@nestjs/common';

export type EffectiveAppRole = 'customer' | 'welper' | 'admin';

export function roleFromAccountType(
  accountType: string | null | undefined,
): EffectiveAppRole | undefined {
  const normalized = accountType?.toLowerCase() ?? '';
  if (normalized === 'customer') return 'customer';
  if (normalized === 'welper') return 'welper';
  if (normalized === 'admin') return 'admin';
  return undefined;
}

export interface AuthUserRoleFields {
  effectiveRole?: EffectiveAppRole | string;
  accountType?: string;
}

/** Customer vs welper routing for product endpoints (not admin/guardian). */
export function customerWelperRoleForAuthUser(
  user: AuthUserRoleFields,
): 'customer' | 'welper' {
  const effective =
    (user.effectiveRole as EffectiveAppRole | undefined) ??
    roleFromAccountType(user.accountType);
  if (effective === 'customer' || effective === 'welper') {
    return effective;
  }
  throw new ForbiddenException('Customer or welper role required');
}
