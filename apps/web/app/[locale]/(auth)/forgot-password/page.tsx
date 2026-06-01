"use client";

import { AuthBackground, AccountRecoveryForm } from "@welpco/ui/platform/user-management";
import { AuthSearchParamsFallback } from "@/components/layout/auth-search-params-fallback";
import { TurnstileWidget } from "@/components/security/turnstile-widget";
import { Suspense, useState } from "react";
import { Flex } from "@welpco/ui/flex";
import { useSearchParams } from "next/navigation";
import { useAppRouter } from "@/lib/i18n/use-app-router";
import { useLocale, useTranslations } from "next-intl";
import { localeFromUseLocale } from "@/lib/i18n/app-locale";
import { requestPasswordReset } from "@/lib/services/user-service";
import { useUserStore } from "@/stores/userStore";
import type { AccountRecoveryValues } from "@welpco/ui/platform/user-management";
import { withNext } from "@/lib/auth/safe-next";
import { useForgotPasswordLabels } from "@/lib/i18n/use-auth-labels";

function ForgotPasswordPageClient() {
  const router = useAppRouter();
  const searchParams = useSearchParams();
  const nextRaw = searchParams.get("next");
  const uiLocale = useLocale();
  const t = useTranslations("auth.forgotPassword");
  const formLabels = useForgotPasswordLabels();
  const setPasswordResetEmail = useUserStore((state) => state.setPasswordResetEmail);
  const setPasswordResetSent = useUserStore((state) => state.setPasswordResetSent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  const handleSubmit = async (values: AccountRecoveryValues) => {
    setError(null);
    setSentEmail(null);
    if (turnstileEnabled && !turnstileToken) {
      setError("Complete the human verification challenge.");
      return;
    }

    setLoading(true);

    try {
      await requestPasswordReset({
        email: values.email,
        preferredLocale: localeFromUseLocale(uiLocale),
        turnstileToken: turnstileToken ?? undefined,
        website: values.website,
      });
      setPasswordResetEmail(values.email);
      setPasswordResetSent(true);
      setSentEmail(values.email);
    } catch (err) {
      setTurnstileResetKey((key) => key + 1);
      setError(err instanceof Error ? err.message : t("errors.sendFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(withNext("/login", nextRaw));
  };

  return (
    <AuthBackground>
      <Flex direction="column" gap="3" align="center">
        <AccountRecoveryForm
          title={t("title")}
          description={t("description")}
          labels={formLabels}
          hideRecoveryMethod
          loading={loading}
          error={error || undefined}
          successMessage={
            sentEmail ? t("successMessage", { email: sentEmail }) : undefined
          }
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
        <TurnstileWidget
          action="password_reset"
          resetKey={turnstileResetKey}
          onToken={setTurnstileToken}
        />
      </Flex>
    </AuthBackground>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<AuthSearchParamsFallback />}>
      <ForgotPasswordPageClient />
    </Suspense>
  );
}
