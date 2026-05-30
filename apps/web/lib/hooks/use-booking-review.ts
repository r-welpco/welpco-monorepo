import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  getBookingReviewOrNull,
  createBookingReview,
  updateBookingReview,
  getWelperReviews,
  type CreateReviewParams,
  type WelperReviewsParams,
} from "@/lib/services/review-service";

function useIsAuthenticated(): boolean {
  const { status } = useSession();
  return status === "authenticated";
}

// ─── Booking review (current user's review for a booking) ─────────────────

/** Current user's review for this booking, or null if not yet submitted. */
export function useBookingReview(
  bookingId: string | undefined,
  options?: { enabled?: boolean },
) {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ["bookingReview", bookingId],
    queryFn: () => getBookingReviewOrNull(bookingId!),
    enabled: !!bookingId && isAuthenticated && (options?.enabled ?? true),
    staleTime: 60 * 1000,
  });
}

/** Mutation to submit a review for a booking. Invalidates booking and review queries. */
export function useCreateBookingReview(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: CreateReviewParams) =>
      createBookingReview(bookingId, params),
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: ["bookingReview", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["welperReviews"] });
    },
  });
}

/** Mutation to update the current user's review. Invalidates the same queries as create. */
export function useUpdateBookingReview(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: CreateReviewParams) =>
      updateBookingReview(bookingId, params),
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: ["bookingReview", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["welperReviews"] });
    },
  });
}

// ─── Welper reviews (list for profile/search) ─────────────────────────────

export function useWelperReviews(
  welperId: string | undefined,
  params: WelperReviewsParams = {},
) {
  return useQuery({
    queryKey: ["welperReviews", welperId, params],
    queryFn: () => getWelperReviews(welperId!, params),
    enabled: !!welperId,
    staleTime: 2 * 60 * 1000,
  });
}
