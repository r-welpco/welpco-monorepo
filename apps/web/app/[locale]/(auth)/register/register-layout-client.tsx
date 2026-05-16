"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { performClientSignOut } from "@/lib/auth/client-sign-out";
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
import { hasFrenchPrefix, stripLocale } from "@/i18n/locale-routes";

function stripRegisterPath(pathname: string): string {
  return stripLocale(pathname);
}
import { useSignupState } from "@/lib/hooks/use-signup";

/** Matches BFF `WELPER_REQUIRED_STEPS` length — used for progress chrome before role is picked. */
const WELPER_SIGNUP_STEP_TOTAL = 9;

function signupProgressTotals(state: {
  selectedRole: string | null;
  requiredSteps: unknown[];
  completedSteps: unknown[];
}): { totalSteps: number; stepIndex: number; progressPct: number } {
  const totalSteps = state.selectedRole
    ? state.requiredSteps.length
    : WELPER_SIGNUP_STEP_TOTAL;
  const stepIndex = Math.min(state.completedSteps.length + 1, totalSteps);
  const progressPct = Math.round(
    (state.completedSteps.length / Math.max(totalSteps, 1)) * 100,
  );
  return { totalSteps, stepIndex, progressPct };
}

export default function RegisterLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const { data: state } = useSignupState();
  const pathname = usePathname() ?? "/";
  const t = useTranslations("auth.register.chrome");

  const isCompletePage = stripRegisterPath(pathname) === "/register/complete";
  const showProgressChrome = isAuthenticated && state && !isCompletePage;

  const { totalSteps, stepIndex, progressPct } = state
    ? signupProgressTotals(state)
    : { totalSteps: WELPER_SIGNUP_STEP_TOTAL, stepIndex: 1, progressPct: 0 };

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
                      await performClientSignOut({
                        callbackUrl: loginCallback,
                        queryClient,
                      });
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
