import { apiClient } from "@/lib/api/client";

export interface ReverseGeocodeResult {
  countryCode?: string;
  countryName?: string;
  provinceCode?: string;
  provinceName?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface ForwardGeocodeResult {
  latitude?: number;
  longitude?: number;
  countryCode?: string;
  countryName?: string;
  provinceCode?: string;
  provinceName?: string;
  postalCode?: string;
}

/**
 * Reverse geocode coordinates to address (country, province, postal code).
 * Used when user allows "Use my location" to fill search filters.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
  });
  return apiClient.get<ReverseGeocodeResult>(`/api/geocode/reverse?${params.toString()}`, {
    skipAuth: true,
  });
}

/**
 * Forward geocode postal code to coordinates (and optional address).
 * Used for "search near postal code".
 */
export async function forwardGeocode(
  postalCode: string,
  countryCode?: string
): Promise<ForwardGeocodeResult> {
  const params = new URLSearchParams({ postalCode: postalCode.trim() });
  if (countryCode?.trim()) params.set("countryCode", countryCode.trim());
  return apiClient.get<ForwardGeocodeResult>(`/api/geocode/forward?${params.toString()}`, {
    skipAuth: true,
  });
}
