"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { Flex } from "@welpco/ui/flex";
import { Spinner } from "@welpco/ui/spinner";
import { ApiClientError } from "@/lib/api/client";
import { completeSignupAndRedirect } from "@/lib/auth/complete-signup-and-redirect";
import { safeNextPath } from "@/lib/auth/safe-next";
import {
  isOnlyDeferredSetupMissing,
  stepNameToSlug,
} from "./step-name-utils";
import type { SignupStateDto, IncompleteSignupErrorBody } from "@welpco/types";

/**
 * Legacy welpers (mid old 9-step wizard) and anyone on a deferred step URL:
 * finish signup if needed, then open the dashboard setup checklist.
 */
export function WelperRegisterEscape({
  state,
  nextRaw,
}: {
  state: SignupStateDto;
  nextRaw: string | null;
}) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void (async () => {
      const dashboardPath = safeNextPath(nextRaw, "/dashboard");

      if (state.signupCompleted) {
        router.replace(dashboardPath);
        return;
      }

      try {
        await completeSignupAndRedirect({
          nextRaw,
          updateSession,
          router,
        });
      } catch (err) {
        if (err instanceof ApiClientError && err.code === "INCOMPLETE_SIGNUP") {
          const body = err.body as IncompleteSignupErrorBody | undefined;
          if (isOnlyDeferredSetupMissing(body?.missingFields)) {
            router.replace("/register/finish");
            return;
          }
          if (body?.nextStep) {
            router.replace(
              `/register/step/${stepNameToSlug(body.nextStep)}`,
            );
            return;
          }
        }
        router.replace("/register/finish");
      }
    })();
  }, [state.signupCompleted, updateSession, router, nextRaw]);

  return (
    <Flex
      justify="center"
      align="center"
      style={{ minHeight: "40vh" }}
      aria-busy
    >
      <Spinner size="3" />
    </Flex>
  );
}
