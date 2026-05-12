"use client";

import { AuthBackground, AccountRecoveryForm } from "@welpco/ui/platform/user-management";
import { AuthSearchParamsFallback } from "@/components/layout/auth-search-params-fallback";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { requestPasswordReset } from "@/lib/services/user-service";
import { useUserStore } from "@/stores/userStore";
import type { AccountRecoveryValues } from "@welpco/ui/platform/user-management";
import { withNext } from "@/lib/auth/safe-next";

function ForgotPasswordPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextRaw = searchParams.get("next");
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
      await requestPasswordReset({ email: values.email });
      setPasswordResetEmail(values.email);
      setPasswordResetSent(true);
      setSentEmail(values.email);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We couldn't send the reset link. Check the email and try again."
      );
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
        title="Forgot your password?"
        description="Enter the email on your account. We'll send you a link to set a new one."
        hideRecoveryMethod
        loading={loading}
        error={error || undefined}
        successMessage={
          sentEmail
            ? // Wave 2 (BFF): the API is enumeration-safe — it returns the same
              // 200 { ok: true } whether or not the email is on file. The copy
              // here mirrors that contract: "if an account exists, we sent a
              // link" rather than "we sent a reset link" (the latter would
              // confirm the account exists).
              `If an account exists for ${sentEmail}, we just sent a reset link. Check your inbox — the link expires in 15 minutes.`
            : undefined
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
