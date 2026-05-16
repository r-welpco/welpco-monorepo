"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
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
import { useFinishSignup } from "@/lib/hooks/use-signup";
import { ApiClientError } from "@/lib/api/client";
import { stepNameToSlug } from "../step-name-utils";
import { safeNextPath } from "@/lib/auth/safe-next";
import type {
  IncompleteSignupErrorBody,
  SignupStepName,
} from "@welpco/types";

const SIGNUP_STEP_LABEL_KEYS = [
  "selectRole",
  "identity",
  "welperBio",
  "welperServiceArea",
  "welperOffering",
  "welperAvailability",
  "welperBackgroundCheck",
  "welperPayout",
  "optionalProfile",
] as const satisfies readonly SignupStepName[];

export default function FinishPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextRaw = searchParams.get("next");
  const { update: updateSession } = useSession();
  const t = useTranslations("auth.register.finish");
  const tStepLabels = useTranslations("auth.register.steps.page.labels");

  const finish = useFinishSignup();
  const [missingFields, setMissingFields] = useState<string[] | null>(null);
  const [resumeStep, setResumeStep] = useState<SignupStepName | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    void (async () => {
      try {
        const finalState = await finish.mutateAsync();
        await updateSession({
          user: {
            signupCompleted: true,
            role: finalState.selectedRole === "welper" ? "welper" : "customer",
          },
        });
        router.replace(safeNextPath(nextRaw, "/dashboard"));
      } catch (err) {
        if (err instanceof ApiClientError && err.code === "INCOMPLETE_SIGNUP") {
          const body = (err as unknown as { body?: IncompleteSignupErrorBody })
            .body;
          setMissingFields(body?.missingFields ?? []);
          setResumeStep(body?.nextStep ?? null);
          return;
        }
        setErrorMessage(
          err instanceof Error ? err.message : t("errors.finishFailed"),
        );
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!missingFields && !errorMessage) {
    return (
      <Flex
        justify="center"
        align="center"
        style={{ minHeight: "40vh" }}
        aria-busy
      >
        <Spinner size="3" />
      </Flex>
    );
  }

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
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
            <Callout.Text>{errorMessage}</Callout.Text>
          </Callout.Root>
        )}

        {missingFields && missingFields.length > 0 && (
          <Callout.Root color={SEMANTIC_COLOR.warning} variant="surface" role="alert">
            <Callout.Text>
              {t("missingFieldsPrefix")}{" "}
              {missingFields
                .map((field) => {
                  if (
                    SIGNUP_STEP_LABEL_KEYS.includes(field as SignupStepName)
                  ) {
                    return tStepLabels(field as (typeof SIGNUP_STEP_LABEL_KEYS)[number]);
                  }
                  return field;
                })
                .join(", ")}
              .
            </Callout.Text>
          </Callout.Root>
        )}

        <Flex direction={{ initial: "column", sm: "row-reverse" }} gap="3">
          <Button
            type="button"
            size="3"
            color={SEMANTIC_COLOR.primary}
            style={{ width: "100%" }}
            onClick={() => {
              if (resumeStep) {
                router.replace(`/register/step/${stepNameToSlug(resumeStep)}`);
              } else {
                router.replace("/register");
              }
            }}
          >
            {t("continueSetup")}
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}
