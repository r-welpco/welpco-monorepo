"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppRouter } from "@/lib/i18n/use-app-router";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Box } from "@welpco/ui/box";
import { Button } from "@welpco/ui/button";
import { Card } from "@welpco/ui/card";
import { Callout } from "@welpco/ui/callout";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Spinner } from "@welpco/ui/spinner";
import { Text } from "@welpco/ui/text";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { ApiClientError } from "@/lib/api/client";
import { completeSignupAndRedirect } from "@/lib/auth/complete-signup-and-redirect";
import { refreshBffTokensInSession } from "@/lib/auth/refresh-session-tokens";
import { roleFromSelectedRole } from "@/lib/auth/session-role";
import { clearTokenCache } from "@/lib/api/get-token";
import { safeNextPath } from "@/lib/auth/safe-next";
import {
  getWelperRegisterEscapeTarget,
  isOnlyDeferredSetupMissing,
  stepNameToSlug,
} from "../step-name-utils";
import { useSignupState } from "@/lib/hooks/use-signup";
import type { IncompleteSignupErrorBody } from "@welpco/types";

export default function FinishPageClient() {
  const router = useAppRouter();
  const searchParams = useSearchParams();
  const nextRaw = searchParams.get("next");
  const { update: updateSession } = useSession();
  const t = useTranslations("auth.register.finish");
  const { data: signupState, isPending: stateLoading } = useSignupState();

  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const autoStarted = useRef(false);

  const goToDashboard = useCallback(async () => {
    setBusy(true);
    setErrorMessage(null);
    try {
      await completeSignupAndRedirect({
        nextRaw,
        updateSession,
        router,
      });
    } catch (err) {
      if (err instanceof ApiClientError && err.code === "INCOMPLETE_SIGNUP") {
        const body = err.body as IncompleteSignupErrorBody | undefined;
        if (isOnlyDeferredSetupMissing(body?.missingFields)) {
          setErrorMessage(t("errors.restartServer"));
          setBusy(false);
          return;
        }
        if (body?.nextStep) {
          router.replace(`/register/step/${stepNameToSlug(body.nextStep)}`);
          return;
        }
        setErrorMessage(t("errors.finishFailed"));
        setBusy(false);
        return;
      }
      setErrorMessage(
        err instanceof Error ? err.message : t("errors.finishFailed"),
      );
      setBusy(false);
    }
  }, [nextRaw, router, t, updateSession]);

  useEffect(() => {
    if (stateLoading || !signupState || autoStarted.current) return;
    if (signupState.signupCompleted) {
      autoStarted.current = true;
      void (async () => {
        const role = roleFromSelectedRole(signupState.selectedRole);
        if (role) {
          await updateSession({ user: { signupCompleted: true, role } });
          await refreshBffTokensInSession(updateSession);
          clearTokenCache();
          router.refresh?.();
        }
        router.replace(safeNextPath(nextRaw, "/dashboard"));
      })();
      return;
    }
    const welperEscape =
      getWelperRegisterEscapeTarget(signupState, null) === "dashboard";
    if (!welperEscape && signupState.nextStep) {
      router.replace(
        `/register/step/${stepNameToSlug(signupState.nextStep)}`,
      );
      return;
    }
    autoStarted.current = true;
    void goToDashboard();
  }, [signupState, stateLoading, router, goToDashboard, nextRaw, updateSession]);

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "560px", minWidth: 0 }}
    >
      <Flex direction="column" gap="4">
        <Box>
          <Heading as="h1" size="6" trim="start" mb={FORM_SPACING.titleGap}>
            {t("title")}
          </Heading>
          <Text size="2" color="gray">
            {t("description")}
          </Text>
        </Box>

        {errorMessage && (
          <Callout.Root
            color={SEMANTIC_COLOR.danger}
            variant="surface"
            role="alert"
          >
            <Callout.Text>{errorMessage}</Callout.Text>
          </Callout.Root>
        )}

        <Button
          type="button"
          size="3"
          color={SEMANTIC_COLOR.primary}
          style={{ width: "100%" }}
          disabled={busy || stateLoading}
          onClick={() => void goToDashboard()}
        >
          {busy || stateLoading ? (
            <Flex align="center" justify="center" gap="2">
              <Spinner size="2" />
              <span>{t("continuing")}</span>
            </Flex>
          ) : (
            t("continueToDashboard")
          )}
        </Button>
      </Flex>
    </Card>
  );
}
