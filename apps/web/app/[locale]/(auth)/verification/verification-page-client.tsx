"use client";

import { AuthBackground, AccountVerification } from "@welpco/ui/platform/user-management";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useAppRouter } from "@/lib/i18n/use-app-router";
import { useSession } from "next-auth/react";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { Button } from "@welpco/ui/button";
import { Spinner } from "@welpco/ui/spinner";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { verifyAccount, resendVerificationCode } from "@/lib/services/user-service";
import { useUserStore } from "@/stores/userStore";
import type { AccountVerificationValues } from "@welpco/ui/platform/user-management";
import { safeNextPath, withNext } from "@/lib/auth/safe-next";
import { useAccountVerificationLabels } from "@/lib/i18n/use-auth-labels";
import { WELPER_SETUP_CHECKLIST_KEY } from "@/lib/hooks/use-signup";
import { TurnstileWidget } from "@/components/security/turnstile-widget";

export default function VerificationPageClient() {
  const router = useAppRouter();
  const searchParams = useSearchParams();
  const { update: updateSession, data: session, status: sessionStatus } = useSession();
  const queryClient = useQueryClient();
  const labels = useAccountVerificationLabels();
  const t = useTranslations("auth.verification");
  const verificationEmail = useUserStore((state) => state.verificationEmail);
  const registrationData = useUserStore((state) => state.registrationData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  const sessionEmail = session?.user?.email?.trim() ?? "";
  const email =
    searchParams.get("email")?.trim() ||
    sessionEmail ||
    verificationEmail ||
    registrationData?.email?.trim() ||
    "";
  const nextRaw = searchParams.get("next");

  const handleSubmit = async (values: AccountVerificationValues) => {
    if (!values.code) {
      setError(t("errors.codeRequired"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await verifyAccount({ email, code: values.code });

      await updateSession({
        user: {
          emailVerified: true,
        },
      });

      await queryClient.invalidateQueries({ queryKey: WELPER_SETUP_CHECKLIST_KEY });

      const signupDone =
        session?.user?.signupCompleted ??
        session?.user?.onboardingCompleted ??
        false;
      router.replace(
        signupDone ? safeNextPath(nextRaw, "/dashboard") : withNext("/register", nextRaw),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.verifyFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (values?: Pick<AccountVerificationValues, "website">) => {
    if (!email) return;

    setError(null);
    if (turnstileEnabled && !turnstileToken) {
      setError("Complete the human verification challenge.");
      return;
    }

    try {
      await resendVerificationCode(email, {
        turnstileToken: turnstileToken ?? undefined,
        website: values?.website,
      });
    } catch (err) {
      setTurnstileResetKey((key) => key + 1);
      setError(err instanceof Error ? err.message : t("errors.resendFailed"));
    }
  };

  if (sessionStatus === "loading") {
    return (
      <AuthBackground>
        <Flex justify="center" align="center" style={{ minHeight: "40vh" }} aria-busy>
          <Spinner size="3" />
        </Flex>
      </AuthBackground>
    );
  }

  if (!email) {
    return (
      <AuthBackground>
        <Flex direction="column" gap="3" align="center" style={{ minHeight: "40vh", maxWidth: 400, margin: "0 auto" }}>
          <Text size="2" color="gray" align="center" as="p">
            {t("errors.missingEmail")}
          </Text>
          <Button size="2" asChild>
            <Link href="/login">{t("backToLogin")}</Link>
          </Button>
        </Flex>
      </AuthBackground>
    );
  }

  return (
    <AuthBackground>
      <Flex direction="column" gap="3" align="center">
        <AccountVerification
          labels={labels}
          email={email}
          loading={loading}
          error={error || undefined}
          onSubmit={handleSubmit}
          onResend={handleResend}
        />
        <TurnstileWidget
          action="resend_verification"
          resetKey={turnstileResetKey}
          onToken={setTurnstileToken}
        />
      </Flex>
    </AuthBackground>
  );
}
