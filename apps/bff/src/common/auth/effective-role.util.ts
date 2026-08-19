import { ForbiddenException } from '@nestjs/common';

export type EffectiveAppRole = 'customer' | 'welper' | 'admin';

/**
 * Request header carrying the client's acting-role mode (dual-role accounts).
 * Honored only to downgrade a Welper account to customer mode — the reverse
 * direction can never elevate, so the client-supplied value is safe by
 * construction. Any other value or account type falls back to the account's
 * own role.
 */
export const ROLE_MODE_HEADER = 'x-welpco-role';

export function resolveEffectiveRole(
  accountType: string | null | undefined,
  requestedRole: unknown,
): EffectiveAppRole | undefined {
  const base = roleFromAccountType(accountType);
  if (
    base === 'welper' &&
    typeof requestedRole === 'string' &&
    requestedRole.toLowerCase() === 'customer'
  ) {
    return 'customer';
  }
  return base;
}

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
