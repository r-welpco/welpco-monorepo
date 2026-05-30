import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  getBookingDisputeOrNull,
  createDispute,
  createDisputeResolution,
  getDisputes,
  getDisputeById,
  getSupportTickets,
  createSupportTicket,
  withdrawDispute,
  type CreateDisputeParams,
  type CreateDisputeResolutionParams,
  type DisputesListParams,
  type CreateSupportTicketParams,
  type DisputeItem,
} from "@/lib/services/dispute-service";

function useIsAuthenticated(): boolean {
  const { status } = useSession();
  return status === "authenticated";
}

// ─── Booking dispute ─────────────────────────────────────────────────────

/** Current user's dispute for this booking, or null if none. */
export function useBookingDispute(
  bookingId: string | undefined,
  options?: { enabled?: boolean },
) {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ["bookingDispute", bookingId],
    queryFn: () => getBookingDisputeOrNull(bookingId!),
    enabled: !!bookingId && isAuthenticated && (options?.enabled ?? true),
    staleTime: 60 * 1000,
  });
}

/** Mutation to file a dispute for a booking. Invalidates booking and disputes. */
export function useCreateDispute(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: CreateDisputeParams) =>
      createDispute(bookingId, params),
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: ["bookingDispute", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
    },
  });
}

// ─── Disputes list ───────────────────────────────────────────────────────

export function useDisputes(params: DisputesListParams = {}) {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ["disputes", params],
    queryFn: () => getDisputes(params),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

export function useDispute(disputeId: string | undefined) {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ["dispute", disputeId],
    queryFn: () => getDisputeById(disputeId!),
    enabled: !!disputeId && isAuthenticated,
    staleTime: 60 * 1000,
  });
}

/**
 * Wave 2 (BFF): the original filer withdraws their own dispute. Updates the
 * dispute cache to the new `withdrawn` status, refreshes the booking row
 * (which the BFF restores to `completed` if it was sitting in `disputed`), and
 * invalidates list queries so the disputes index reflects the new status.
 */
export function useWithdrawDispute(disputeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => withdrawDispute(disputeId),
    onSuccess: (updatedDispute) => {
      queryClient.setQueryData<DisputeItem>(["dispute", disputeId], updatedDispute);
      queryClient.invalidateQueries({
        queryKey: ["bookingDispute", updatedDispute.bookingId],
      });
      queryClient.invalidateQueries({
        queryKey: ["booking", updatedDispute.bookingId],
      });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
    },
  });
}

/** Admin/support: resolve dispute and sync booking status. */
export function useCreateDisputeResolution(disputeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: CreateDisputeResolutionParams) =>
      createDisputeResolution(disputeId, params),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["dispute", disputeId] });
      queryClient.invalidateQueries({ queryKey: ["bookingDispute", data.bookingId] });
      queryClient.invalidateQueries({ queryKey: ["booking", data.bookingId] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
    },
  });
}

// ─── Support tickets ─────────────────────────────────────────────────────

export function useSupportTickets(params: DisputesListParams = {}) {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ["supportTickets", params],
    queryFn: () => getSupportTickets(params),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

export function useCreateSupportTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: CreateSupportTicketParams) =>
      createSupportTicket(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supportTickets"] });
    },
  });
}
