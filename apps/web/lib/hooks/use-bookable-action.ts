"use client";

import { useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { EmailVerificationRequiredError } from "@/lib/api/client";
import { useResendVerification, type ResendVerificationHuman } from "@/lib/hooks/use-resend-verification";

/**
 * Day 15 — Phase 3 of the signup ↔ onboarding merge.
 *
 * Generic wrapper around a "bookable action" — any mutation that the BFF
 * gates with `EmailVerifiedGuard`. When the wrapped run() throws an
 * `EmailVerificationRequiredError`, the wrapper returns a `pendingVerification`
 * flag the caller binds into `<EmailVerificationRequiredDialog>`. All other
 * errors propagate verbatim so existing error-handling stays untouched.
 *
 * Wiring example:
 *
 *   const bookable = useBookableAction();
 *   await bookable.run(() => createBooking.mutateAsync(params));
 *   <EmailVerificationRequiredDialog
 *     open={bookable.dialogOpen}
 *     onOpenChange={bookable.setDialogOpen}
 *     email={bookable.email}
 *   />
 */
export function useBookableAction() {
  const { data: session } = useSession();
  const [dialogOpen, setDialogOpen] = useState(false);
  const resend = useResendVerification();

  const run = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
      try {
        return await fn();
      } catch (err) {
        if (err instanceof EmailVerificationRequiredError) {
          setDialogOpen(true);
          return undefined;
        }
        throw err;
      }
    },
    [],
  );

  const handleResend = useCallback(async (human?: ResendVerificationHuman) => {
    await resend.mutateAsync(human);
    setDialogOpen(false);
  }, [resend]);

  return {
    run,
    dialogOpen,
    setDialogOpen,
    email: (session?.user as { email?: string | null } | undefined)?.email ?? undefined,
    resend: handleResend,
    resendPending: resend.isPending,
  };
}
