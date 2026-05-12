import { apiClient } from "@/lib/api/client";

export interface AdminPaymentRow {
  bookingId: string;
  customerId: string;
  welperId: string;
  amountCents: number;
  currency: string;
  status: string;
  stripePaymentIntentId: string;
  captureEligibleAt: string | null;
  capturedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPaymentsListResponse {
  data: AdminPaymentRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listAdminPayments(params?: {
  page?: number;
  limit?: number;
  welperId?: string;
  customerId?: string;
  status?: string;
  capturedDateFrom?: string;
  capturedDateTo?: string;
}): Promise<AdminPaymentsListResponse> {
  return apiClient.get<AdminPaymentsListResponse>("/api/admin/payments", {
    params: {
      page: params?.page,
      limit: params?.limit,
      welperId: params?.welperId?.trim() || undefined,
      customerId: params?.customerId?.trim() || undefined,
      status: params?.status?.trim() || undefined,
      capturedDateFrom: params?.capturedDateFrom?.trim() || undefined,
      capturedDateTo: params?.capturedDateTo?.trim() || undefined,
    },
  });
}
