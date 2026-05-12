"use client";

import { Button } from "@welpco/ui/button";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Callout } from "@welpco/ui/callout";
import { Badge } from "@welpco/ui/badge";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";

export interface VerificationReminderStepProps {
  email?: string;
  onNext?: () => void;
  onBack?: () => void;
  onResend?: () => void | Promise<void>;
  isVerified?: boolean;
}

export function VerificationReminderStep({
  email,
  onNext,
  onBack,
  onResend,
  isVerified = false,
}: VerificationReminderStepProps) {
  return (
    <Flex direction="column" gap="5" style={{ minWidth: 0 }}>
      <Box>
        <Heading as="h3" size="3" mb="3" trim="start">
          Verify your email
        </Heading>
        <Text size="2" color="gray" highContrast>
          {isVerified
            ? "Your email has been verified!"
            : "We've sent a verification email to your inbox."}
        </Text>
      </Box>

      {email && (
        <Box>
          <Text size="2" weight="bold" mb="2">
            Email address
          </Text>
          <Badge color="gray" variant="soft" size="2">
            {email}
          </Badge>
        </Box>
      )}

      {isVerified ? (
        <Callout.Root color={SEMANTIC_COLOR.success} variant="surface">
          <Callout.Text>
            Your email has been verified. You can now access all platform
            features.
          </Callout.Text>
        </Callout.Root>
      ) : (
        <Callout.Root color={SEMANTIC_COLOR.info} variant="surface">
          <Callout.Text>
            Please check your email and click the verification link. If you
            don't see it, check your spam folder.
          </Callout.Text>
        </Callout.Root>
      )}

      {!isVerified && onResend && (
        <Box>
          <Text size="2" color="gray" mb="2" highContrast>
            Didn't receive the email?
          </Text>
          <Button
            variant="ghost"
            color="gray"
            size="2"
            onClick={onResend}
          >
            Resend verification email
          </Button>
        </Box>
      )}

      <Flex
        gap="2"
        justify="end"
        wrap="wrap"
        direction={{ initial: "column", sm: "row" }}
      >
        {onBack && (
          <Button
            type="button"
            variant="ghost"
            color="gray"
            size="2"
            onClick={onBack}
            style={{ flex: 1, width: "100%", minWidth: 0 }}
          >
            Back
          </Button>
        )}
        <Button
          type="button"
          color={SEMANTIC_COLOR.primary}
          size="2"
          onClick={onNext}
          style={{ flex: 1, width: "100%", minWidth: 0 }}
        >
          {isVerified ? "Continue" : "I've verified my email"}
        </Button>
      </Flex>
    </Flex>
  );
}

