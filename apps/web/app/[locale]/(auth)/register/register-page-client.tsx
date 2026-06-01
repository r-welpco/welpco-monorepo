"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppRouter } from "@/lib/i18n/use-app-router";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { localeFromUseLocale } from "@/lib/i18n/app-locale";
import { hasApiSession } from "@/lib/auth/has-api-session";
import { Button } from "@welpco/ui/button";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { FORM_SPACING } from "@welpco/ui/tokens";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import {
  EmailPasswordStep,
  type EmailPasswordStepValues,
} from "@welpco/ui/platform/user-management";
import { TurnstileWidget } from "@/components/security/turnstile-widget";
import { getRegisterEscapeTarget, stepNameToSlug } from "./step-name-utils";
import { WelperRegisterEscape } from "./welper-register-escape";
import { RegisterResumeShell } from "./register-resume-shell";
import { useBeginSignup, useSignupState } from "@/lib/hooks/use-signup";
import { ApiClientError } from "@/lib/api/client";
import { safeNextPath, withNext } from "@/lib/auth/safe-next";
import { useEmailPasswordStepLabels } from "@/lib/i18n/use-auth-labels";

export default function RegisterPageClient() {
  const router = useAppRouter();
  const searchParams = useSearchParams();
  const nextRaw = searchParams.get("next");
  const { status, data: session } = useSession();
  const canResumeSignup = hasApiSession(status, session);
  const labels = useEmailPasswordStepLabels();
  const uiLocale = useLocale();
  const t = useTranslations("auth.register.begin");
  const tPage = useTranslations("auth.register.steps.page");

  const beginSignup = useBeginSignup();
  const {
    data: state,
    isPending,
    error: signupStateError,
    refetch,
  } = useSignupState();

  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  useEffect(() => {
    if (status === "loading" || !canResumeSignup) return;
    if (isPending && !state) return;
    if (!state) return;

    if (state.signupCompleted) {
      router.replace(safeNextPath(nextRaw, "/dashboard"));
      return;
    }

    if (getRegisterEscapeTarget(state, null) === "dashboard") {
      return;
    }

    if (state.nextStep) {
      router.replace(`/register/step/${stepNameToSlug(state.nextStep)}`);
      return;
    }

    router.replace("/register/finish");
  }, [status, canResumeSignup, isPending, state, router, nextRaw]);

  const handleBegin = async (values: EmailPasswordStepValues) => {
    setError(null);
    if (turnstileEnabled && !turnstileToken) {
      setError("Complete the human verification challenge.");
      return;
    }

    try {
      await beginSignup.mutateAsync({
        ...values,
        preferredLocale: localeFromUseLocale(uiLocale),
        turnstileToken: turnstileToken ?? undefined,
      });
    } catch (err) {
      setTurnstileResetKey((key) => key + 1);
      if (err instanceof ApiClientError && err.code === "ACCOUNT_EXISTS") {
        setError(t("errors.accountExists"));
        return;
      }
      setError(
        err instanceof Error ? err.message : t("errors.createFailed"),
      );
    }
  };

  if (status === "loading") {
    return null;
  }

  if (canResumeSignup) {
    if (isPending && !state) {
      return <RegisterResumeShell loading />;
    }

    if (!state) {
      const message =
        signupStateError instanceof ApiClientError &&
        signupStateError.code === "NO_TOKEN"
          ? tPage("sessionExpiredMessage")
          : signupStateError instanceof Error
            ? signupStateError.message
            : tPage("loadProgressMessage");

      return (
        <RegisterResumeShell>
          <Box>
            <Heading as="h2" size="4" trim="start" mb={FORM_SPACING.titleGap}>
              {tPage("loadProgressTitle")}
            </Heading>
            <Text size="2" color="gray">
              {message}
            </Text>
          </Box>
          <Flex direction="column" gap="2">
            <Button
              size="3"
              onClick={() => void refetch()}
              disabled={isPending}
            >
              {t("retry")}
            </Button>
          </Flex>
        </RegisterResumeShell>
      );
    }

    if (state && getRegisterEscapeTarget(state, null) === "dashboard") {
      return <WelperRegisterEscape state={state} nextRaw={nextRaw} />;
    }

    return <RegisterResumeShell loading />;
  }

  return (
    <Flex direction="column" gap="3" align="center">
      <EmailPasswordStep
        labels={labels}
        loading={beginSignup.isPending}
        error={error}
        onSubmit={handleBegin}
        onSignIn={() => router.push(withNext("/login", nextRaw))}
      />
      <TurnstileWidget
        action="signup_begin"
        resetKey={turnstileResetKey}
        onToken={setTurnstileToken}
      />
    </Flex>
  );
}
