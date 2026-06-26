"use client";

import { useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { EmailVerificationRequiredError } from "@/lib/api/client";
import { useResendVerification, type ResendVerificationHuman } from "@/lib/hooks/use-resend-verification";

/**
 * Wrapper around a "bookable action" — any mutation the BFF gates with
 * `EmailVerifiedGuard`. When the wrapped run() throws an
 * `EmailVerificationRequiredError`, the wrapper surfaces
 * `<EmailVerificationRequiredDialog>` instead of propagating the error.
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
    return resend.mutateAsync(human);
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
