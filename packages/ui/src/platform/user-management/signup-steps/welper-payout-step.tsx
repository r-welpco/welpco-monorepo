"use client";

import { useState } from "react";
import { Box } from "@welpco/ui/box";
import { Button } from "@welpco/ui/button";
import { Callout } from "@welpco/ui/callout";
import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import type { SignupStateLite } from "./types";

/**
 * Day 15 — Phase 2 Dispatch B. Welper-only step 7 of the unified signup wizard.
 *
 * Two paths (XOR per the BFF DTO):
 *  1. "Set up payouts" — kicks off Stripe Connect onboarding. Currently a
 *     placeholder CTA: real Stripe Connect handoff lands in a follow-up
 *     dispatch (out-of-scope for this dispatch per the brief). The button is
 *     wired but disabled with "Coming soon" copy.
 *  2. "Skip for now" — submits `{ skip: true }`. The welper finishes the
 *     wizard but cannot receive payments until they finish payout setup from
 *     the dashboard. Surfaced honestly via a warning callout.
 *
 * The wizard does not block on Stripe success — bible §22.6 + the Phase 1
 * boundary. Welper just can't earn until payouts are configured.
 */

export interface WelperPayoutStepValues {
  stripeOnboardingCompleted?: boolean;
  skip?: boolean;
}

export interface WelperPayoutStepProps {
  state: SignupStateLite;
  loading?: boolean;
  error?: string | null;
  onSubmit: (values: WelperPayoutStepValues) => void | Promise<void>;
  onStripeOnboardingStart?: () => void;
  onBack?: () => void;
}

export function WelperPayoutStep({
  state: _state,
  loading,
  error,
  onSubmit,
  onStripeOnboardingStart,
  onBack,
}: WelperPayoutStepProps) {
  const [confirmingSkip, setConfirmingSkip] = useState(false);

  const handleSkip = async () => {
    await onSubmit({ skip: true });
  };

  const handleStripeStart = () => {
    if (onStripeOnboardingStart) {
      onStripeOnboardingStart();
    }
  };

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "640px", minWidth: 0 }}
    >
      <Flex direction="column" gap="5" style={{ minWidth: 0 }}>
        <Box>
          <Heading as="h1" size="6" trim="start" mb={FORM_SPACING.titleGap}>
            Set up your payouts
          </Heading>
          <Text size="2" color="gray">
            We use Stripe to send your earnings to your bank. The setup takes
            a couple of minutes — you&apos;ll need a piece of ID and your
            banking info handy.
          </Text>
        </Box>

        {error && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <Card variant="surface" size="3">
          <Flex direction="column" gap="3">
            <Box>
              <Heading as="h3" size="4" trim="start" mb="1">
                Connect with Stripe
              </Heading>
              <Text size="2" color="gray">
                Bank-grade identity and account verification, hosted by
                Stripe. Once it&apos;s done, you can accept paying bookings.
              </Text>
            </Box>
            <Button
              type="button"
              size="3"
              color={SEMANTIC_COLOR.primary}
              disabled={loading || !onStripeOnboardingStart}
              onClick={handleStripeStart}
              style={{ width: "100%" }}
            >
              {onStripeOnboardingStart
                ? "Set up payouts with Stripe"
                : "Stripe onboarding coming soon"}
            </Button>
            {!onStripeOnboardingStart && (
              <Text size="1" color="gray">
                Stripe Connect onboarding lands in a follow-up. For now, skip
                this step and finish payout setup from your dashboard once it
                ships.
              </Text>
            )}
          </Flex>
        </Card>

        {!confirmingSkip ? (
          <Box>
            <Button
              type="button"
              size="2"
              variant="ghost"
              color="gray"
              disabled={loading}
              onClick={() => setConfirmingSkip(true)}
            >
              Skip for now
            </Button>
          </Box>
        ) : (
          <Callout.Root color={SEMANTIC_COLOR.warning} variant="surface">
            <Callout.Text>
              <Text size="2" weight="bold" as="div" mb="1">
                Heads up
              </Text>
              <Text size="2" as="div">
                You won&apos;t be able to receive payments until you set up
                payouts. You can do this later from your profile.
              </Text>
            </Callout.Text>
            <Flex gap="2" mt={FORM_SPACING.fieldGap} wrap="wrap">
              <Button
                type="button"
                size="2"
                color={SEMANTIC_COLOR.primary}
                disabled={loading}
                onClick={handleSkip}
              >
                {loading ? "Saving..." : "Skip and continue"}
              </Button>
              <Button
                type="button"
                size="2"
                variant="soft"
                color="gray"
                disabled={loading}
                onClick={() => setConfirmingSkip(false)}
              >
                Go back
              </Button>
            </Flex>
          </Callout.Root>
        )}

        {onBack && (
          <Flex justify="start">
            <Button
              type="button"
              size="2"
              variant="ghost"
              color="gray"
              disabled={loading}
              onClick={onBack}
            >
              Back
            </Button>
          </Flex>
        )}
      </Flex>
    </Card>
  );
}
