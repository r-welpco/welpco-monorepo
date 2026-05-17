import type { WelperProfile } from '../entities/welper-profile.entity';
import type { IGeocodeService } from '../../geocode/geocode.interface';

const MILES_TO_KM = 1.60934;
export const SERVICE_AREA_RADIUS_KM_MIN = 1;
export const SERVICE_AREA_RADIUS_KM_MAX = 100;
export const SERVICE_AREA_RADIUS_KM_DEFAULT = 25;

/** Dashboard / signup JSON stored on `welper_profiles.service_area`. */
export interface RadiusServiceAreaPayload {
  type: 'radius';
  centerAddress: {
    streetAddress?: string;
    city: string;
    stateProvince: string;
    zipPostalCode?: string;
    country?: string;
  };
  radiusKm: number;
  /** @deprecated Legacy payloads; converted on read */
  radiusMiles?: number;
}

export function resolveRadiusKmFromPayload(
  serviceArea: Pick<RadiusServiceAreaPayload, 'radiusKm' | 'radiusMiles'>,
): number {
  const km = Number(serviceArea.radiusKm);
  if (Number.isFinite(km) && km > 0) return km;
  const miles = Number(serviceArea.radiusMiles);
  if (Number.isFinite(miles) && miles > 0) {
    return Math.round(miles * MILES_TO_KM * 10) / 10;
  }
  return SERVICE_AREA_RADIUS_KM_DEFAULT;
}

export function isRadiusServiceAreaPayload(
  value: unknown,
): value is RadiusServiceAreaPayload {
  if (!value || typeof value !== 'object') return false;
  const sa = value as Record<string, unknown>;
  if (sa.type !== 'radius') return false;
  const hasRadius = resolveRadiusKmFromPayload(sa as RadiusServiceAreaPayload) > 0;
  const addr = sa.centerAddress as Record<string, unknown> | undefined;
  const city = typeof addr?.city === 'string' ? addr.city.trim() : '';
  const province =
    typeof addr?.stateProvince === 'string' ? addr.stateProvince.trim() : '';
  return hasRadius && city.length > 0 && province.length >= 2;
}

export function isWelperServiceAreaStepComplete(welper: WelperProfile): boolean {
  return (
    Boolean(welper.serviceAreaCity?.trim()) &&
    Boolean(welper.provinceCode?.trim()) &&
    Boolean(welper.countryCode?.trim()) &&
    isRadiusServiceAreaPayload(welper.serviceArea)
  );
}

export function buildWelperServiceAreaFilledData(welper: WelperProfile) {
  const raw: unknown = welper.serviceArea;
  const sa = isRadiusServiceAreaPayload(raw) ? raw : undefined;
  return {
    city: welper.serviceAreaCity ?? sa?.centerAddress.city ?? '',
    province: welper.provinceCode ?? sa?.centerAddress.stateProvince ?? '',
    country: welper.countryCode ?? sa?.centerAddress.country ?? '',
    postalCodes: welper.serviceAreaPostalCodes ?? [],
    serviceArea: sa,
    radiusKm: sa ? resolveRadiusKmFromPayload(sa) : undefined,
  };
}

function normalizeCountryCode(country: string | undefined): string {
  const c = (country ?? '').trim().toUpperCase();
  if (c === 'CANADA' || c === 'CA') return 'CA';
  if (c === 'UNITED STATES' || c === 'US' || c === 'USA') return 'US';
  return c.length === 2 ? c : c.slice(0, 2);
}

function postalFromCenterAddress(
  centerAddress: RadiusServiceAreaPayload['centerAddress'],
): { postalCode: string; countryCode?: string } | null {
  const zip = (centerAddress.zipPostalCode ?? '').trim();
  if (!zip) return null;
  return {
    postalCode: zip,
    countryCode: normalizeCountryCode(centerAddress.country),
  };
}

/**
 * Persist radius service area on the welper profile and geocode center for search.
 */
export async function applyRadiusServiceAreaToWelperProfile(
  profile: WelperProfile,
  serviceArea: RadiusServiceAreaPayload,
  geocodeService: IGeocodeService,
  log?: { warn: (msg: string) => void },
): Promise<void> {
  const km = Math.min(
    SERVICE_AREA_RADIUS_KM_MAX,
    Math.max(SERVICE_AREA_RADIUS_KM_MIN, Math.round(resolveRadiusKmFromPayload(serviceArea))),
  );
  const payload: RadiusServiceAreaPayload = {
    type: 'radius',
    centerAddress: {
      streetAddress: serviceArea.centerAddress.streetAddress?.trim() || undefined,
      city: serviceArea.centerAddress.city.trim(),
      stateProvince: serviceArea.centerAddress.stateProvince.trim().toUpperCase(),
      zipPostalCode: serviceArea.centerAddress.zipPostalCode?.trim() || undefined,
      country: serviceArea.centerAddress.country?.trim() || undefined,
    },
    radiusKm: km,
  };

  profile.serviceArea = payload as unknown as WelperProfile['serviceArea'];
  profile.serviceAreaCity = payload.centerAddress.city;
  profile.provinceCode = payload.centerAddress.stateProvince;
  profile.countryCode = normalizeCountryCode(payload.centerAddress.country);
  profile.serviceAreaPostalCodes = payload.centerAddress.zipPostalCode
    ? [payload.centerAddress.zipPostalCode.toUpperCase()]
    : [];

  const addr = postalFromCenterAddress(payload.centerAddress);
  if (!addr) {
    profile.latitude = null;
    profile.longitude = null;
    return;
  }

  try {
    const geocode = await geocodeService.forward(addr.postalCode, addr.countryCode);
    if (geocode.latitude != null && geocode.longitude != null) {
      profile.latitude = geocode.latitude;
      profile.longitude = geocode.longitude;
    }
  } catch (err) {
    log?.warn(
      `Could not geocode service area: ${err instanceof Error ? err.message : String(err)}`,
    );
    profile.latitude = null;
    profile.longitude = null;
  }
}
