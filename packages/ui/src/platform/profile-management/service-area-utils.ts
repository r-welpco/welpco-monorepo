import type { ServiceArea } from "./service-area-selector";

export const SERVICE_AREA_RADIUS_KM_MIN = 1;
export const SERVICE_AREA_RADIUS_KM_MAX = 100;
export const SERVICE_AREA_RADIUS_KM_DEFAULT = 25;

const MILES_TO_KM = 1.60934;

/** Resolve radius in km from stored payload (prefers `radiusKm`, converts legacy `radiusMiles`). */
export function resolveServiceAreaRadiusKm(
  area?: Pick<ServiceArea, "radiusKm" | "radiusMiles"> | null,
): number {
  const km = Number(area?.radiusKm);
  if (Number.isFinite(km) && km > 0) return km;
  const miles = Number(area?.radiusMiles);
  if (Number.isFinite(miles) && miles > 0) {
    return Math.round(miles * MILES_TO_KM * 10) / 10;
  }
  return SERVICE_AREA_RADIUS_KM_DEFAULT;
}

/** Prefill radius input only when the user already saved a value (resume signup / profile). */
export function radiusInputFromServiceArea(
  area?: Pick<ServiceArea, "radiusKm" | "radiusMiles"> | null,
): string {
  if (!area) return "";
  const km = Number(area.radiusKm);
  if (Number.isFinite(km) && km > 0) return String(km);
  const miles = Number(area.radiusMiles);
  if (Number.isFinite(miles) && miles > 0) {
    return String(Math.round(miles * MILES_TO_KM * 10) / 10);
  }
  return "";
}
