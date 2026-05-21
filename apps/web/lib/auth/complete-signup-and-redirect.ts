import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { Session } from "next-auth";
import type { SignupStateDto } from "@welpco/types";
import { refreshBffTokensInSession } from "@/lib/auth/refresh-session-tokens";
import { safeNextPath } from "@/lib/auth/safe-next";
import { roleFromSelectedRole } from "@/lib/auth/session-role";
import { finishSignup } from "@/lib/services/signup-service";

export async function completeSignupAndRedirect(options: {
  nextRaw: string | null;
  updateSession: (data: {
    user: {
      signupCompleted: boolean;
      platformAccessEnabled?: boolean;
      role?: string;
    };
  }) => Promise<Session | null>;
  router: AppRouterInstance;
}): Promise<SignupStateDto> {
  const finalState = await finishSignup();
  const role = roleFromSelectedRole(finalState.selectedRole) ?? "customer";
  await options.updateSession({
    user: {
      signupCompleted: true,
      platformAccessEnabled: finalState.platformAccessEnabled,
      role,
    },
  });
  await refreshBffTokensInSession(options.updateSession);
  options.router.replace(safeNextPath(options.nextRaw, "/dashboard"));
  return finalState;
}
