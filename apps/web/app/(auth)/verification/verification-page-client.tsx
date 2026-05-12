"use client";

import { AuthBackground, AccountVerification } from "@welpco/ui/platform/user-management";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { verifyAccount, resendVerificationCode } from "@/lib/services/user-service";
import { useUserStore } from "@/stores/userStore";
import type { AccountVerificationValues } from "@welpco/ui/platform/user-management";
import { withNext } from "@/lib/auth/safe-next";

export default function VerificationPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update: updateSession } = useSession();
  const verificationEmail = useUserStore((state) => state.verificationEmail);
  const registrationData = useUserStore((state) => state.registrationData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const email = searchParams.get("email") || verificationEmail || registrationData?.email || "";
  const nextRaw = searchParams.get("next");

  const handleSubmit = async (values: AccountVerificationValues) => {
    if (!values.code) {
      setError("Enter the 6-digit code we sent you.");
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

      // Unified signup wizard (`/register`) replaces legacy onboarding-welcome.
      // Proxy sends incomplete signups to `/register` and completed users to `next` / dashboard.
      router.replace(withNext("/register", nextRaw));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "That code didn't work. It may have expired — request a new one and try again."
      );
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
      setError(
        err instanceof Error ? err.message : "We couldn't send a new code. Try again in a moment."
      );
    }
  };

  if (!email) {
    return null;
  }

  return (
    <AuthBackground>
      <AccountVerification
        email={email}
        loading={loading}
        error={error || undefined}
        onSubmit={handleSubmit}
        onResend={handleResend}
      />
    </AuthBackground>
  );
}
