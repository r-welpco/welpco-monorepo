"use client";

import { LoginForm, AuthBackground } from "@welpco/ui/platform/user-management";
import { Callout } from "@welpco/ui/callout";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { signIn, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import type { LoginFormValues } from "@welpco/ui/platform/user-management";
import { hasPlatformAccess, postSignupDestination } from "@/lib/auth/platform-access";
import { safeNextPath, withNext } from "@/lib/auth/safe-next";
import { useLoginFormLabels } from "@/lib/i18n/use-auth-labels";

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update: updateSession } = useSession();
  const labels = useLoginFormLabels();
  const t = useTranslations("auth.login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVerifiedMessage, setShowVerifiedMessage] = useState(false);
  const verifiedEmail = searchParams.get("email");
  const nextRaw = searchParams.get("next");
  const nextPath = useMemo(() => safeNextPath(nextRaw, "/dashboard"), [nextRaw]);

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setShowVerifiedMessage(true);
    }
  }, [searchParams]);

  const [rememberedEmail, setRememberedEmail] = useState<string | null>(null);
  useEffect(() => {
    try {
      setRememberedEmail(localStorage.getItem("rememberEmail"));
    } catch {
      // ignore
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
          throw new Error(t("errors.invalidCredentials"));
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
          router.push(withNext("/register", nextRaw));
          setLoading(false);
          return;
        }

        const emailVerified = session.user.emailVerified ?? false;
        const signupCompleted =
          session.user.signupCompleted ?? session.user.onboardingCompleted ?? false;
        const platformAccessEnabled = session.user.platformAccessEnabled;

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
                platformAccessEnabled,
                role: session.user.role,
              },
            });
          } catch {
            // best-effort
          }
        }

        if (!signupCompleted) {
          router.push(withNext("/register", nextRaw));
        } else if (
          !hasPlatformAccess({ signupCompleted: true, platformAccessEnabled })
        ) {
          router.push("/register/complete");
        } else {
          router.push(nextPath);
        }

        setLoading(false);
      } catch (err) {
        setError(
          err instanceof Error && err.message !== t("errors.invalidCredentials")
            ? err.message
            : t("errors.signInFailed"),
        );
        setLoading(false);
      }
    },
    [router, updateSession, nextPath, nextRaw, t],
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
              <Callout.Text>{t("verifiedBanner")}</Callout.Text>
            </Callout.Root>
          </Box>
        )}
        <LoginForm
          key={`login-${verifiedEmail ?? ""}-${rememberedEmail ?? ""}`}
          labels={labels}
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
