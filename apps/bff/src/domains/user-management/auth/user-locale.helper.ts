import {
  normalizePreferredLocale,
  resolvePreferredLocale,
  type UserPreferredLocale,
} from '../../../common/preferred-locale';
import { UserAccount } from '../entities/user-account.entity';

/** Apply a client-supplied locale when present; returns whether the row changed. */
export function applyPreferredLocaleIfProvided(
  user: UserAccount,
  preferredLocale: unknown,
): boolean {
  const normalized = normalizePreferredLocale(preferredLocale);
  if (!normalized || user.preferredLocale === normalized) {
    return false;
  }
  user.preferredLocale = normalized;
  return true;
}

export function emailLocaleForUser(user: UserAccount): UserPreferredLocale {
  return resolvePreferredLocale(user.preferredLocale);
}
