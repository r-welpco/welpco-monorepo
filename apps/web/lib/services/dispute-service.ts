import { apiClient, ApiClientError } from "@/lib/api/client";

// ─── Types ──────────────────────────────────────────────────────────────

/** Wave 2 (BFF): added `withdrawn` for participant-initiated withdrawal. */
export type DisputeStatus =
  | "open"
  | "in-review"
  | "resolved"
  | "closed"
  | "escalated"
  | "withdrawn";

export type DisputeCategory =
  | "no_show"
  | "quality"
  | "overcharge"
  | "safety"
  | "other";

export interface DisputeItem {
  id: string;
  bookingId: string;
  filerId: string;
  filerType: "customer" | "welper";
  category: string;
  subject: string;
  description?: string | null;
  status: DisputeStatus;
  /**
   * Wave 2 (BFF): each `file`-typed evidence item is enriched with a
   * short-lived `signedUrl` (default 15 min TTL) presigned at response time.
   * `signedUrl` is `null` when the BFF's S3 presigner is not configured (local
   * dev / no AWS creds) or when signing failed transiently — clients should
   * treat null as "metadata only, no download URL right now".
   */
  evidence?: Array<{
    type: string;
    key?: string;
    id?: string;
    signedUrl?: string | null;
  }> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDisputeParams {
  subject: string;
  category: DisputeCategory;
  description?: string;
  evidence?: Array<{ type: "file" | "message"; key?: string; id?: string }>;
}

export interface DisputesListResponse {
  data: DisputeItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DisputesListParams {
  page?: number;
  limit?: number;
}

export interface SupportTicketItem {
  id: string;
  userId: string;
  subject: string;
  category: string;
  description?: string | null;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupportTicketParams {
  subject: string;
  category?: "account" | "billing" | "other";
  description?: string;
  priority?: "low" | "medium" | "high";
}

export interface SupportTicketsListResponse {
  data: SupportTicketItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Platform Admin only: resolve a dispute (BFF `POST /api/disputes/:id/resolution`). */
export type DisputeResolutionType =
  | "refund"
  | "partial_refund"
  | "warning"
  | "no_action"
  | "closed";

export interface CreateDisputeResolutionParams {
  resolutionType: DisputeResolutionType;
  notes?: string;
  refundAmount?: number;
  /** Default completed; cancelled voids the booking. */
  bookingOutcome?: "completed" | "cancelled";
}

export type StripeRefundOutcome = {
  status: "succeeded" | "failed" | "skipped" | "not_applicable";
  refundsCreated?: number;
  message?: string;
};

export interface CreateDisputeResolutionResponse {
  id: string;
  disputeId: string;
  resolutionType: string;
  notes: string | null;
  refundAmount: number | null;
  resolvedAt: string;
  bookingId: string;
  bookingStatus: "completed" | "cancelled";
  stripeRefund: StripeRefundOutcome;
}

// ─── API Functions ──────────────────────────────────────────────────────

/** File a dispute for a booking (transitions booking to disputed). */
export async function createDispute(
  bookingId: string,
  params: CreateDisputeParams,
): Promise<DisputeItem> {
  return apiClient.post<DisputeItem>(
    `/api/bookings/${bookingId}/disputes`,
    params,
  );
}

type BookingDisputeResponse = { dispute: DisputeItem | null };

function unwrapBookingDispute(
  body: BookingDisputeResponse | DisputeItem | null,
): DisputeItem | null {
  if (body && typeof body === "object" && "dispute" in body) {
    return body.dispute ?? null;
  }
  return body ?? null;
}

/** Get dispute for this booking. Throws if none filed yet. */
export async function getBookingDispute(
  bookingId: string,
): Promise<DisputeItem> {
  const dispute = await getBookingDisputeOrNull(bookingId);
  if (!dispute) {
    throw new ApiClientError("No dispute found for this booking", 404);
  }
  return dispute;
}

/** Get dispute for this booking, or null if none. */
export async function getBookingDisputeOrNull(
  bookingId: string,
): Promise<DisputeItem | null> {
  const body = await apiClient.get<BookingDisputeResponse | DisputeItem | null>(
    `/api/bookings/${bookingId}/dispute`,
  );
  return unwrapBookingDispute(body);
}

/** List disputes for current user (paginated). */
export async function getDisputes(
  params: DisputesListParams = {},
): Promise<DisputesListResponse> {
  const searchParams = new URLSearchParams();
  if (params.page != null) searchParams.set("page", String(params.page));
  if (params.limit != null) searchParams.set("limit", String(params.limit));
  const query = searchParams.toString();
  const url = `/api/disputes${query ? `?${query}` : ""}`;
  return apiClient.get<DisputesListResponse>(url);
}

/** Get dispute by ID (participant only). */
export async function getDisputeById(disputeId: string): Promise<DisputeItem> {
  return apiClient.get<DisputeItem>(`/api/disputes/${disputeId}`);
}

/**
 * Wave 2 (BFF): the original filer withdraws their own dispute. Only callable
 * by the `filerId`; only while the dispute is `open` or `in-review`. The
 * dispute row is preserved at status `withdrawn` (soft-status change). The
 * associated booking is restored to `completed` if it was sitting in
 * `disputed`. Throws 403/400/404 per the BFF contract.
 */
export async function withdrawDispute(disputeId: string): Promise<DisputeItem> {
  return apiClient.delete<DisputeItem>(
    `/api/disputes/${encodeURIComponent(disputeId)}`,
  );
}

/** Create resolution for a dispute; updates booking from disputed to completed or cancelled. */
export async function createDisputeResolution(
  disputeId: string,
  params: CreateDisputeResolutionParams,
): Promise<CreateDisputeResolutionResponse> {
  return apiClient.post<CreateDisputeResolutionResponse>(
    `/api/disputes/${encodeURIComponent(disputeId)}/resolution`,
    params,
  );
}

/** Create a support ticket. */
export async function createSupportTicket(
  params: CreateSupportTicketParams,
): Promise<SupportTicketItem> {
  return apiClient.post<SupportTicketItem>("/api/support-tickets", params);
}

/** List current user's support tickets (paginated). */
export async function getSupportTickets(
  params: DisputesListParams = {},
): Promise<SupportTicketsListResponse> {
  const searchParams = new URLSearchParams();
  if (params.page != null) searchParams.set("page", String(params.page));
  if (params.limit != null) searchParams.set("limit", String(params.limit));
  const query = searchParams.toString();
  const url = `/api/support-tickets${query ? `?${query}` : ""}`;
  return apiClient.get<SupportTicketsListResponse>(url);
}
