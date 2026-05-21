"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
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
import { EmailPasswordStep } from "@welpco/ui/platform/user-management";
import { getWelperRegisterEscapeTarget, stepNameToSlug } from "./step-name-utils";
import { WelperRegisterEscape } from "./welper-register-escape";
import { RegisterResumeShell } from "./register-resume-shell";
import { useBeginSignup, useSignupState } from "@/lib/hooks/use-signup";
import { ApiClientError } from "@/lib/api/client";
import { safeNextPath, withNext } from "@/lib/auth/safe-next";
import { useEmailPasswordStepLabels } from "@/lib/i18n/use-auth-labels";

export default function RegisterPageClient() {
  const router = useRouter();
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

  useEffect(() => {
    if (status === "loading" || !canResumeSignup) return;
    if (isPending && !state) return;
    if (!state) return;

    if (state.signupCompleted) {
      router.replace(safeNextPath(nextRaw, "/dashboard"));
      return;
    }

    if (getWelperRegisterEscapeTarget(state, null) === "dashboard") {
      return;
    }

    if (state.nextStep) {
      router.replace(`/register/step/${stepNameToSlug(state.nextStep)}`);
      return;
    }

    router.replace("/register/finish");
  }, [status, canResumeSignup, isPending, state, router, nextRaw]);

  const handleBegin = async (values: { email: string; password: string }) => {
    setError(null);
    try {
      await beginSignup.mutateAsync({
        ...values,
        preferredLocale: localeFromUseLocale(uiLocale),
      });
    } catch (err) {
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

    if (state && getWelperRegisterEscapeTarget(state, null) === "dashboard") {
      return <WelperRegisterEscape state={state} nextRaw={nextRaw} />;
    }

    return <RegisterResumeShell loading />;
  }

  return (
    <EmailPasswordStep
      labels={labels}
      loading={beginSignup.isPending}
      error={error}
      onSubmit={handleBegin}
      onSignIn={() => router.push(withNext("/login", nextRaw))}
    />
  );
}
