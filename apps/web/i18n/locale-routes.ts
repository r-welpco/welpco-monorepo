import type { Locale } from "./routing";

/** Core marketing paths (locale-stripped). Phase 1 scope only. */
const MARKETING_SLUGS = [
  "",
  "about",
  "how-it-works",
  "faq",
  "contact",
  "legal",
] as const;

/** Auth paths (locale-stripped). */
const AUTH_PREFIXES = [
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "verification",
  "guardian",
] as const;

export function hasFrenchPrefix(pathname: string): boolean {
  return pathname === "/fr" || pathname.startsWith("/fr/");
}

/** Strip `/fr` prefix; unprefixed paths are English. */
export function stripLocale(pathname: string): string {
  if (hasFrenchPrefix(pathname)) {
    const rest = pathname.slice(3);
    return rest === "" ? "/" : rest;
  }
  return pathname;
}

export function isMarketingRoute(pathname: string): boolean {
  const path = stripLocale(pathname);
  if (path === "/") return true;
  const segment = path.slice(1).split("/")[0];
  return MARKETING_SLUGS.includes(
    segment as (typeof MARKETING_SLUGS)[number],
  );
}

export function isAuthRoute(pathname: string): boolean {
  const path = stripLocale(pathname);
  const segment = path.slice(1).split("/")[0];
  return AUTH_PREFIXES.includes(segment as (typeof AUTH_PREFIXES)[number]);
}

export function isLocaleAwareRoute(pathname: string): boolean {
  return isMarketingRoute(pathname) || isAuthRoute(pathname);
}

/** Prefix path for French; English paths stay unprefixed (as-needed). */
export function localizedPath(path: string, locale: Locale): string {
  if (locale === "fr") {
    return path === "/" ? "/fr" : `/fr${path}`;
  }
  return path;
}

/** Prefix path when request pathname is already under `/fr`. */
export function localizedPathFromRequest(path: string, pathname: string): string {
  return hasFrenchPrefix(pathname) ? localizedPath(path, "fr") : path;
}
