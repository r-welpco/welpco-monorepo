import { apiClient } from "@/lib/api/client";

export interface AdminReview {
  id: string;
  bookingId: string;
  reviewerId: string;
  revieweeId: string;
  reviewerType: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminReviewsResponse {
  items: AdminReview[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listAdminReviews(params?: {
  page?: number;
  limit?: number;
  revieweeId?: string;
  reviewerType?: string;
  minRating?: number;
  maxRating?: number;
}): Promise<AdminReviewsResponse> {
  return apiClient.get<AdminReviewsResponse>("/api/admin/reviews", { params: { ...params } });
}

export async function deleteAdminReview(id: string): Promise<void> {
  await apiClient.delete(`/api/admin/reviews/${encodeURIComponent(id)}`);
}
