/** Quebec: French. Other Canadian regions: English. */
const QUEBEC_REGION = "QC";

/** Countries where we default to French (excluding Canada, handled by region). */
const FRANCOPHONE_COUNTRIES = new Set([
  "FR", "BE", "CH", "LU", "MC",
  "SN", "CI", "ML", "BF", "NE", "TD", "GN",
  "CG", "CD", "CM", "GA", "MG", "HT", "DJ",
  "KM", "TG", "BJ", "CF", "RW", "BI", "VU",
]);

export function getLocaleFromGeo(
  country: string | undefined,
  region: string | undefined,
): "fr" | "en" | null {
  if (!country) return null;
  const c = country.toUpperCase();
  const r = region?.toUpperCase();

  if (c === "CA") {
    return r === QUEBEC_REGION ? "fr" : "en";
  }
  return FRANCOPHONE_COUNTRIES.has(c) ? "fr" : "en";
}

export function readGeoFromHeaders(headers: Headers): {
  country: string | undefined;
  region: string | undefined;
} {
  return {
    country:
      headers.get("x-vercel-ip-country") ??
      headers.get("cf-ipcountry") ??
      undefined,
    region: headers.get("x-vercel-ip-country-region") ?? undefined,
  };
}
