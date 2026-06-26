"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { reconcileEmailVerificationSession } from "@/lib/auth/sync-email-verification-session";

/** Keeps session `emailVerified` aligned with BFF when the user verified out-of-band. */
export function useSyncEmailVerificationSession(enabled = true) {
  const { data: session, status, update } = useSession();
  const queryClient = useQueryClient();
  const emailVerified = session?.user?.emailVerified === true;

  useEffect(() => {
    if (!enabled || status !== "authenticated" || emailVerified) {
      return;
    }
    let cancelled = false;
    void reconcileEmailVerificationSession(false, update, queryClient).then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, status, emailVerified, update, queryClient]);
}
