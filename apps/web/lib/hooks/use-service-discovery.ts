import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  searchServices,
  getDiscoveryCategories,
  getPublicWelperProfile,
} from "@/lib/services/service-discovery.service";
import type { SearchServicesParams } from "@/types";

export function useSearchServices(params: SearchServicesParams = {}, enabled = true) {
  return useQuery({
    queryKey: ["searchServices", params],
    queryFn: () => searchServices(params),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    placeholderData: keepPreviousData,
  });
}

export function useDiscoveryCategories(includeCounts?: boolean, enabled = true) {
  return useQuery({
    queryKey: ["discoveryCategories", includeCounts ?? false],
    queryFn: () => getDiscoveryCategories(includeCounts),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function usePublicWelperProfile(welperId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ["publicWelperProfile", welperId],
    queryFn: () => getPublicWelperProfile(welperId!),
    enabled: !!welperId && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
