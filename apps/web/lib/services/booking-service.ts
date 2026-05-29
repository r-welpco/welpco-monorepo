import { apiClient } from "@/lib/api/client";

// ─── Types ──────────────────────────────────────────────────────────────

export type BookingStatus =
  | "pending"
  | "accepted"
  | "in_progress"
  | "completed"
  | "payment_released"
  | "declined"
  | "cancelled"
  | "disputed"
  | "no_show";

/**
 * Wave 2 (BFF): a single S3-backed evidence file attached to a service receipt.
 * `signedUrl` is presigned at response time (default 15 min TTL) and is `null`
 * when the BFF presigner is misconfigured or signing failed transiently.
 */
export interface ReceiptEvidenceFile {
  id?: string;
  /** Raw S3 key — do not surface to end users; render `signedUrl` instead. */
  key: string;
  signedUrl: string | null;
}

export interface ServiceReceipt {
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
  notes: string | null;
  confirmedAt: string;
  sentToCustomerAt: string | null;
  /**
   * Wave 2 (BFF): always an array (empty when the welper hasn't attached any
   * files). Each item carries a short-lived presigned `signedUrl` for download.
   */
  evidenceFiles: ReceiptEvidenceFile[];
}

export interface ServiceReceiptDraft {
  bookingId: string;
  hourlyRate: number;
  suggestedBillingCheckInAt: string;
  suggestedBillingCheckOutAt: string;
  computedTotalCents: number;
  currency: string;
  authorizedHoldCents: number | null;
  confirmedReceipt: ServiceReceipt | null;
}

export interface ConfirmServiceReceiptResponse {
  booking: BookingItem;
  receipt: ServiceReceipt;
  deltaPayment?: {
    clientSecret: string | null;
    paymentIntentId: string;
    requiresAction: boolean;
  };
}

export interface BookingItem {
  id: string;
  customerId: string;
  welperId: string;
  serviceOfferingId: string;
  status: BookingStatus;
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

  availableActions?: string[];

  paymentPhase?: "none" | "pending" | "requires_action" | "authorized" | "captured" | "canceled" | "failed";
  captureEligibleAt?: string | null;
  paymentClientSecret?: string | null;
  serviceReceipt?: ServiceReceipt | null;
}

export interface BookingListResponse {
  data: BookingItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BookingListParams {
  status?: BookingStatus;
  role?: "customer" | "welper";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface CreateBookingParams {
  welperId: string;
  offeringId: string;
  answers: Record<string, string | number | boolean>;
  scheduledDate?: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  durationMinutes?: number;
  address?: Record<string, string>;
  notes?: string;
  /** Timezone offset in minutes (e.g. -300 for EST) for cancellation policy */
  timezoneOffsetMinutes?: number;
}

// ─── Service Question Types ──────────────────────────────────────────────

export type ServiceQuestionType =
  | "TEXT"
  | "NUMBER"
  | "DATE"
  | "TIME"
  | "CHOICE"
  | "BOOLEAN"
  | "ENTITY_REFERENCE";

export interface ServiceQuestionOption {
  value: string;
  label: string;
}

export interface ServiceQuestionValidation {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
}

export interface ServiceQuestion {
  id: string;
  serviceCategoryId: string;
  questionId: string;
  displayOrder: number;
  isRequired: boolean;
  conditionalLogic?: {
    showIf?: { questionId: string; value: string | number | boolean };
  };
  question: {
    id: string;
    type: ServiceQuestionType;
    label: string;
    placeholder?: string;
    helpText?: string;
    validationRules?: ServiceQuestionValidation;
    options?: ServiceQuestionOption[];
    entityType?: "CHILD" | "PERSON" | "PET";
    displayOrder: number;
  };
}

// ─── API Functions ──────────────────────────────────────────────────────

/** Create a booking request. */
export async function createBooking(params: CreateBookingParams): Promise<BookingItem> {
  return apiClient.post<BookingItem>("/api/bookings", params);
}

/** List bookings for the current user with optional filters. */
export async function getBookings(params: BookingListParams = {}): Promise<BookingListResponse> {
  return apiClient.get<BookingListResponse>("/api/bookings", { params: params as Record<string, string | number | boolean | undefined> });
}

/** Get a single booking by ID. */
export async function getBookingById(bookingId: string): Promise<BookingItem> {
  return apiClient.get<BookingItem>(`/api/bookings/${bookingId}`);
}

/** Welper accepts a booking. */
export async function acceptBooking(bookingId: string): Promise<BookingItem> {
  return apiClient.patch<BookingItem>(`/api/bookings/${bookingId}/accept`);
}

/** Welper declines a booking. */
export async function declineBooking(bookingId: string, reason?: string): Promise<BookingItem> {
  return apiClient.patch<BookingItem>(`/api/bookings/${bookingId}/decline`, { reason });
}

/** Cancel a booking (customer or welper). */
export async function cancelBooking(
  bookingId: string,
  reason?: string,
  timezoneOffsetMinutes?: number,
): Promise<BookingItem> {
  return apiClient.patch<BookingItem>(`/api/bookings/${bookingId}/cancel`, {
    reason,
    timezoneOffsetMinutes,
  });
}

/** Welper checks in (starts service). */
export async function checkInBooking(bookingId: string): Promise<BookingItem> {
  return apiClient.patch<BookingItem>(`/api/bookings/${bookingId}/check-in`);
}

/** Welper checks out (completes service). */
export async function checkOutBooking(bookingId: string): Promise<BookingItem> {
  return apiClient.patch<BookingItem>(`/api/bookings/${bookingId}/check-out`);
}

/** Draft or confirmed service receipt (welper in progress, or either party after confirm). */
export async function getServiceReceiptDraft(bookingId: string): Promise<ServiceReceiptDraft> {
  return apiClient.get<ServiceReceiptDraft>(`/api/bookings/${bookingId}/service-receipt`);
}

export interface SubmitServiceReceiptParams {
  billingCheckInAt: string;
  billingCheckOutAt: string;
  notes?: string;
}

/** Welper confirms receipt and triggers customer charge. */
export async function submitServiceReceipt(
  bookingId: string,
  params: SubmitServiceReceiptParams,
): Promise<ConfirmServiceReceiptResponse> {
  return apiClient.post<ConfirmServiceReceiptResponse>(`/api/bookings/${bookingId}/service-receipt`, params);
}

/** Fetch service questions for a given service category (public endpoint). */
export async function getServiceQuestions(
  serviceCategoryId: string,
): Promise<ServiceQuestion[]> {
  return apiClient.get<ServiceQuestion[]>(
    `/api/service-questions/service/${encodeURIComponent(serviceCategoryId)}`,
    { skipAuth: true },
  );
}
