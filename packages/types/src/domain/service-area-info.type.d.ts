/**
 * Public-facing service-area shape consumed by the welper public profile hero.
 *
 * Distinct from the legacy GeoJSON `ServiceArea` (used for radius search):
 * this is the "Toronto, ON · Serves M5V…" rendering primitive.
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
//# sourceMappingURL=service-area-info.type.d.ts.map