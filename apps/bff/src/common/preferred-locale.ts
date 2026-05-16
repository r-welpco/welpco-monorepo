/** Supported email / UI locales persisted on user_accounts.preferred_locale */
export const USER_PREFERRED_LOCALES = ['en', 'fr'] as const;
export type UserPreferredLocale = (typeof USER_PREFERRED_LOCALES)[number];

export const DEFAULT_PREFERRED_LOCALE: UserPreferredLocale = 'en';

export function normalizePreferredLocale(
  value: unknown,
): UserPreferredLocale | null {
  if (value === 'en' || value === 'fr') return value;
  if (typeof value === 'string') {
    const lower = value.trim().toLowerCase();
    if (lower === 'en' || lower.startsWith('en-')) return 'en';
    if (lower === 'fr' || lower.startsWith('fr')) return 'fr';
  }
  return null;
}

export function resolvePreferredLocale(
  value: unknown,
  fallback: UserPreferredLocale = DEFAULT_PREFERRED_LOCALE,
): UserPreferredLocale {
  return normalizePreferredLocale(value) ?? fallback;
}

/** Prefix for localized auth/marketing paths in transactional emails. */
export function localePathPrefix(locale: UserPreferredLocale): string {
  return locale === 'fr' ? '/fr' : '';
}
