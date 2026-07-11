"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { performClientSignOut } from "@/lib/auth/client-sign-out";
import { Box } from "@welpco/ui/box";
import { Button } from "@welpco/ui/button";
import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Link } from "@welpco/ui/link";
import { Text } from "@welpco/ui/text";
import { FORM_SPACING } from "@welpco/ui/tokens";
import { hasFrenchPrefix } from "@/i18n/locale-routes";
import { useAppRouter } from "@/lib/i18n/use-app-router";
import { useEffect, useRef } from "react";
import { useSignupState } from "@/lib/hooks/use-signup";

const CARD_STYLE = {
  width: "100%",
  maxWidth: "560px",
  minWidth: 0,
} as const;

export default function CompletePageClient() {
  const router = useAppRouter();
  const pathname = usePathname() ?? "/";
  const queryClient = useQueryClient();
  const { status, data: session, update: updateSession } = useSession();
  const { data: signupState } = useSignupState();
  const t = useTranslations("auth.register.complete");

  const loginCallback = hasFrenchPrefix(pathname) ? "/fr/login" : "/login";

  const signupCompleted =
    signupState?.signupCompleted ?? session?.user?.signupCompleted ?? false;

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated") {
      router.replace("/login");
      return;
    }
    if (!signupCompleted) {
      router.replace("/register");
      return;
    }
    router.replace("/dashboard");
  }, [status, signupCompleted, router]);

  const sessionSyncStartedRef = useRef(false);

  useEffect(() => {
    if (!signupCompleted || status !== "authenticated") return;
    if (sessionSyncStartedRef.current) return;

    if (session?.user?.signupCompleted === true) {
      return;
    }

    sessionSyncStartedRef.current = true;
    void updateSession({ user: { signupCompleted: true } });
  }, [
    signupCompleted,
    status,
    session?.user?.signupCompleted,
    updateSession,
  ]);

  const handleSignOut = () => {
    void performClientSignOut({ callbackUrl: loginCallback, queryClient });
  };

  if (status !== "authenticated" || !signupCompleted) {
    return null;
  }

  return (
    <Card size="4" variant="surface" style={CARD_STYLE}>
      <Flex direction="column" gap="4">
        <Box>
          <Heading as="h1" size="6" trim="start" mb={FORM_SPACING.titleGap}>
            {t("title")}
          </Heading>
          <Text size="2" color="gray" as="p">
            {t("intro")}
          </Text>
        </Box>

        <Box>
          <Text size="2" weight="bold" as="p" mb="2">
            {t("whatsNextTitle")}
          </Text>
          <Text size="2" color="gray" as="p">
            {t("whatsNextBody")}
          </Text>
        </Box>

        <Box>
          <Text size="2" color="gray" as="p">
            {t("feedbackPrefix")}{" "}
            <Link
              href={`mailto:${t("supportEmail")}`}
              size="2"
              weight="medium"
            >
              {t("supportEmail")}
            </Link>
            {t("feedbackSuffix")}
          </Text>
        </Box>

        <Text size="2" color="gray" as="p" style={{ whiteSpace: "pre-line" }}>
          {t("signOff")}
        </Text>

        <Flex justify="start" pt="2">
          <Button
            type="button"
            size="2"
            variant="outline"
            color="gray"
            onClick={handleSignOut}
          >
            {t("signOut")}
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}
