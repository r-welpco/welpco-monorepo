"use client";

import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { TextField } from "@welpco/ui/text-field";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Callout } from "@welpco/ui/callout";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useState, type ChangeEvent } from "react";

export interface ReferralCodeInputProps {
  defaultCode?: string;
  loading?: boolean;
  error?: string;
  successMessage?: string;
  onApply?: (code: string) => void | Promise<void>;
}

export function ReferralCodeInput({
  defaultCode = "",
  loading,
  error,
  successMessage,
  onApply,
}: ReferralCodeInputProps) {
  const [code, setCode] = useState(defaultCode);

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "480px", minWidth: 0 }}
    >
      <Flex direction="column" gap="3" style={{ minWidth: 0 }}>
        <Box>
          <Heading size="4" mb="1" trim="start">
            Have a referral code?
          </Heading>
          <Text size="2" color="gray" highContrast>
            Enter your code to unlock welcome benefits.
          </Text>
        </Box>

        {error && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        {successMessage && (
          <Callout.Root color={SEMANTIC_COLOR.success} variant="surface">
            <Callout.Text>{successMessage}</Callout.Text>
          </Callout.Root>
        )}

        <Box mb="3">
          <Text as="label" size="2" weight="medium" htmlFor="referral-code" mb="1">
            Referral code
          </Text>
          <Flex gap="3" align="center" direction={{ initial: "column", sm: "row" }}>
            <TextField.Root
              id="referral-code"
              placeholder="ENTER CODE"
              value={code}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                const target = event.target as HTMLInputElement;
                setCode(target.value.toUpperCase());
              }}
              size="2"
              disabled={loading}
              style={{ flex: 1, textTransform: "uppercase" }}
            />
            <Button
              type="button"
              size="2"
              color={SEMANTIC_COLOR.primary}
              onClick={() => onApply?.(code)}
              disabled={loading || !code}
            >
              {loading ? "Applying..." : "Apply"}
            </Button>
          </Flex>
        </Box>
      </Flex>
    </Card>
  );
}
