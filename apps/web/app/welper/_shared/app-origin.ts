/**
 * Share-card / OG origin helpers — no hardcoded `welpco.com` in render code.
 *
 * Two situations:
 * - Route handlers (e.g. `/api/share-card/[welperId]`) have the request, so
 *   the origin is derived from proxy-aware headers via `originFromHeaders`.
 * - Metadata image routes (`opengraph-image` / `twitter-image`) have no
 *   request object; they use `envAppOrigin()` — `NEXT_PUBLIC_APP_URL` when
 *   set (falling back to the older `NEXT_PUBLIC_SITE_URL` convention used by
 *   robots/sitemap), else the literal production domain.
 */

export const PRODUCTION_ORIGIN = "https://welpco.com";

/** Welpco support inbox printed on downloadable share cards. */
export const SUPPORT_EMAIL = "support@welpco.com";

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/** Build-time-configured app origin for routes without a request object. */
export function envAppOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    PRODUCTION_ORIGIN;
  return stripTrailingSlash(raw.trim()) || PRODUCTION_ORIGIN;
}

/** Human-readable host for printing on cards ("welpco.com", "localhost:8081"). */
export function displayHost(origin: string): string {
  return stripTrailingSlash(origin).replace(/^https?:\/\//i, "");
}

const LOCAL_HOST_PATTERN = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?$/i;

/**
 * Request-derived origin for route handlers: `x-forwarded-host` → `host`,
 * proto from `x-forwarded-proto` (fallback https; localhost stays http).
 * Falls back to `envAppOrigin()` when no host header survives the proxy.
 */
export function originFromHeaders(headers: Headers): string {
  const rawHost =
    headers.get("x-forwarded-host") ?? headers.get("host") ?? "";
  const host = rawHost.split(",")[0]?.trim() ?? "";
  if (!host) return envAppOrigin();

  const rawProto = headers.get("x-forwarded-proto");
  const proto =
    rawProto?.split(",")[0]?.trim() ||
    (LOCAL_HOST_PATTERN.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}
