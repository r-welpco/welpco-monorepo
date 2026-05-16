/** Core marketing paths (locale-stripped). Phase 1 scope only. */
const MARKETING_SLUGS = [
  "",
  "about",
  "how-it-works",
  "faq",
  "contact",
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
