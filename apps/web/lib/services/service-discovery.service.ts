import { apiClient } from "@/lib/api/client";
import type {
  SearchServicesResponse,
  SearchServicesParams,
  PublicWelperProfile,
} from "@/types";

const SEARCH_BASE = "/api/search";

/** Build query string from params (skip undefined/null/empty). */
function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Search for services and Welpers. Public endpoint (no auth).
 */
export async function searchServices(
  params: SearchServicesParams = {}
): Promise<SearchServicesResponse> {
  const query = buildQuery({
    q: params.q,
    categoryId: params.categoryId,
    countryCode: params.countryCode,
    postalCode: params.postalCode,
    latitude: params.latitude,
    longitude: params.longitude,
    radiusKm: params.radiusKm,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    minRating: params.minRating,
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    sort: params.sort ?? "relevance",
  });
  return apiClient.get<SearchServicesResponse>(`${SEARCH_BASE}/services${query}`, {
    skipAuth: true,
  });
}

/**
 * Get categories for browsing. Public endpoint (no auth).
 *
 * Wave 2 (BFF): each item now carries `displayOrder` (server-side sort
 * authority). The marketing-site landing-services component uses this to
 * deep-link into search via `?categoryId=…` instead of free-text `?q=`.
 */
export async function getDiscoveryCategories(includeCounts?: boolean): Promise<
  Array<{
    id: string;
    name: string;
    description: string | null;
    parentId: string | null;
    displayOrder: number;
    servicesCount?: number;
  }>
> {
  const query = includeCounts ? "?includeCounts=true" : "";
  return apiClient.get(`${SEARCH_BASE}/categories${query}`, { skipAuth: true });
}

/**
 * Get public Welper profile with service offerings. Public endpoint (no auth).
 */
export async function getPublicWelperProfile(
  welperId: string
): Promise<PublicWelperProfile> {
  return apiClient.get<PublicWelperProfile>(
    `${SEARCH_BASE}/welpers/${encodeURIComponent(welperId)}`,
    { skipAuth: true }
  );
}
