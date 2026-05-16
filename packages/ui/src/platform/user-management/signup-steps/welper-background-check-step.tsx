"use client";

import { useCallback } from "react";
import { Box } from "@welpco/ui/box";
import { Button } from "@welpco/ui/button";
import { Callout } from "@welpco/ui/callout";
import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import {
  DEFAULT_WELPER_BACKGROUND_CHECK_LABELS,
  type WelperBackgroundCheckStepLabels,
} from "./labels";
import { SIGNUP_STEP_CARD_STYLE, type SignupStateLite } from "./types";

export interface WelperBackgroundCheckStepProps {
  state: SignupStateLite;
  loading?: boolean;
  error?: string | null;
  labels?: WelperBackgroundCheckStepLabels;
  pricingLoading?: boolean;
  listPriceCents?: number;
  promoPriceCents?: number;
  promoEnabled?: boolean;
  paymentStatus?: string | null;
  certnStatus?: string | null;
  certnApplicantUrl?: string | null;
  certnInviteSentViaEmail?: boolean;
  certnInviteReady?: boolean;
  failureReason?: string | null;
  signupStepComplete?: boolean;
  onPay: () => void | Promise<void>;
  onContinue: () => void | Promise<void>;
  onRetryInvite?: () => void | Promise<void>;
  onBack?: () => void;
  /** Parent sets true while syncing Stripe return (confirm-return). */
  confirmingReturn?: boolean;
}

function formatCad(cents: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}

function formatLabel(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
    template,
  );
}

export function WelperBackgroundCheckStep({
  state,
  loading,
  error,
  labels: labelsProp,
  pricingLoading,
  listPriceCents = 2599,
  promoPriceCents = 1599,
  promoEnabled = true,
  paymentStatus,
  certnStatus,
  certnApplicantUrl,
  certnInviteSentViaEmail,
  certnInviteReady,
  failureReason,
  signupStepComplete,
  onPay,
  onContinue,
  onRetryInvite,
  onBack,
  confirmingReturn,
}: WelperBackgroundCheckStepProps) {
  const labels = labelsProp ?? DEFAULT_WELPER_BACKGROUND_CHECK_LABELS;

  const filled = state.filledData.welperBackgroundCheck as
    | { skipped?: boolean }
    | undefined;

  const paid =
    paymentStatus === "paid" ||
    (filled && "paid" in filled && (filled as { paid?: boolean }).paid === true);

  const chargeCents = promoEnabled ? promoPriceCents : listPriceCents;
  const busy = loading || confirmingReturn || pricingLoading;

  const handleContinue = useCallback(async () => {
    await onContinue();
  }, [onContinue]);

  if (filled?.skipped) {
    return (
      <Card size="4" variant="surface" style={SIGNUP_STEP_CARD_STYLE}>
        <Flex direction="column" gap="4">
          <Heading as="h1" size="6">
            {labels.title}
          </Heading>
          <Text size="2" color="gray">
            {labels.under18Description}
          </Text>
          <Button size="3" onClick={() => void handleContinue()} disabled={busy}>
            {labels.continue}
          </Button>
        </Flex>
      </Card>
    );
  }

  return (
    <Card size="4" variant="surface" style={SIGNUP_STEP_CARD_STYLE}>
      <Flex direction="column" gap="4">
        <Box>
          <Heading as="h1" size="6" trim="start" mb={FORM_SPACING.titleGap}>
            {labels.title}
          </Heading>
          <Text size="2" color="gray">
            {labels.description}
          </Text>
        </Box>

        <Box>
          {promoEnabled ? (
            <Flex align="baseline" gap="2" wrap="wrap">
              <Text size="2" color="gray" style={{ textDecoration: "line-through" }}>
                {formatCad(listPriceCents)}
              </Text>
              <Text size="8" weight="bold">
                {formatCad(promoPriceCents)}
              </Text>
              <Text size="2" color="green">
                {labels.limitedTimeRate}
              </Text>
            </Flex>
          ) : (
            <Text size="8" weight="bold">
              {formatCad(listPriceCents)}
            </Text>
          )}
        </Box>

        {error ? (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        ) : null}

        {paid ? (
          <Callout.Root color="green" variant="surface">
            <Callout.Text>
              {labels.paymentReceivedPrefix}{" "}
              {certnInviteReady
                ? labels.paymentInviteReady
                : failureReason
                  ? labels.paymentFailureStart
                  : labels.paymentInvitePending}
            </Callout.Text>
          </Callout.Root>
        ) : null}

        {paid && failureReason && !signupStepComplete ? (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
            <Callout.Text>
              {failureReason === "missing_profile"
                ? labels.failureMissingProfile
                : failureReason.startsWith("certn_invite_failed:")
                  ? formatLabel(labels.failureCertnFailed, {
                      detail: failureReason.replace("certn_invite_failed:", "").trim(),
                    })
                  : labels.failureGeneric}
            </Callout.Text>
          </Callout.Root>
        ) : null}

        {certnApplicantUrl ? (
          <Button size="3" variant="soft" asChild>
            <a href={certnApplicantUrl} target="_blank" rel="noopener noreferrer">
              {labels.openCertnVerification}
            </a>
          </Button>
        ) : null}

        {paid && certnInviteSentViaEmail && !certnApplicantUrl ? (
          <Callout.Root color="blue" variant="surface">
            <Callout.Text>{labels.certnEmailInvite}</Callout.Text>
          </Callout.Root>
        ) : null}

        <Flex direction="column" gap="2">
          {!paid ? (
            <Button size="3" onClick={() => void onPay()} disabled={busy}>
              {busy
                ? labels.saving
                : formatLabel(labels.payAndContinue, {
                    amount: formatCad(chargeCents),
                  })}
            </Button>
          ) : (
            <>
              {paid && !certnInviteReady && onRetryInvite ? (
                <Button
                  size="3"
                  variant="soft"
                  onClick={() => void onRetryInvite()}
                  disabled={busy}
                >
                  {busy ? labels.saving : labels.startCertnVerification}
                </Button>
              ) : null}
              <Button
                size="3"
                onClick={() => void handleContinue()}
                disabled={busy || !signupStepComplete}
              >
                {labels.continue}
              </Button>
            </>
          )}
          {onBack ? (
            <Button size="2" variant="ghost" onClick={onBack} disabled={busy}>
              {labels.back}
            </Button>
          ) : null}
        </Flex>

        <Text size="1" color="gray">
          {labels.footer}
        </Text>
      </Flex>
    </Card>
  );
}
