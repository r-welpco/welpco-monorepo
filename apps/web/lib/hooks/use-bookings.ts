import { useQuery, useMutation, useQueryClient, keepPreviousData, useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  getBookings,
  getBookingById,
  createBooking,
  acceptBooking,
  declineBooking,
  cancelBooking,
  checkInBooking,
  checkOutBooking,
  getServiceReceiptDraft,
  submitServiceReceipt,
  getServiceQuestions,
  type BookingListParams,
  type CreateBookingParams,
  type SubmitServiceReceiptParams,
  type ServiceQuestion,
} from "@/lib/services/booking-service";

function useIsAuthenticated(): boolean {
  const { status } = useSession();
  return status === "authenticated";
}

// ─── Queries ────────────────────────────────────────────────────────────

export function useBookings(
  params: BookingListParams = {},
  options?: { enabled?: boolean },
) {
  const isAuthenticated = useIsAuthenticated();
  const extraEnabled = options?.enabled !== false;
  return useQuery({
    queryKey: ["bookings", params],
    queryFn: () => getBookings(params),
    enabled: isAuthenticated && extraEnabled,
    staleTime: 60 * 1000,
  });
}

export function useBookingById(bookingId: string | undefined) {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => getBookingById(bookingId!),
    enabled: !!bookingId && isAuthenticated,
    staleTime: 30 * 1000,
  });
}

// ─── Mutations ──────────────────────────────────────────────────────────

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: CreateBookingParams) => createBooking(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useAcceptBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => acceptBooking(bookingId),
    onSuccess: (data) => {
      queryClient.setQueryData(["booking", data.id], data);
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useDeclineBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason?: string }) =>
      declineBooking(bookingId, reason),
    onSuccess: (data) => {
      queryClient.setQueryData(["booking", data.id], data);
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      reason,
      timezoneOffsetMinutes,
    }: {
      bookingId: string;
      reason?: string;
      timezoneOffsetMinutes?: number;
    }) => cancelBooking(bookingId, reason, timezoneOffsetMinutes),
    onSuccess: (data) => {
      queryClient.setQueryData(["booking", data.id], data);
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useCheckInBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => checkInBooking(bookingId),
    onSuccess: (data) => {
      queryClient.setQueryData(["booking", data.id], data);
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useCheckOutBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => checkOutBooking(bookingId),
    onSuccess: (data) => {
      queryClient.setQueryData(["booking", data.id], data);
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useServiceReceiptDraft(bookingId: string | undefined, options?: { enabled?: boolean }) {
  const isAuthenticated = useIsAuthenticated();
  const enabled =
    !!bookingId && isAuthenticated && (options?.enabled !== false);
  return useQuery({
    queryKey: ["booking", bookingId, "service-receipt-draft"],
    queryFn: () => getServiceReceiptDraft(bookingId!),
    enabled,
    staleTime: 15 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useSubmitServiceReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      params,
    }: {
      bookingId: string;
      params: SubmitServiceReceiptParams;
    }) => submitServiceReceipt(bookingId, params),
    onSuccess: (data) => {
      queryClient.setQueryData(["booking", data.booking.id], data.booking);
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking", data.booking.id, "service-receipt-draft"] });
    },
  });
}

// ─── Service Questions ─────────────────────────────────────────────────

export function useServiceQuestions(serviceCategoryId: string | undefined) {
  return useQuery({
    queryKey: ["serviceQuestions", serviceCategoryId],
    queryFn: () => getServiceQuestions(serviceCategoryId!),
    enabled: !!serviceCategoryId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

/** Load and merge service questions across parent + subcategory IDs on an offering. */
export function useServiceQuestionsForCategories(categoryIds: string[]) {
  const uniqueIds = useMemo(
    () => [...new Set(categoryIds.filter((id): id is string => !!id?.trim()))],
    [categoryIds],
  );

  const queries = useQueries({
    queries: uniqueIds.map((categoryId) => ({
      queryKey: ["serviceQuestions", categoryId],
      queryFn: () => getServiceQuestions(categoryId),
      enabled: true,
      staleTime: 5 * 60 * 1000,
      retry: 2,
    })),
  });

  const data = useMemo(() => {
    const merged: ServiceQuestion[] = [];
    const seen = new Set<string>();
    for (const query of queries) {
      for (const sq of query.data ?? []) {
        if (seen.has(sq.question.id)) continue;
        seen.add(sq.question.id);
        merged.push(sq);
      }
    }
    return merged;
  }, [queries]);

  return {
    data,
    isLoading: uniqueIds.length > 0 && queries.some((query) => query.isLoading),
  };
}
