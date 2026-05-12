/**
 * Public-facing service-area shape used by the welper-profile API surface.
 *
 * Distinct from the legacy `ServiceArea` GeoJSON shape (used internally for
 * radius search). The web app's `/welpers/[id]` hero renders this as
 * "Toronto, ON · Serves M5V…" — the postal-code prefixes are optional and
 * allowed to be empty when the welper covers the whole city.
 */
export interface ServiceAreaInfo {
  /** Free-form city name (e.g. "Toronto"). */
  city: string;
  /** ISO 3166-2 subdivision code (e.g. "ON"). */
  province: string;
  /** ISO 3166-1 alpha-2 country code (e.g. "CA"). */
  country: string;
  /**
   * Postal-code prefixes the welper serves (e.g. ["M5V","M5W","M6G"]).
   * May be empty when the welper covers the entire city.
   */
  postalCodes: string[];
}
