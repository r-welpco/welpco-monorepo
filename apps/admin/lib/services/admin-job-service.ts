import { apiClient } from "@/lib/api/client";

export interface AdminJobListItem {
  id: string;
  title: string;
  customerId?: string;
  categoryId: string;
  subcategoryId: string;
  categoryLabel?: string | null;
  subcategoryLabel?: string | null;
  status: string;
  applicationCount: number;
  scheduledDate: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  durationMinutes: number;
  locationCity?: string | null;
  locationRegion?: string | null;
  publishedAt: string | null;
  createdAt: string;
  bookingId?: string | null;
}

export interface AdminJobDetail extends AdminJobListItem {
  customerId: string;
  description: string;
  locationAddress?: string | null;
  answers: Record<string, string | number | boolean>;
  scheduledDate: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  durationMinutes: number;
  expiresAt: string;
  applications: Array<{
    id: string;
    welperId: string;
    offeringId: string;
    proposalMessage: string;
    status: string;
    hourlyRateSnapshot?: number | null;
    createdAt: string;
    welperDisplayName?: string | null;
    welperRating?: number | null;
    welperVerified?: boolean;
  }>;
}

export interface AdminJobsListResponse {
  data: AdminJobListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function searchAdminJobs(params: {
  page?: number;
  limit?: number;
  customerId?: string;
  categoryId?: string;
  subcategoryId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<AdminJobsListResponse> {
  return apiClient.get<AdminJobsListResponse>("/api/admin/jobs", {
    params: {
      page: params.page,
      limit: params.limit,
      customerId: params.customerId?.trim() || undefined,
      categoryId: params.categoryId?.trim() || undefined,
      subcategoryId: params.subcategoryId?.trim() || undefined,
      status: params.status?.trim() || undefined,
      dateFrom: params.dateFrom?.trim() || undefined,
      dateTo: params.dateTo?.trim() || undefined,
    },
  });
}

export async function getAdminJob(jobId: string): Promise<AdminJobDetail> {
  return apiClient.get<AdminJobDetail>(`/api/admin/jobs/${encodeURIComponent(jobId)}`);
}
