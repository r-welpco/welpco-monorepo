"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { reconcileEmailVerificationSession } from "@/lib/auth/sync-email-verification-session";

/** Keeps session `emailVerified` aligned with BFF when the user verified out-of-band. */
export function useSyncEmailVerificationSession(enabled = true) {
  const { data: session, status, update } = useSession();
  const queryClient = useQueryClient();
  const emailVerified = session?.user?.emailVerified === true;
  const userId = session?.user?.id ?? null;
  const attemptedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      !enabled ||
      status !== "authenticated" ||
      emailVerified ||
      !userId ||
      attemptedUserIdRef.current === userId
    ) {
      return;
    }
    // `update()` temporarily changes the shared session status to "loading".
    // If the refreshed session still looks unverified, depending on `status`
    // can otherwise restart this effect indefinitely and flicker dashboard UI.
    attemptedUserIdRef.current = userId;
    let cancelled = false;
    void reconcileEmailVerificationSession(false, update, queryClient).then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, status, emailVerified, userId, update, queryClient]);
}
