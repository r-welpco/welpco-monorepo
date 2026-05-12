"use client";

import { Button } from "@welpco/ui/button";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Callout } from "@welpco/ui/callout";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";

export interface SetupCompletionStepProps {
  accountType: "customer" | "welper";
  onComplete?: () => void | Promise<void>;
}

export function SetupCompletionStep({
  accountType,
  onComplete,
}: SetupCompletionStepProps) {
  return (
    <Flex
      direction="column"
      gap="5"
      align="center"
      style={{ minWidth: 0 }}
    >
      <Box>
        <Heading size="7" trim="start" mb="3" align="center">
          <span aria-hidden="true">🎉 </span>
          You&rsquo;re all set!
        </Heading>
        <Text size="2" color="gray" align="center" highContrast as="div">
          {accountType === "customer"
            ? "Your account is ready. Start exploring and booking services from trusted Welpers."
            : "Your Welper profile is set up. You're ready to start receiving bookings."}
        </Text>
      </Box>

      <Callout.Root color={SEMANTIC_COLOR.success} variant="surface">
        <Callout.Text>
          {accountType === "customer"
            ? "You can now browse services and make your first booking."
            : "Head to your dashboard to complete your profile, add services, and start welping."}
        </Callout.Text>
      </Callout.Root>

      <Box style={{ width: "100%" }}>
        <Button
          color={SEMANTIC_COLOR.primary}
          size="2"
          onClick={onComplete}
          style={{ width: "100%" }}
        >
          Go to dashboard
        </Button>
      </Box>
    </Flex>
  );
}

