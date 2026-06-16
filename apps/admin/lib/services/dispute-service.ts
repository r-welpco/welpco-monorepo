import { apiClient } from "@/lib/api/client";

export type DisputeStatusApi =
  | "open"
  | "in-review"
  | "escalated"
  | "awaiting-refund"
  | "awaiting-recovery"
  | "resolved"
  | "closed"
  | "withdrawn";

export interface RefundAllocation {
  paymentIntentId: string;
  chargeId: string;
  capturedCents: number;
  refundedCents: number;
  refundableCents: number;
  recommendedRefundCents: number;
  stripeDashboardUrl: string;
}

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
  refundStatus?: "pending" | "succeeded" | "failed" | "partial" | "skipped" | "not_applicable" | null;
  refundMessage?: string | null;
  refundsCreated?: number | null;
  refundAttemptedAt?: string | null;
  workflowStatus?: string;
  refundBaselineCents?: number | null;
  refundTargetCents?: number | null;
  refundConfirmedCents?: number;
  pendingBookingOutcome?: string | null;
  refundException?: string | null;
  recommendedRefundAllocation?: RefundAllocation[] | null;
  stripeLastSyncedAt?: string | null;
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
  recoveryTask?: {
    id: string;
    stripeTransferId: string;
    requiredReversalCents: number;
    recoveredCents: number;
    outstandingCents: number;
    status: string;
    stripeDashboardUrl: string;
    exceptionMessage: string | null;
    createdAt: string;
  } | null;
}

export interface DisputesListResponse {
  data: DisputeItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type DisputeResolutionType = "refund" | "partial_refund" | "warning" | "no_action" | "closed";

export interface CreateDisputeResolutionParams {
  resolutionType: DisputeResolutionType;
  notes?: string;
  refundAmount?: number;
  bookingOutcome?: "completed" | "cancelled";
}

export type StripeRefundOutcome = {
  status: "pending" | "succeeded" | "failed" | "partial" | "skipped" | "not_applicable";
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
  bookingStatus: "completed" | "cancelled" | "disputed";
  stripeRefund: StripeRefundOutcome;
  workflowStatus?: string;
  stripeDashboardActions?: RefundAllocation[];
}

export async function listDisputes(page = 1, limit = 50, status?: string): Promise<DisputesListResponse> {
  return apiClient.get<DisputesListResponse>("/api/disputes", {
    params: { page, limit, status: status?.trim() || undefined },
  });
}

export async function getDisputeById(disputeId: string): Promise<DisputeItem> {
  return apiClient.get<DisputeItem>(`/api/disputes/${encodeURIComponent(disputeId)}`);
}

export async function createDisputeResolution(
  disputeId: string,
  params: CreateDisputeResolutionParams,
): Promise<CreateDisputeResolutionResponse> {
  return apiClient.post<CreateDisputeResolutionResponse>(
    `/api/disputes/${encodeURIComponent(disputeId)}/resolution`,
    params,
  );
}

export async function reconcileDisputeRefund(disputeId: string): Promise<DisputeResolutionSummary> {
  return apiClient.post<DisputeResolutionSummary>(
    `/api/disputes/${encodeURIComponent(disputeId)}/resolution/refund/reconcile`,
  );
}
