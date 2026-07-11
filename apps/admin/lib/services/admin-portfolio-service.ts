import { apiClient } from "@/lib/api/client";

export type AdminPortfolioPhotoStatus = "pending" | "approved" | "rejected";

export interface AdminPortfolioPhoto {
  id: string;
  welperId: string;
  welperName: string;
  offeringId: string | null;
  s3Key: string;
  url: string;
  caption: string | null;
  sortOrder: number;
  status: AdminPortfolioPhotoStatus;
  rejectionReason: string | null;
  createdAt: string;
}

export interface AdminPortfolioPhotosResponse {
  items: AdminPortfolioPhoto[];
  total: number;
  page: number;
  limit: number;
}

export async function listAdminPortfolioPhotos(params?: {
  page?: number;
  limit?: number;
  /** Defaults to `pending` on the BFF when omitted. */
  status?: AdminPortfolioPhotoStatus | "all";
}): Promise<AdminPortfolioPhotosResponse> {
  return apiClient.get<AdminPortfolioPhotosResponse>("/api/admin/portfolio-photos", {
    params: { ...params },
  });
}

export async function moderateAdminPortfolioPhoto(
  id: string,
  body: { status: "approved" | "rejected"; rejectionReason?: string },
): Promise<AdminPortfolioPhoto> {
  return apiClient.patch<AdminPortfolioPhoto>(
    `/api/admin/portfolio-photos/${encodeURIComponent(id)}`,
    body,
  );
}
