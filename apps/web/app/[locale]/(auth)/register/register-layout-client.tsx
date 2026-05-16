"use client";

import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Box } from "@welpco/ui/box";
import { Container } from "@welpco/ui/container";
import { Flex } from "@welpco/ui/flex";
import { Link } from "@welpco/ui/link";
import { Progress } from "@welpco/ui/progress";
import { Text } from "@welpco/ui/text";
import { AuthBackground } from "@welpco/ui/platform/user-management";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { hasFrenchPrefix } from "@/i18n/locale-routes";
import { useSignupState } from "@/lib/hooks/use-signup";

export default function RegisterLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const { data: state } = useSignupState();
  const pathname = usePathname() ?? "/";
  const t = useTranslations("auth.register.chrome");

  const showProgressChrome = isAuthenticated && state;

  const totalSteps = state?.requiredSteps?.length ?? 7;
  const stepIndex = state
    ? Math.min(state.completedSteps.length + 1, totalSteps)
    : 1;
  const progressPct = state
    ? Math.round((state.completedSteps.length / Math.max(totalSteps, 1)) * 100)
    : 0;

  const loginCallback = hasFrenchPrefix(pathname) ? "/fr/login" : "/login";

  return (
    <AuthBackground>
      <Container size="2" style={{ width: "100%" }}>
        <Flex direction="column" gap="5" style={{ width: "100%" }}>
          {showProgressChrome ? (
            <Box
              mx="auto"
              style={{
                width: "100%",
                maxWidth: "560px",
              }}
            >
              <Flex
                direction={{ initial: "column", sm: "row" }}
                gap="2"
                align={{ initial: "stretch", sm: "center" }}
                justify="between"
                mb="2"
              >
                <Text size="2" color="gray" weight="medium">
                  {t("stepOf", { current: stepIndex, total: totalSteps })}
                </Text>
                {isAuthenticated && (
                  <Link
                    size="2"
                    weight="medium"
                    href="#"
                    onClick={async (e) => {
                      e.preventDefault();
                      await signOut({ callbackUrl: loginCallback });
                    }}
                    style={{ cursor: "pointer" }}
                    aria-label={t("saveAndContinueLaterAria")}
                  >
                    {t("saveAndContinueLater")}
                  </Link>
                )}
              </Flex>
              {state ? (
                <Progress
                  value={progressPct}
                  size="1"
                  color={SEMANTIC_COLOR.primary}
                  aria-label={t("signupProgressAria", { percent: progressPct })}
                />
              ) : null}
              <Text size="1" color="gray" mt="2" style={{ display: "block" }}>
                {t("progressSavedHint")}
              </Text>
            </Box>
          ) : null}

          <Flex justify="center" style={{ width: "100%" }}>
            {children}
          </Flex>
        </Flex>
      </Container>
    </AuthBackground>
  );
}
