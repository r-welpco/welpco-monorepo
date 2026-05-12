"use client";

import { Button } from "@welpco/ui/button";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";

export interface WelcomeStepProps {
  accountType: "customer" | "welper";
  onNext?: () => void;
  onSkip?: () => void | Promise<void>;
}

export function WelcomeStep({
  accountType,
  onNext,
  onSkip,
}: WelcomeStepProps) {
  return (
    <Flex direction="column" gap="5" align="center">
      <Box>
        <Heading size="7" trim="start" mb="3" align="center">
          Welcome to Welpco!
        </Heading>
        <Text size="2" color="gray" align="center" highContrast as="div">
          {accountType === "customer"
            ? "Let's set up your account so you can start booking services from trusted Welpers in your area."
            : "Let's set up your Welper profile so customers can find and book your services."}
        </Text>
      </Box>

      <Box>
        <Text size="2" weight="bold" mb="2">
          What we'll set up:
        </Text>
        <Flex direction="column" gap="2" align="start">
          <Text size="2" color="gray" highContrast>
            • Basic profile information
          </Text>
          {accountType === "customer" && (
            <Text size="2" color="gray" highContrast>
              • Your preferences
            </Text>
          )}
        </Flex>
      </Box>

      <Flex
        gap="2"
        justify="end"
        wrap="wrap"
        direction={{ initial: "column", sm: "row" }}
        style={{ width: "100%" }}
      >
        {onSkip && (
          <Button
            type="button"
            variant="ghost"
            color="gray"
            size="2"
            onClick={() => onSkip?.()}
            style={{ flex: 1, width: "100%", minWidth: 0 }}
          >
            Skip for now
          </Button>
        )}
        <Button
          color={SEMANTIC_COLOR.primary}
          size="2"
          onClick={onNext}
          style={{ flex: 1, width: "100%", minWidth: 0 }}
        >
          Get started
        </Button>
      </Flex>
    </Flex>
  );
}

