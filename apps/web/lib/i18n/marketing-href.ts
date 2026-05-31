import { routing, type Locale } from "@/i18n/routing";

/** Build a locale-aware marketing-site href (dashboard opens these in a new tab). */
export function marketingHref(locale: Locale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (locale === routing.defaultLocale) {
    return normalized;
  }
  return `/${locale}${normalized}`;
}
