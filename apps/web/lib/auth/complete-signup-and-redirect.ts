import type { Session } from "next-auth";
import { getSession } from "next-auth/react";
import type { SignupStateDto } from "@welpco/types";
import { clearTokenCache } from "@/lib/api/get-token";
import { safeNextPath } from "@/lib/auth/safe-next";
import { finishSignup } from "@/lib/services/signup-service";

type SignupRedirectRouter = {
  replace: (href: string) => void;
  refresh?: () => void;
};

/**
 * Finish signup, sync NextAuth session + BFF JWT (welper role), then open dashboard.
 * Clears the API token cache so the setup-checklist request uses the refreshed JWT.
 */
export async function completeSignupAndRedirect(options: {
  nextRaw: string | null;
  updateSession: (data: {
    user?: {
      signupCompleted: boolean;
      platformAccessEnabled?: boolean;
    };
  }) => Promise<Session | null>;
  router: SignupRedirectRouter;
}): Promise<SignupStateDto> {
  const finalState = await finishSignup();

  await options.updateSession({
    user: {
      signupCompleted: true,
      platformAccessEnabled: finalState.platformAccessEnabled,
    },
  });

  clearTokenCache();

  // Let NextAuth session + RSC props catch up before dashboard API calls.
  await getSession();
  options.router.refresh?.();

  options.router.replace(safeNextPath(options.nextRaw, "/dashboard"));
  return finalState;
}
