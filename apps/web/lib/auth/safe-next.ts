/**
 * Auth-handoff redirect helper.
 *
 * Public surfaces (welper profile, search, etc.) hand a user off to /login or
 * /register with a `?next=<encoded path>` query param. After authentication
 * the auth pages should send the user back to that path instead of landing on
 * `/dashboard`.
 *
 * Open-redirect guard: only same-origin **paths** are allowed. Anything that
 * starts with `//`, contains a scheme, or otherwise looks like an external
 * URL falls back to the supplied default.
 *
 * Decoding is best-effort — malformed encodings are rejected rather than
 * thrown, so an attacker can't cause the auth flow to crash by injecting
 * `%E0%A4%A` etc. into a public link.
 */
export function safeNextPath(rawNext: string | null | undefined, fallback = "/dashboard"): string {
  if (!rawNext) return fallback;

  let decoded: string;
  try {
    decoded = decodeURIComponent(rawNext);
  } catch {
    return fallback;
  }

  // Must be a path on this origin: starts with `/` and is NOT a protocol-relative URL.
  if (!decoded.startsWith("/")) return fallback;
  if (decoded.startsWith("//")) return fallback;
  if (decoded.startsWith("/\\")) return fallback;

  // Defensive: reject embedded scheme markers and CR/LF.
  if (/[\r\n]/.test(decoded)) return fallback;

  // next-intl may have produced `/fr/dashboard/*`; app shell has no `[locale]` segment.
  if (decoded === "/fr/dashboard" || decoded.startsWith("/fr/dashboard/")) {
    return decoded.slice(3) || "/dashboard";
  }

  return decoded;
}

/**
 * Forward an existing `?next=` to another auth page so the redirect target
 * survives a hop (e.g. login -> verification -> onboarding-welcome -> next).
 */
export function withNext(href: string, next: string | null | undefined): string {
  if (!next) return href;
  const safe = safeNextPath(next, "");
  if (!safe) return href;
  const sep = href.includes("?") ? "&" : "?";
  return `${href}${sep}next=${encodeURIComponent(safe)}`;
}
