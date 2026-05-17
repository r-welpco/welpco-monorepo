"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { SessionAccountBanner } from "@/lib/auth/session-account-banner";
import { hasApiSession } from "@/lib/auth/has-api-session";
import { hasPlatformAccess } from "@/lib/auth/platform-access";
import { safeNextPath, withNext } from "@/lib/auth/safe-next";
import { Button } from "@welpco/ui/button";
import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { FORM_SPACING } from "@welpco/ui/tokens";

const CARD_STYLE = {
  width: "100%",
  maxWidth: "480px",
  minWidth: 0,
} as const;

type LoginAlreadySignedInProps = {
  nextRaw: string | null;
};

export function LoginAlreadySignedIn({ nextRaw }: LoginAlreadySignedInProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const t = useTranslations("auth.login");

  if (!hasApiSession(status, session)) {
    return null;
  }

  const email = session?.user?.email?.trim() ?? "";
  const signupCompleted =
    session?.user?.signupCompleted ??
    session?.user?.onboardingCompleted ??
    false;
  const nextPath = safeNextPath(nextRaw, "/dashboard");

  const primaryAction = () => {
    if (!signupCompleted) {
      router.push(withNext("/register", nextRaw));
      return;
    }
    if (!hasPlatformAccess({ signupCompleted: true })) {
      router.push("/register/complete");
      return;
    }
    router.push(nextPath);
  };

  const primaryLabel = !signupCompleted
    ? t("continueSignup")
    : !hasPlatformAccess({ signupCompleted: true })
      ? t("viewLaunchStatus")
      : t("goToDashboard");

  return (
    <Card size="4" variant="surface" style={CARD_STYLE}>
      <Flex direction="column" gap="4">
        <Heading as="h1" size="6" trim="start" mb={FORM_SPACING.titleGap}>
          {t("alreadySignedInTitle")}
        </Heading>
        <SessionAccountBanner
          signedInAsLabel={t("signedInAs", { email })}
          useAnotherAccountLabel={t("useAnotherAccount")}
          subtitle={t("alreadySignedInHint")}
          signOutCallbackUrl="/login"
        />
        <Button size="3" onClick={primaryAction}>
          {primaryLabel}
        </Button>
      </Flex>
    </Card>
  );
}
