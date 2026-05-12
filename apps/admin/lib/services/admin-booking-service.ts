import { apiClient } from "@/lib/api/client";

/** Admin booking payload mirrors BFF BookingResponseDto (subset used in UI). */
export type AdminBookingDetail = Record<string, unknown>;

export async function getAdminBooking(bookingId: string): Promise<AdminBookingDetail> {
  return apiClient.get<AdminBookingDetail>(
    `/api/admin/bookings/${encodeURIComponent(bookingId)}`
  );
}

export interface AdminBookingsListResponse {
  data: AdminBookingDetail[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function searchAdminBookings(params: {
  page?: number;
  limit?: number;
  customerId?: string;
  welperId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<AdminBookingsListResponse> {
  return apiClient.get<AdminBookingsListResponse>("/api/admin/bookings", {
    params: {
      page: params.page,
      limit: params.limit,
      customerId: params.customerId?.trim() || undefined,
      welperId: params.welperId?.trim() || undefined,
      status: params.status?.trim() || undefined,
      dateFrom: params.dateFrom?.trim() || undefined,
      dateTo: params.dateTo?.trim() || undefined,
    },
  });
}

export async function adminCancelBooking(
  bookingId: string,
  reason: string
): Promise<AdminBookingDetail> {
  return apiClient.post<AdminBookingDetail>(
    `/api/admin/bookings/${encodeURIComponent(bookingId)}/cancel`,
    { reason }
  );
}
