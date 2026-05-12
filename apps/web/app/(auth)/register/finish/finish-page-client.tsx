"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
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

/**
 * Day 15 — Phase 2 Dispatch A. Calls `useFinishSignup()` once on mount and
 * routes to the post-signup destination on success. If the BFF reports
 * `INCOMPLETE_SIGNUP` (422), surfaces the structured `missingFields` list
 * with a "Continue setup" button back into the wizard.
 */
export default function FinishPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextRaw = searchParams.get("next");
  const { update: updateSession } = useSession();

  const finish = useFinishSignup();
  const [missingFields, setMissingFields] = useState<string[] | null>(null);
  const [resumeStep, setResumeStep] = useState<SignupStepName | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fired = useRef(false);

  useEffect(() => {
    // Strict mode invokes effects twice in development; the ref keeps the BFF
    // call honest as a one-shot.
    if (fired.current) return;
    fired.current = true;

    void (async () => {
      try {
        await finish.mutateAsync();
        // Refresh the NextAuth session so the JWT picks up the new
        // `signupCompleted: true`. Without this, `proxy.ts`'s 4-state machine
        // reads the stale token, sees signupCompleted=false, and bounces the
        // user back to /register — looping until the JWT naturally rolls.
        await updateSession({ user: { signupCompleted: true } });
        router.replace(safeNextPath(nextRaw, "/dashboard"));
      } catch (err) {
        if (err instanceof ApiClientError && err.code === "INCOMPLETE_SIGNUP") {
          // The BFF returns the structured shape; the api client only carries
          // message + code, so we surface what we can. The cause-prone fields
          // travel through a separate channel: a type-narrowed parse below.
          const body = (err as unknown as { body?: IncompleteSignupErrorBody })
            .body;
          setMissingFields(body?.missingFields ?? []);
          setResumeStep(body?.nextStep ?? null);
          return;
        }
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "We couldn't finish your signup. Try again in a moment.",
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
            Almost there
          </Heading>
          <Text size="2" color="gray">
            We need a couple more details before your account&apos;s ready.
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
              The following are still missing:{" "}
              {missingFields.join(", ")}.
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
            Continue setup
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}
