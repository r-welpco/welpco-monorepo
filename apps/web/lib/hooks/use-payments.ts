import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { invalidateSetupChecklists } from "@/lib/hooks/use-signup";
import {
  createSetupIntent,
  listPaymentMethods,
  setDefaultPaymentMethod,
  detachPaymentMethod,
  createBookingPaymentIntent,
} from "@/lib/services/payment-service";

function useIsAuthenticated(): boolean {
  const { status } = useSession();
  return status === "authenticated";
}

export function usePaymentMethods(enabled: boolean) {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ["paymentMethods"],
    queryFn: () => listPaymentMethods(),
    enabled: enabled && isAuthenticated,
    staleTime: 60 * 1000,
  });
}

export function useCreateSetupIntent() {
  return useMutation({
    mutationFn: () => createSetupIntent(),
  });
}

export function useSetDefaultPaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentMethodId: string) => setDefaultPaymentMethod(paymentMethodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
      queryClient.invalidateQueries({ queryKey: ["customerProfile"] });
      void invalidateSetupChecklists(queryClient);
    },
  });
}

export function useDetachPaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentMethodId: string) => detachPaymentMethod(paymentMethodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
      queryClient.invalidateQueries({ queryKey: ["customerProfile"] });
      void invalidateSetupChecklists(queryClient);
    },
  });
}

export function useCreateBookingPaymentIntent(bookingId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!bookingId) throw new Error("Missing booking");
      return createBookingPaymentIntent(bookingId);
    },
    onSuccess: () => {
      if (bookingId) {
        queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
      }
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}
