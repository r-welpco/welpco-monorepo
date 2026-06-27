"use client";

import { AuthBackground, AccountRecoveryForm } from "@welpco/ui/platform/user-management";
import { AuthSearchParamsFallback } from "@/components/layout/auth-search-params-fallback";
import { TurnstileWidget } from "@/components/security/turnstile-widget";
import { Suspense, useState } from "react";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
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
  const needsTurnstile = turnstileEnabled && !turnstileToken;

  const handleSubmit = async (values: AccountRecoveryValues) => {
    setError(null);
    setSentEmail(null);
    if (needsTurnstile) {
      setError(t("turnstileComplete"));
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
      setTurnstileToken(null);
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
        submitDisabled={needsTurnstile}
        submitTitle={needsTurnstile ? t("turnstileRequiredHint") : undefined}
        footer={
          turnstileEnabled ? (
            <Box style={{ width: "100%", minHeight: 65 }}>
              <Text size="1" color="gray" as="p" mb="2">
                {t("turnstileRequiredHint")}
              </Text>
              <TurnstileWidget
                action="password_reset"
                resetKey={turnstileResetKey}
                onToken={setTurnstileToken}
                loadErrorMessage={t("turnstileLoadFailed")}
              />
            </Box>
          ) : undefined
        }
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
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
