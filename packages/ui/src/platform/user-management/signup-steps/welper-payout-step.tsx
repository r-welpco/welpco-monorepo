"use client";

import { Box } from "@welpco/ui/box";
import { Button } from "@welpco/ui/button";
import { Callout } from "@welpco/ui/callout";
import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import {
  DEFAULT_WELPER_PAYOUT_LABELS,
  type WelperPayoutStepLabels,
} from "./labels";
import { SIGNUP_STEP_CARD_STYLE, type SignupStateLite } from "./types";

export interface WelperPayoutStepValues {
  stripeOnboardingCompleted: true;
}

export interface WelperPayoutStepProps {
  state: SignupStateLite;
  loading?: boolean;
  error?: string | null;
  labels?: WelperPayoutStepLabels;
  connectLoading?: boolean;
  onboardingComplete?: boolean;
  /** When false (dashboard profile), connected state shows success only — no Continue. Default true. */
  showContinueWhenConnected?: boolean;
  onSubmit: (values: WelperPayoutStepValues) => void | Promise<void>;
  onStripeOnboardingStart?: () => void | Promise<void>;
  onBack?: () => void;
}

export function WelperPayoutStep({
  state: _state,
  loading,
  error,
  labels: labelsProp,
  connectLoading,
  onboardingComplete,
  showContinueWhenConnected = true,
  onSubmit,
  onStripeOnboardingStart,
  onBack,
}: WelperPayoutStepProps) {
  const labels = labelsProp ?? DEFAULT_WELPER_PAYOUT_LABELS;
  const busy = loading || connectLoading;

  const handleContinue = async () => {
    await onSubmit({ stripeOnboardingCompleted: true });
  };

  return (
    <Card size="4" variant="surface" style={SIGNUP_STEP_CARD_STYLE}>
      <Flex direction="column" gap="5" style={{ minWidth: 0 }}>
        <Box>
          <Heading as="h1" size="6" trim="start" mb={FORM_SPACING.titleGap}>
            {labels.title}
          </Heading>
          <Text size="2" color="gray">
            {onboardingComplete ? labels.successDescription : labels.description}
          </Text>
        </Box>

        {error ? (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        ) : null}

        {onboardingComplete ? (
          showContinueWhenConnected ? (
            <Button
              type="button"
              size="3"
              color={SEMANTIC_COLOR.primary}
              disabled={busy}
              onClick={() => void handleContinue()}
              style={{ width: "100%" }}
            >
              {loading ? labels.saving : labels.continue}
            </Button>
          ) : (
            <Callout.Root color={SEMANTIC_COLOR.success} variant="surface" role="status">
              <Callout.Text>{labels.successDescription}</Callout.Text>
            </Callout.Root>
          )
        ) : (
          <Card variant="surface" size="3">
            <Flex direction="column" gap="3">
              <Box>
                <Heading as="h3" size="4" trim="start" mb="1">
                  {labels.connectTitle}
                </Heading>
                <Text size="2" color="gray">
                  {labels.connectDescription}
                </Text>
              </Box>
              <Button
                type="button"
                size="3"
                color={SEMANTIC_COLOR.primary}
                disabled={busy || !onStripeOnboardingStart}
                onClick={() => void onStripeOnboardingStart?.()}
                style={{ width: "100%" }}
              >
                {connectLoading ? labels.connectInProgress : labels.connectCta}
              </Button>
            </Flex>
          </Card>
        )}

        {onBack ? (
          <Flex justify="start">
            <Button
              type="button"
              size="2"
              variant="ghost"
              color="gray"
              disabled={busy}
              onClick={onBack}
            >
              {labels.back}
            </Button>
          </Flex>
        ) : null}
      </Flex>
    </Card>
  );
}
