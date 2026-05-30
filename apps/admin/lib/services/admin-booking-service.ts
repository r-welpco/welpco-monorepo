import { apiClient } from "@/lib/api/client";

export interface ServiceReceiptSummary {
  id: string;
  bookingId: string;
  billingCheckInAt: string;
  billingCheckOutAt: string;
  hourlyRate: number;
  subtotalCents: number;
  taxCents: number;
  taxRateBps: number;
  totalCents: number;
  currency: string;
  notes?: string | null;
  confirmedAt: string;
  sentToCustomerAt?: string | null;
  evidenceFiles?: Array<{ id?: string; key: string; signedUrl?: string | null }>;
}

export interface AdminBookingDetail {
  id: string;
  customerId: string;
  welperId: string;
  serviceOfferingId: string;
  status: string;
  answers: Record<string, string | number | boolean>;
  scheduledDate: string | null;
  scheduledStartTime: string | null;
  scheduledEndTime: string | null;
  durationMinutes: number | null;
  hourlyRate: number | null;
  totalPrice: number | null;
  address: Record<string, string> | null;
  notes: string | null;
  cancellationReason: string | null;
  declineReason: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
  cancelledAt: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  paymentPhase?: string | null;
  captureEligibleAt?: string | null;
  disputeReportDeadlineAt?: string | null;
  serviceReceipt?: ServiceReceiptSummary | null;
  customerFirstName?: string | null;
  customerPhotoUrl?: string | null;
}

export async function getAdminBooking(bookingId: string): Promise<AdminBookingDetail> {
  return apiClient.get<AdminBookingDetail>(
    `/api/admin/bookings/${encodeURIComponent(bookingId)}`,
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
  reason: string,
): Promise<AdminBookingDetail> {
  return apiClient.post<AdminBookingDetail>(
    `/api/admin/bookings/${encodeURIComponent(bookingId)}/cancel`,
    { reason },
  );
}
