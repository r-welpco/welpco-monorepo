import type { QueryClient } from "@tanstack/react-query";
import type { Session } from "next-auth";
import { getSignupState } from "@/lib/services/signup-service";
import { invalidateSetupChecklists } from "@/lib/hooks/use-signup";

type UpdateSession = () => Promise<Session | null>;

/** Refresh NextAuth JWT from BFF signup state and invalidate setup checklists. */
export async function syncEmailVerificationFromServer(
  updateSession: UpdateSession,
  queryClient: QueryClient,
): Promise<void> {
  await updateSession();
  await invalidateSetupChecklists(queryClient);
}

/**
 * When the JWT still says unverified but BFF signup state is verified
 * (e.g. user verified via email link), sync the session before showing setup UI.
 */
export async function reconcileEmailVerificationSession(
  emailVerifiedInSession: boolean,
  updateSession: UpdateSession,
  queryClient: QueryClient,
): Promise<boolean> {
  if (emailVerifiedInSession) {
    return true;
  }
  try {
    const state = await getSignupState();
    if (!state.emailVerified) {
      return false;
    }
    await syncEmailVerificationFromServer(updateSession, queryClient);
    return true;
  } catch {
    return false;
  }
}
