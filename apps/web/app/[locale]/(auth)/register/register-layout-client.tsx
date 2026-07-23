"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { hasApiSession } from "@/lib/auth/has-api-session";
import { RegisterSessionBanner } from "./register-session-banner";
import { RegisterStaleSessionGuard } from "./register-stale-session";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Box } from "@welpco/ui/box";
import { Container } from "@welpco/ui/container";
import { Flex } from "@welpco/ui/flex";
import { Progress } from "@welpco/ui/progress";
import { Text } from "@welpco/ui/text";
import { AuthBackground } from "@welpco/ui/platform/user-management";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { stripLocale } from "@/i18n/locale-routes";
import type { SelectedRole } from "@welpco/types";
import { RegisterEduContext } from "./register-edu-context";
import { RegisterEduPanel } from "./edu-panel/register-edu-panel";
import styles from "./register-layout.module.css";

function stripRegisterPath(pathname: string): string {
  return stripLocale(pathname);
}
import { useSignupState } from "@/lib/hooks/use-signup";

/** Matches BFF signup wizard length before role is picked. */
const WELPER_SIGNUP_STEP_TOTAL = 3;
const CUSTOMER_SIGNUP_STEP_TOTAL = 2;

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
  const { status, data: session } = useSession();
  const canResumeSignup = hasApiSession(status, session);
  const { data: state } = useSignupState();
  const pathname = usePathname() ?? "/";
  const t = useTranslations("auth.register.chrome");

  const registerPath = stripRegisterPath(pathname);
  const isCompletePage = registerPath === "/register/complete";
  const isFinishPage = registerPath === "/register/finish";
  const showProgressChrome =
    canResumeSignup && state && !isCompletePage && !isFinishPage;
  const showSessionBanner = canResumeSignup && !isCompletePage;

  // Educational side panel: shown on /register, /register/step/*, and
  // /register/finish; hidden on /register/complete (shell collapses back to
  // the single centered column).
  const showEduPanel = !isCompletePage;

  // Uncommitted role preview (select-role step click) — cleared once the
  // committed role lands in the signup state.
  const [previewRole, setPreviewRole] = useState<SelectedRole | null>(null);
  const committedRole = state?.selectedRole ?? null;
  useEffect(() => {
    if (committedRole) setPreviewRole(null);
  }, [committedRole]);
  const effectiveRole = previewRole ?? committedRole;
  const eduContextValue = useMemo(() => ({ setPreviewRole }), []);

  const { totalSteps, stepIndex, progressPct } = state
    ? signupProgressTotals(state)
    : { totalSteps: WELPER_SIGNUP_STEP_TOTAL, stepIndex: 1, progressPct: 0 };

  return (
    <RegisterEduContext.Provider value={eduContextValue}>
      <div
        className={
          showEduPanel ? `${styles.shell} ${styles.withPanel}` : styles.shell
        }
      >
        <div className={styles.formColumn}>
          <AuthBackground>
            <Container size="2" style={{ width: "100%" }}>
              <Flex direction="column" gap="5" style={{ width: "100%" }}>
                {showEduPanel ? (
                  <Box
                    mx="auto"
                    className={styles.compactSlot}
                    style={{ width: "100%", maxWidth: "560px" }}
                  >
                    <RegisterEduPanel role={effectiveRole} variant="compact" />
                  </Box>
                ) : null}
                <Box mx="auto" style={{ width: "100%", maxWidth: "560px" }}>
                  <RegisterStaleSessionGuard />
                </Box>
                {showSessionBanner ? (
                  <Box
                    mx="auto"
                    style={{ width: "100%", maxWidth: "560px" }}
                  >
                    <RegisterSessionBanner
                      subtitle={
                        showProgressChrome ? undefined : t("continuingSignup")
                      }
                    />
                  </Box>
                ) : null}
                {showProgressChrome ? (
                  <Box
                    mx="auto"
                    style={{
                      width: "100%",
                      maxWidth: "560px",
                    }}
                  >
                    <Text size="2" color="gray" weight="medium" mb="2" as="p">
                      {t("stepOf", { current: stepIndex, total: totalSteps })}
                    </Text>
                    {state ? (
                      <Progress
                        value={progressPct}
                        size="1"
                        color={SEMANTIC_COLOR.primary}
                        aria-label={t("signupProgressAria", {
                          percent: progressPct,
                        })}
                      />
                    ) : null}
                    <Text
                      size="1"
                      color="gray"
                      mt="2"
                      style={{ display: "block" }}
                    >
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
        </div>
        {showEduPanel ? (
          <div className={styles.panelColumn}>
            <RegisterEduPanel role={effectiveRole} variant="full" />
          </div>
        ) : null}
      </div>
    </RegisterEduContext.Provider>
  );
}
