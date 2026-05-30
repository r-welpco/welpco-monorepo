import { apiClient } from "@/lib/api/client";

export type DisputeStatusApi =
  | "open"
  | "in-review"
  | "escalated"
  | "resolved"
  | "closed"
  | "withdrawn";

export interface DisputeParticipantSummary {
  userId: string;
  role: "customer" | "welper";
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneDisplay?: string;
}

export interface DisputeResolutionSummary {
  id: string;
  resolutionType: string;
  notes?: string | null;
  refundAmount?: number | null;
  resolvedAt: string;
  resolvedById?: string | null;
}

export interface CapturedPaymentHint {
  totalCents: number;
  currency: string;
}

export interface DisputeEvidenceItem {
  type: string;
  key?: string;
  id?: string;
  signedUrl?: string | null;
  messageId?: string;
}

export interface DisputeItem {
  id: string;
  bookingId: string;
  filerId: string;
  filerType: string;
  category: string;
  subject: string;
  description?: string;
  status: DisputeStatusApi;
  evidence?: DisputeEvidenceItem[] | null;
  createdAt: string;
  updatedAt: string;
  /** Admin API: current booking status */
  bookingStatus?: string;
  /** Admin API: booking cancelled while dispute still open */
  bookingCancelledWithOpenDispute?: boolean;
  customer?: DisputeParticipantSummary;
  welper?: DisputeParticipantSummary;
  resolution?: DisputeResolutionSummary;
  capturedPayment?: CapturedPaymentHint;
}

export interface DisputesListResponse {
  data: DisputeItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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

export async function listDisputes(
  page = 1,
  limit = 50,
  status?: string
): Promise<DisputesListResponse> {
  return apiClient.get<DisputesListResponse>("/api/disputes", {
    params: { page, limit, status: status?.trim() || undefined },
  });
}

export async function getDisputeById(disputeId: string): Promise<DisputeItem> {
  return apiClient.get<DisputeItem>(`/api/disputes/${encodeURIComponent(disputeId)}`);
}

export async function createDisputeResolution(
  disputeId: string,
  params: CreateDisputeResolutionParams
): Promise<CreateDisputeResolutionResponse> {
  return apiClient.post<CreateDisputeResolutionResponse>(
    `/api/disputes/${encodeURIComponent(disputeId)}/resolution`,
    params
  );
}
