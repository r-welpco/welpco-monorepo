"use client";

import { useQuery } from "@tanstack/react-query";
import { getCustomerPublicSummary } from "@/lib/services/customer-summary.service";

export function customerSummaryQueryKey(customerId: string) {
  return ["customerPublicSummary", customerId] as const;
}

export function useCustomerPublicSummary(customerId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: customerId ? customerSummaryQueryKey(customerId) : ["customerPublicSummary", "none"],
    queryFn: () => getCustomerPublicSummary(customerId!),
    enabled: enabled && Boolean(customerId),
    staleTime: 60_000,
  });
}
