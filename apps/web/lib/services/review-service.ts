import { apiClient, ApiClientError } from "@/lib/api/client";

// ─── Types ──────────────────────────────────────────────────────────────

export type ReviewerType = "customer" | "welper";

export interface ReviewItem {
  id: string;
  bookingId: string;
  reviewerId: string;
  revieweeId: string;
  reviewerType: ReviewerType;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

export interface CreateReviewParams {
  rating: number;
  comment?: string;
}

export interface WelperReviewsResponse {
  data: ReviewItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WelperReviewsParams {
  page?: number;
  limit?: number;
}

// ─── API Functions ──────────────────────────────────────────────────────

/** Submit a review for a completed booking (current user is reviewer). */
export async function createBookingReview(
  bookingId: string,
  params: CreateReviewParams,
): Promise<ReviewItem> {
  return apiClient.post<ReviewItem>(`/api/bookings/${bookingId}/review`, params);
}

/** Update the current user's review for this booking. */
export async function updateBookingReview(
  bookingId: string,
  params: CreateReviewParams,
): Promise<ReviewItem> {
  return apiClient.patch<ReviewItem>(`/api/bookings/${bookingId}/review`, params);
}

/** Get the current user's review for this booking. Throws if no review (404). */
export async function getBookingReview(bookingId: string): Promise<ReviewItem> {
  return apiClient.get<ReviewItem>(`/api/bookings/${bookingId}/review`);
}

/** Get the current user's review for this booking, or null if none (catch 404). */
export async function getBookingReviewOrNull(
  bookingId: string,
): Promise<ReviewItem | null> {
  try {
    return await apiClient.get<ReviewItem>(`/api/bookings/${bookingId}/review`);
  } catch (e) {
    if (e instanceof ApiClientError && e.statusCode === 404) return null;
    throw e;
  }
}

/** List reviews for a welper (paginated). */
export async function getWelperReviews(
  welperId: string,
  params: WelperReviewsParams = {},
): Promise<WelperReviewsResponse> {
  const searchParams = new URLSearchParams();
  if (params.page != null) searchParams.set("page", String(params.page));
  if (params.limit != null) searchParams.set("limit", String(params.limit));
  const query = searchParams.toString();
  const url = `/api/welpers/${encodeURIComponent(welperId)}/reviews${query ? `?${query}` : ""}`;
  return apiClient.get<WelperReviewsResponse>(url);
}
