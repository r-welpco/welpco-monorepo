"use client";

import { AuthBackground, AccountRecoveryForm } from "@welpco/ui/platform/user-management";
import { AuthSearchParamsFallback } from "@/components/layout/auth-search-params-fallback";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppRouter } from "@/lib/i18n/use-app-router";
import { useLocale, useTranslations } from "next-intl";
import { localeFromUseLocale } from "@/lib/i18n/app-locale";
import { requestPasswordReset } from "@/lib/services/user-service";
import { useUserStore } from "@/stores/userStore";
import type { AccountRecoveryValues } from "@welpco/ui/platform/user-management";
import { withNext } from "@/lib/auth/safe-next";

function ForgotPasswordPageClient() {
  const router = useAppRouter();
  const searchParams = useSearchParams();
  const nextRaw = searchParams.get("next");
  const uiLocale = useLocale();
  const t = useTranslations("auth.forgotPassword");
  const setPasswordResetEmail = useUserStore((state) => state.setPasswordResetEmail);
  const setPasswordResetSent = useUserStore((state) => state.setPasswordResetSent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentEmail, setSentEmail] = useState<string | null>(null);

  const handleSubmit = async (values: AccountRecoveryValues) => {
    setLoading(true);
    setError(null);
    setSentEmail(null);

    try {
      await requestPasswordReset({
        email: values.email,
        preferredLocale: localeFromUseLocale(uiLocale),
      });
      setPasswordResetEmail(values.email);
      setPasswordResetSent(true);
      setSentEmail(values.email);
    } catch (err) {
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
        hideRecoveryMethod
        loading={loading}
        error={error || undefined}
        successMessage={
          sentEmail ? t("successMessage", { email: sentEmail }) : undefined
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
