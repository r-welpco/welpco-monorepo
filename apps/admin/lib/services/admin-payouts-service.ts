import { apiClient } from "@/lib/api/client";

export type PayoutBatchStatus = "draft" | "review" | "approved" | "executing" | "completed" | "partial" | "failed";

export type WelperPayoutLedgerStatus = "pending" | "scheduled" | "transferred" | "excluded" | "failed";

export interface PayoutBatchLine {
  ledgerId: string;
  bookingId: string;
  customerId: string;
  paymentReleasedAt: string;
  customerSubtotalCents: number;
  customerTaxCents: number;
  customerTotalCents: number;
  welperGrossCents: number;
  welperRefundCents: number;
  welperNetCents: number;
  platformGrossCents: number;
  stripeFeeCents: number;
  platformNetCents: number;
  status: WelperPayoutLedgerStatus;
  exclusionReason: string | null;
  stripeTransferId: string | null;
}

export interface PayoutWelperRollup {
  welperId: string;
  welperEmail: string | null;
  welperName: string | null;
  stripeConnectAccountId: string | null;
  connectReady: boolean;
  bookingCount: number;
  welperNetCents: number;
  platformGrossCents: number;
  stripeFeeCents: number;
  platformNetCents: number;
  customerCapturedCents: number;
  lines: PayoutBatchLine[];
}

export interface PayoutBatchSummary {
  id: string;
  payoutDate: string;
  status: PayoutBatchStatus;
  bookingCount: number;
  welperCount: number;
  totalWelperNetCents: number;
  totalPlatformGrossCents: number;
  totalStripeFeeCents: number;
  totalCustomerCapturedCents: number;
  totalPlatformNetCents: number;
  approvedBy: string | null;
  approvedAt: string | null;
  executedAt: string | null;
}

export interface PayoutBatchReview extends PayoutBatchSummary {
  executionSummary: Record<string, unknown> | null;
  welpers: PayoutWelperRollup[];
}

export interface PayoutUpcomingPreview {
  payoutDate: string;
  eligiblePendingCount: number;
  eligibleWelperCount: number;
  eligibleWelperNetCents: number;
  existingBatchId: string | null;
  existingBatchStatus: PayoutBatchStatus | null;
  welpers: PayoutWelperRollup[];
}

export interface PaymentRecoveryTask {
  id: string;
  bookingId: string;
  resolutionId: string;
  stripeTransferId: string;
  requiredReversalCents: number;
  recoveredCents: number;
  outstandingCents: number;
  status: string;
  stripeDashboardUrl: string;
  exceptionMessage: string | null;
  createdAt: string;
}

export interface PayoutTaxFailure {
  id: string;
  kind: "transaction" | "refund_reversal";
  bookingId: string;
  refundId: string | null;
  status: string | null;
  error: string | null;
  stripeTaxCalculationId: string | null;
  stripeTaxTransactionId: string | null;
  stripeTaxReversalId: string | null;
  updatedAt: string;
}

export async function getPayoutUpcoming(): Promise<PayoutUpcomingPreview> {
  return apiClient.get<PayoutUpcomingPreview>("/api/admin/payouts/upcoming");
}

export async function listPayoutBatches(params?: {
  payoutDate?: string;
  limit?: number;
}): Promise<{ data: PayoutBatchSummary[] }> {
  return apiClient.get<{ data: PayoutBatchSummary[] }>("/api/admin/payouts/batches", {
    params: {
      payoutDate: params?.payoutDate?.trim() || undefined,
      limit: params?.limit,
    },
  });
}

export async function listPaymentRecoveries(): Promise<{ data: PaymentRecoveryTask[] }> {
  return apiClient.get<{ data: PaymentRecoveryTask[] }>("/api/admin/payouts/recoveries");
}

export async function refreshPaymentRecovery(
  stripeTransferId: string,
): Promise<{ data: PaymentRecoveryTask[] }> {
  return apiClient.post<{ data: PaymentRecoveryTask[] }>(
    `/api/admin/payouts/recoveries/${encodeURIComponent(stripeTransferId)}/refresh`,
  );
}

export async function listPayoutTaxFailures(params?: {
  limit?: number;
}): Promise<{ data: PayoutTaxFailure[] }> {
  return apiClient.get<{ data: PayoutTaxFailure[] }>("/api/admin/payouts/tax-failures", {
    params: {
      limit: params?.limit,
    },
  });
}

export async function getPayoutBatch(id: string): Promise<PayoutBatchReview> {
  return apiClient.get<PayoutBatchReview>(`/api/admin/payouts/batches/${encodeURIComponent(id)}`);
}

export async function buildPayoutBatch(payoutDate?: string): Promise<PayoutBatchReview> {
  return apiClient.post<PayoutBatchReview>("/api/admin/payouts/batches/build", {
    payoutDate: payoutDate?.trim() || undefined,
  });
}

export async function approvePayoutBatch(id: string): Promise<PayoutBatchReview> {
  return apiClient.post<PayoutBatchReview>(`/api/admin/payouts/batches/${encodeURIComponent(id)}/approve`);
}

export async function refreshPendingPayoutFees(): Promise<{
  scanned: number;
  recovered: number;
  stillPending: number;
}> {
  return apiClient.post("/api/admin/payouts/refresh-pending-fees");
}

export async function retryPayoutTax(): Promise<{
  scanned: number;
  recovered: number;
  reversalScanned: number;
  reversalRecovered: number;
}> {
  return apiClient.post("/api/admin/payouts/retry-tax");
}
