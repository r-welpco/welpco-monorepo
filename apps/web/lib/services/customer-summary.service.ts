import { apiClient } from "@/lib/api/client";

export interface CustomerPublicSummary {
  customerId: string;
  displayName: string;
  photoUrl: string | null;
  averageRating: number | null;
  reviewCount: number;
  completedBookingsCount: number;
  jobPostingsCount: number;
  memberSince: string;
  profileComplete: boolean;
}

export async function getCustomerPublicSummary(
  customerId: string,
): Promise<CustomerPublicSummary> {
  return apiClient.get<CustomerPublicSummary>(
    `/api/profiles/customer/${encodeURIComponent(customerId)}/summary`,
  );
}
