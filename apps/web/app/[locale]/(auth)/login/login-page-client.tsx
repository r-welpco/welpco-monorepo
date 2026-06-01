"use client";

import { LoginForm, AuthBackground } from "@welpco/ui/platform/user-management";
import { Callout } from "@welpco/ui/callout";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAppRouter } from "@/lib/i18n/use-app-router";
import { signIn, useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { localeFromUseLocale } from "@/lib/i18n/app-locale";
import type { LoginFormValues } from "@welpco/ui/platform/user-management";
import { clearSessionForSignIn } from "@/lib/auth/clear-session-for-sign-in";
import { hasApiSession } from "@/lib/auth/has-api-session";
import { safeNextPath, withNext } from "@/lib/auth/safe-next";
import { useLoginFormLabels } from "@/lib/i18n/use-auth-labels";
import { LoginAlreadySignedIn } from "./login-already-signed-in";

export default function LoginPageClient() {
  const router = useAppRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: session, status, update: updateSession } = useSession();
  const labels = useLoginFormLabels();
  const uiLocale = useLocale();
  const t = useTranslations("auth.login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVerifiedMessage, setShowVerifiedMessage] = useState(false);
  const [showPasswordResetMessage, setShowPasswordResetMessage] = useState(false);
  const verifiedEmail = searchParams.get("email");
  const nextRaw = searchParams.get("next");
  const nextPath = useMemo(() => safeNextPath(nextRaw, "/dashboard"), [nextRaw]);

  const alreadySignedIn = hasApiSession(status, session);

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setShowVerifiedMessage(true);
    }
    if (searchParams.get("passwordReset") === "success") {
      setShowPasswordResetMessage(true);
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
        await clearSessionForSignIn(queryClient);

        const result = await signIn("credentials", {
          email: values.email,
          password: values.password,
          preferredLocale: localeFromUseLocale(uiLocale),
          redirect: false,
        });

        if (result?.error) {
          throw new Error(t("errors.invalidCredentials"));
        }

        const { getSession } = await import("next-auth/react");
        let nextSession = null;
        const maxAttempts = 5;
        const delays = [150, 300, 500, 700, 900];

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          if (attempt > 0) {
            await new Promise((resolve) => setTimeout(resolve, delays[attempt - 1]));
          }
          nextSession = await getSession();
          if (nextSession?.user && nextSession?.accessToken) {
            break;
          }
        }

        if (!nextSession?.user || !nextSession?.accessToken) {
          setError(t("errors.sessionNotReady"));
          setLoading(false);
          return;
        }

        const emailVerified = nextSession.user.emailVerified ?? false;
        const signupCompleted =
          nextSession.user.signupCompleted ??
          nextSession.user.onboardingCompleted ??
          false;
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
                role: nextSession.user.role,
              },
            });
          } catch {
            // best-effort
          }
        }

        if (!signupCompleted) {
          router.push(withNext("/register", nextRaw));
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
    [router, updateSession, nextPath, nextRaw, t, uiLocale, queryClient],
  );

  const handleForgotPassword = useCallback(() => {
    router.push(withNext("/forgot-password", nextRaw));
  }, [router, nextRaw]);

  const handleSignUp = useCallback(() => {
    router.push(withNext("/register", nextRaw));
  }, [router, nextRaw]);

  if (status === "loading") {
    return (
      <AuthBackground>
        <Flex justify="center" align="center" style={{ minHeight: "40vh" }} />
      </AuthBackground>
    );
  }

  return (
    <AuthBackground>
      <Flex direction="column" align="center" gap="4" width="100%">
        {showPasswordResetMessage && !alreadySignedIn ? (
          <Box width="100%" maxWidth="480px">
            <Callout.Root color={SEMANTIC_COLOR.success} variant="surface" role="status">
              <Callout.Text>{t("passwordResetBanner")}</Callout.Text>
            </Callout.Root>
          </Box>
        ) : null}
        {showVerifiedMessage && !showPasswordResetMessage && !alreadySignedIn ? (
          <Box width="100%" maxWidth="480px">
            <Callout.Root color={SEMANTIC_COLOR.success} variant="surface" role="status">
              <Callout.Text>{t("verifiedBanner")}</Callout.Text>
            </Callout.Root>
          </Box>
        ) : null}
        {alreadySignedIn ? (
          <LoginAlreadySignedIn nextRaw={nextRaw} />
        ) : (
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
        )}
      </Flex>
    </AuthBackground>
  );
}
