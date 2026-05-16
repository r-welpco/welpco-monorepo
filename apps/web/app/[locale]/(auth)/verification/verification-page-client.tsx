"use client";

import { AuthBackground, AccountVerification } from "@welpco/ui/platform/user-management";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { verifyAccount, resendVerificationCode } from "@/lib/services/user-service";
import { useUserStore } from "@/stores/userStore";
import type { AccountVerificationValues } from "@welpco/ui/platform/user-management";
import { withNext } from "@/lib/auth/safe-next";
import { useAccountVerificationLabels } from "@/lib/i18n/use-auth-labels";

export default function VerificationPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update: updateSession } = useSession();
  const labels = useAccountVerificationLabels();
  const t = useTranslations("auth.verification");
  const verificationEmail = useUserStore((state) => state.verificationEmail);
  const registrationData = useUserStore((state) => state.registrationData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const email = searchParams.get("email") || verificationEmail || registrationData?.email || "";
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

      router.replace(withNext("/register", nextRaw));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.verifyFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;

    setError(null);

    try {
      await resendVerificationCode(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.resendFailed"));
    }
  };

  if (!email) {
    return null;
  }

  return (
    <AuthBackground>
      <AccountVerification
        labels={labels}
        email={email}
        loading={loading}
        error={error || undefined}
        onSubmit={handleSubmit}
        onResend={handleResend}
      />
    </AuthBackground>
  );
}
