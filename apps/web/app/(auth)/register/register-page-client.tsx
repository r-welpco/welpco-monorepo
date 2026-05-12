"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Flex } from "@welpco/ui/flex";
import { Spinner } from "@welpco/ui/spinner";
import { EmailPasswordStep } from "@welpco/ui/platform/user-management";
import { stepNameToSlug } from "./step-name-utils";
import { useBeginSignup, useSignupState } from "@/lib/hooks/use-signup";
import { ApiClientError } from "@/lib/api/client";
import { safeNextPath, withNext } from "@/lib/auth/safe-next";

/**
 * Day 15 — Phase 2 Dispatch A. Wizard router/entry-point.
 *
 * Picks the right surface to render based on the live session + signup state:
 *   - signed-out → begin step (email + password)
 *   - signed-in + signupCompleted: false → redirect to /register/step/<nextStep>
 *   - signed-in + signupCompleted: true → redirect to ?next=… or /dashboard
 *
 * On a successful begin call, the hook signs the user in via NextAuth so the
 * subsequent routing branch (signed-in + nextStep) takes over on the next
 * render.
 */
export default function RegisterPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextRaw = searchParams.get("next");
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  const beginSignup = useBeginSignup();
  const { data: state, isFetching } = useSignupState();

  const [error, setError] = useState<string | null>(null);

  // Once authenticated, route off the bare /register page to the right step.
  useEffect(() => {
    if (!isAuthenticated || !state) return;
    if (state.signupCompleted) {
      router.replace(safeNextPath(nextRaw, "/dashboard"));
      return;
    }
    if (state.nextStep) {
      router.replace(`/register/step/${stepNameToSlug(state.nextStep)}`);
    }
  }, [isAuthenticated, state, router, nextRaw]);

  const handleBegin = async (values: { email: string; password: string }) => {
    setError(null);
    try {
      await beginSignup.mutateAsync(values);
      // Session-establishment + routing happens in the effect above once the
      // next render sees `status === 'authenticated'` and the state query
      // settles.
    } catch (err) {
      if (err instanceof ApiClientError && err.code === "ACCOUNT_EXISTS") {
        setError(
          "An account already exists for that email. Sign in instead, or use a different email.",
        );
        return;
      }
      const message =
        err instanceof Error
          ? err.message
          : "We couldn't create your account. Try again in a moment.";
      setError(message);
    }
  };

  // While authenticated state settles, render a light spinner instead of
  // flashing the begin step or the redirect target.
  if (isAuthenticated) {
    return (
      <Flex
        justify="center"
        align="center"
        style={{ minHeight: "40vh" }}
        aria-busy={isFetching}
      >
        <Spinner size="3" />
      </Flex>
    );
  }

  return (
    <EmailPasswordStep
      loading={beginSignup.isPending}
      error={error}
      onSubmit={handleBegin}
      onSignIn={() => router.push(withNext("/login", nextRaw))}
    />
  );
}
