import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { EmailAlreadyVerifiedError } from "@/lib/api/client";
import { syncEmailVerificationFromServer } from "@/lib/auth/sync-email-verification-session";
import { resendVerificationCode } from "@/lib/services/user-service";

export type ResendVerificationHuman = {
  turnstileToken?: string;
  website?: string;
};

export type ResendVerificationResult =
  | { outcome: "sent" }
  | { outcome: "already_verified" };

/**
 * Resend verification email for the signed-in user. When BFF reports the
 * email is already verified, refreshes the session so setup UI catches up.
 */
export function useResendVerification() {
  const { data: session, update: updateSession } = useSession();
  const queryClient = useQueryClient();

  return useMutation<ResendVerificationResult, Error, ResendVerificationHuman | void>({
    mutationFn: async (human) => {
      const email =
        (session?.user as { email?: string | null } | undefined)?.email ?? "";
      try {
        await resendVerificationCode(email, human ?? undefined);
        return { outcome: "sent" };
      } catch (err) {
        if (err instanceof EmailAlreadyVerifiedError) {
          await syncEmailVerificationFromServer(updateSession, queryClient);
          return { outcome: "already_verified" };
        }
        throw err;
      }
    },
  });
}
