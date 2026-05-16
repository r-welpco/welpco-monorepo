"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Flex } from "@welpco/ui/flex";
import { Spinner } from "@welpco/ui/spinner";
import { EmailPasswordStep } from "@welpco/ui/platform/user-management";
import { stepNameToSlug } from "./step-name-utils";
import { useBeginSignup, useSignupState } from "@/lib/hooks/use-signup";
import { ApiClientError } from "@/lib/api/client";
import { postSignupDestination } from "@/lib/auth/platform-access";
import { safeNextPath, withNext } from "@/lib/auth/safe-next";
import { useEmailPasswordStepLabels } from "@/lib/i18n/use-auth-labels";

export default function RegisterPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextRaw = searchParams.get("next");
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const labels = useEmailPasswordStepLabels();
  const t = useTranslations("auth.register.begin");

  const beginSignup = useBeginSignup();
  const { data: state, isFetching } = useSignupState();

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !state) return;
    if (state.signupCompleted) {
      router.replace(
        postSignupDestination({
          signupCompleted: true,
          platformAccessEnabled: state.platformAccessEnabled,
        }) === "/dashboard"
          ? safeNextPath(nextRaw, "/dashboard")
          : "/register/complete",
      );
      return;
    }
    if (state.nextStep) {
      router.replace(`/register/step/${stepNameToSlug(state.nextStep)}`);
    }
  }, [isAuthenticated, state, router, nextRaw]);

  const handleBegin = async (values: { email: string; password: string }) => {
    setError(null);
    try {
      await beginSignup.mutateAsync(values);
    } catch (err) {
      if (err instanceof ApiClientError && err.code === "ACCOUNT_EXISTS") {
        setError(t("errors.accountExists"));
        return;
      }
      const message =
        err instanceof Error ? err.message : t("errors.createFailed");
      setError(message);
    }
  };

  if (isAuthenticated) {
    return (
      <Flex
        justify="center"
        align="center"
        style={{ minHeight: "40vh" }}
        aria-busy={isFetching}
      >
        <Spinner size="3" />
      </Flex>
    );
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
