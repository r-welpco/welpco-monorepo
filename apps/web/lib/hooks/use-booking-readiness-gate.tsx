"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { usePaymentMethods } from "@/lib/hooks/use-payments";
import { useAuthStore } from "@/stores/authStore";
import { useCustomerProfile } from "@/lib/hooks/use-profile";
import {
  useAddPaymentMethodDialogLabels,
  useBookingReadinessLabels,
} from "@/lib/i18n/use-dashboard-labels";
import { AddPaymentMethodDialog } from "@/components/features/payments/add-payment-method-shared";
import { CustomerAddressDialog } from "@/components/features/booking/customer-address-dialog";
import {
  firstBookingReadinessGap,
  getCustomerBookingGaps,
  type BookingReadinessGap,
} from "@/lib/booking/customer-booking-readiness";
import { invalidateSetupChecklists } from "@/lib/hooks/use-signup";
import type { CustomerProfile } from "@/types";

export interface BookingReadinessGateOptions {
  enabled?: boolean;
}

type PendingAction = (() => void) | { type: "navigate"; url: string };

export function useBookingReadinessGate(options: BookingReadinessGateOptions = {}) {
  const enabled = options.enabled ?? true;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { user } = useAuthStore();
  const isCustomer = session?.user?.role === "customer" || user?.role === "customer";
  const userId = user?.id ?? "";

  const { data: profile, isLoading: profileLoading } = useCustomerProfile(
    userId,
    enabled && isCustomer && !!userId,
  );
  const { data: methods, isLoading: methodsLoading } = usePaymentMethods(
    enabled && isCustomer,
  );

  const addressLabels = useBookingReadinessLabels();
  const paymentDialogLabels = useAddPaymentMethodDialogLabels();

  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const pendingActionRef = useRef<PendingAction | null>(null);
  const profileRef = useRef<CustomerProfile | null | undefined>(undefined);
  profileRef.current = profile;

  const paymentMethodCount = methods?.length ?? 0;
  const gaps = getCustomerBookingGaps({ profile, paymentMethodCount });
  const isChecking =
    enabled && isCustomer && (profileLoading || methodsLoading) && profile === undefined;

  const runPendingAction = useCallback(() => {
    const pending = pendingActionRef.current;
    pendingActionRef.current = null;
    if (!pending) return;
    if (typeof pending === "function") {
      pending();
      return;
    }
    router.push(pending.url);
  }, [router]);

  const openGapDialog = useCallback((gap: BookingReadinessGap) => {
    if (gap === "address") {
      setAddressDialogOpen(true);
      return;
    }
    setPaymentDialogOpen(true);
  }, []);

  const advanceReadiness = useCallback(
    (profileOverride?: CustomerProfile | null) => {
      const nextProfile = profileOverride ?? profileRef.current;
      const nextGap = firstBookingReadinessGap({
        profile: nextProfile,
        paymentMethodCount: methods?.length ?? 0,
      });
      if (nextGap) {
        openGapDialog(nextGap);
        return;
      }
      runPendingAction();
    },
    [methods?.length, openGapDialog, runPendingAction],
  );

  const startReadinessFlow = useCallback(
    (action: PendingAction) => {
      if (!enabled || !isCustomer) {
        if (typeof action === "function") {
          action();
        } else {
          router.push(action.url);
        }
        return;
      }
      if (isChecking) return;

      pendingActionRef.current = action;
      const gap = firstBookingReadinessGap({ profile, paymentMethodCount });
      if (gap) {
        openGapDialog(gap);
        return;
      }
      runPendingAction();
    },
    [
      enabled,
      isCustomer,
      isChecking,
      profile,
      paymentMethodCount,
      openGapDialog,
      runPendingAction,
      router,
    ],
  );

  const requestBookingNavigation = useCallback(
    (url: string) => {
      startReadinessFlow({ type: "navigate", url });
    },
    [startReadinessFlow],
  );

  const ensureBookingReady = useCallback(
    (onReady: () => void) => {
      startReadinessFlow(onReady);
    },
    [startReadinessFlow],
  );

  const openNextGap = useCallback(() => {
    const gap = firstBookingReadinessGap({ profile, paymentMethodCount });
    if (gap) {
      pendingActionRef.current = null;
      openGapDialog(gap);
    }
  }, [profile, paymentMethodCount, openGapDialog]);

  const handleAddressSuccess = useCallback(
    (updated: CustomerProfile) => {
      setAddressDialogOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["customerProfile"] });
      void invalidateSetupChecklists(queryClient);
      advanceReadiness(updated);
    },
    [advanceReadiness, queryClient],
  );

  const handlePaymentSuccess = useCallback(() => {
    setPaymentDialogOpen(false);
    void queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
    void queryClient.invalidateQueries({ queryKey: ["customerProfile"] });
    void invalidateSetupChecklists(queryClient);
    const nextGap = firstBookingReadinessGap({
      profile: profileRef.current,
      paymentMethodCount: 1,
    });
    if (nextGap) {
      openGapDialog(nextGap);
      return;
    }
    runPendingAction();
  }, [openGapDialog, queryClient, runPendingAction]);

  const handleAddressOpenChange = useCallback((open: boolean) => {
    setAddressDialogOpen(open);
    if (!open) pendingActionRef.current = null;
  }, []);

  const handlePaymentOpenChange = useCallback((open: boolean) => {
    setPaymentDialogOpen(open);
    if (!open) pendingActionRef.current = null;
  }, []);

  const dialogs = (
    <>
      <CustomerAddressDialog
        open={addressDialogOpen}
        onOpenChange={handleAddressOpenChange}
        onSuccess={handleAddressSuccess}
        title={addressLabels.addressTitle}
        description={addressLabels.addressDescription}
      />
      <AddPaymentMethodDialog
        open={paymentDialogOpen}
        onOpenChange={handlePaymentOpenChange}
        onSuccess={handlePaymentSuccess}
        title={paymentDialogLabels.title}
        description={paymentDialogLabels.description}
        labels={paymentDialogLabels.actions}
      />
    </>
  );

  return {
    requestBookingNavigation,
    ensureBookingReady,
    openNextGap,
    dialogs,
    isChecking,
    gaps,
    hasAddress: !gaps.includes("address"),
    hasPaymentMethod: !gaps.includes("payment"),
    isBookingReady: gaps.length === 0,
  };
}
