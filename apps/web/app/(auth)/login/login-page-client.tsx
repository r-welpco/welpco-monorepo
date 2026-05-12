"use client";

import { LoginForm, AuthBackground } from "@welpco/ui/platform/user-management";
import { Callout } from "@welpco/ui/callout";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import type { LoginFormValues } from "@welpco/ui/platform/user-management";
import { safeNextPath, withNext } from "@/lib/auth/safe-next";

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update: updateSession } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVerifiedMessage, setShowVerifiedMessage] = useState(false);
  const verifiedEmail = searchParams.get("email");
  const nextRaw = searchParams.get("next");
  // Resolve once for stable navigation targets and to keep the encoded original
  // available to forward through the verification + onboarding hops.
  const nextPath = useMemo(() => safeNextPath(nextRaw, "/dashboard"), [nextRaw]);

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setShowVerifiedMessage(true);
    }
  }, [searchParams]);

  // Read localStorage only after mount so server and first client paint match (avoids checkbox hydration mismatch).
  const [rememberedEmail, setRememberedEmail] = useState<string | null>(null);
  useEffect(() => {
    try {
      setRememberedEmail(localStorage.getItem("rememberEmail"));
    } catch {
      // ignore (e.g. private mode)
    }
  }, []);

  const defaultEmail = useMemo(() => verifiedEmail || rememberedEmail || "", [verifiedEmail, rememberedEmail]);

  const handleSubmit = useCallback(
    async (values: LoginFormValues) => {
      setLoading(true);
      setError(null);

      try {
        const result = await signIn("credentials", {
          email: values.email,
          password: values.password,
          redirect: false,
        });

        if (result?.error) {
          throw new Error(result.error || "Invalid email or password");
        }

        const { getSession } = await import("next-auth/react");
        let session = null;
        const maxAttempts = 3;
        const delays = [200, 400, 600];

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          if (attempt > 0) {
            await new Promise((resolve) => setTimeout(resolve, delays[attempt - 1]));
          }
          session = await getSession();
          if (session?.user && session?.accessToken) {
            break;
          }
        }

        if (!session?.user || !session?.accessToken) {
          router.push(nextPath);
          return;
        }

        const emailVerified = session.user.emailVerified ?? false;
        // Day 15 Dispatch C — `signupCompleted` is the post-merge source of
        // truth. `onboardingCompleted` is kept as a defensive fallback for
        // sessions issued before Phase 1 BFF rolled. The middleware
        // (`proxy.ts`) does the authoritative routing — login just hands off
        // to the right post-auth target.
        const signupCompleted =
          session.user.signupCompleted ?? session.user.onboardingCompleted ?? false;

        if (values.remember) {
          localStorage.setItem("rememberEmail", values.email);
        } else {
          localStorage.removeItem("rememberEmail");
        }

        if (updateSession) {
          try {
            await updateSession({
              user: {
                emailVerified,
                signupCompleted,
              },
            });
          } catch {
            // Session update is best-effort; navigation will still proceed
          }
        }

        // Signup not finished → wizard. Verification timing is decoupled —
        // unverified-but-signup-done users land on the dashboard (banner +
        // bookable-action gate). The `/verification` interstitial is no longer
        // in the redirect graph (LOGIN-002 resolved by signup-merge Phase 3).
        if (!signupCompleted) {
          router.push(withNext("/register", nextRaw));
        } else {
          router.push(nextPath);
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to sign in. Please try again.");
        setLoading(false);
      }
    },
    [router, updateSession, nextPath, nextRaw]
  );

  const handleForgotPassword = useCallback(() => {
    router.push(withNext("/forgot-password", nextRaw));
  }, [router, nextRaw]);

  const handleSignUp = useCallback(() => {
    router.push(withNext("/register", nextRaw));
  }, [router, nextRaw]);

  return (
    <AuthBackground>
      <Flex direction="column" align="center" gap="4" width="100%">
        {showVerifiedMessage && (
          <Box width="100%" maxWidth="480px">
            <Callout.Root color={SEMANTIC_COLOR.success} variant="surface" role="status">
              <Callout.Text>Your email is verified. Sign in to continue.</Callout.Text>
            </Callout.Root>
          </Box>
        )}
        <LoginForm
          key={`login-${verifiedEmail ?? ""}-${rememberedEmail ?? ""}`}
          defaultValues={
            defaultEmail
              ? { email: defaultEmail, remember: Boolean(rememberedEmail) }
              : undefined
          }
          loading={loading}
          error={error || undefined}
          onSubmit={handleSubmit}
          onForgotPassword={handleForgotPassword}
          onSignUp={handleSignUp}
        />
      </Flex>
    </AuthBackground>
  );
}
