import { isAuthRoute, isMarketingRoute, localizedPath } from "@/i18n/locale-routes";
import type { Locale } from "@/i18n/routing";

/** Dashboard and welper app shell — not under `[locale]` in the App Router. */
export function isDashboardPath(href: string): boolean {
  const path = href.split("?")[0]?.split("#")[0] ?? href;
  return path.startsWith("/dashboard") || path.startsWith("/welper/");
}

/**
 * Resolve href for the active locale.
 * Dashboard paths stay unprefixed; auth/marketing get `/fr` when locale is French.
 */
export function resolveAppHref(href: string, locale: Locale): string {
  const queryIndex = href.indexOf("?");
  const hashIndex = href.indexOf("#");
  const pathEnd =
    queryIndex === -1
      ? hashIndex === -1
        ? href.length
        : hashIndex
      : hashIndex === -1
        ? queryIndex
        : Math.min(queryIndex, hashIndex);
  const pathPart = href.slice(0, pathEnd);
  const suffix = href.slice(pathEnd);

  if (isDashboardPath(pathPart)) {
    return href;
  }

  if (
    locale === "fr" &&
    (isAuthRoute(pathPart) ||
      isMarketingRoute(pathPart) ||
      pathPart === "/verification")
  ) {
    return localizedPath(pathPart, "fr") + suffix;
  }

  return href;
}

/** Strip legacy `/fr/dashboard` prefix from notification or auth handoff URLs. */
export function normalizeDashboardActionUrl(url: string): string {
  if (url === "/fr/dashboard" || url.startsWith("/fr/dashboard/")) {
    return url.slice(3) || "/dashboard";
  }
  return url;
}
