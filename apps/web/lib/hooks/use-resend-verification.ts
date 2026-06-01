import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { resendVerificationCode } from "@/lib/services/user-service";

export type ResendVerificationHuman = {
  turnstileToken?: string;
  website?: string;
};

/**
 * Day 15 — Phase 3 of the signup ↔ onboarding merge.
 *
 * Tiny wrapper around the existing `resendVerificationCode` service so the
 * verification banner + the bookable-action 403 dialog share one mutation
 * surface. The BFF endpoint reads the user from the JWT, so the email
 * argument is informational (it logs the request target).
 */
export function useResendVerification() {
  const { data: session } = useSession();
  return useMutation<void, Error, ResendVerificationHuman | void>({
    mutationFn: (human) =>
      resendVerificationCode(
        (session?.user as { email?: string | null } | undefined)?.email ?? "",
        human ?? undefined,
      ),
  });
}
