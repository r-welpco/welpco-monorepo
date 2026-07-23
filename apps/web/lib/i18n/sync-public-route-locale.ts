import {
  persistDashboardLocaleCookie,
  type DashboardLocale,
} from "@/lib/i18n/dashboard-locale";

/**
 * Public `/search` and `/welper/[id]` live outside `app/[locale]` and resolve
 * UI locale from `NEXT_LOCALE` (cookie) then geo. Call this before navigating
 * from marketing so the selected language sticks.
 */
export function syncPublicRouteLocale(locale: string) {
  if (locale === "en" || locale === "fr") {
    persistDashboardLocaleCookie(locale as DashboardLocale);
  }
}
