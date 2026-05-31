import { getLocaleFromGeo } from "./geo";
import { routing, type Locale } from "./routing";

/**
 * Resolve UI locale for a request.
 * 1. NEXT_LOCALE cookie — explicit user choice (language switcher)
 * 2. Geo headers — Quebec → fr, other CA → en, etc.
 * 3. routing.defaultLocale
 */
export function resolveRequestLocale(options: {
  cookieValue?: string | null;
  country?: string;
  region?: string;
}): Locale {
  if (options.cookieValue === "fr" || options.cookieValue === "en") {
    return options.cookieValue;
  }

  const geo = getLocaleFromGeo(options.country, options.region);
  if (geo) return geo;

  return routing.defaultLocale;
}

export function resolveLocaleFromRequestHeaders(
  cookieValue: string | undefined | null,
  headers: Headers,
): Locale {
  const country =
    headers.get("x-vercel-ip-country") ??
    headers.get("cf-ipcountry") ??
    undefined;
  const region = headers.get("x-vercel-ip-country-region") ?? undefined;

  return resolveRequestLocale({ cookieValue, country, region });
}
