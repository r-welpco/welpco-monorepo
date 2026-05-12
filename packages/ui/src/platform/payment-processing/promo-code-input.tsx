"use client";

import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { TextField } from "@welpco/ui/text-field";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Callout } from "@welpco/ui/callout";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { Tag } from "lucide-react";
import { useState, type ChangeEvent } from "react";

export interface PromoCodeInputProps {
  defaultCode?: string;
  loading?: boolean;
  error?: string;
  successMessage?: string;
  onApply?: (code: string) => void | Promise<void>;
}

/**
 * Promo / discount code entry. Single-row input + apply button on desktop;
 * stacks on mobile so the button stays full-tap-target. Success and error
 * states use semantic Callouts.
 */
export function PromoCodeInput({
  defaultCode = "",
  loading,
  error,
  successMessage,
  onApply,
}: PromoCodeInputProps) {
  const [code, setCode] = useState(defaultCode);

  const handleApply = () => {
    if (!code.trim() || loading) return;
    onApply?.(code.trim());
  };

  return (
    <Card size="3" variant="surface" style={{ width: "100%", maxWidth: "480px" }}>
      <Flex direction="column" gap="3">
        <Box>
          <Heading size="4" mb="1" trim="start">
            Have a promo code?
          </Heading>
          <Text size="2" color="gray" highContrast>
            Apply discounts before checkout.
          </Text>
        </Box>

        {error && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        {successMessage && (
          <Callout.Root color={SEMANTIC_COLOR.success} variant="surface" role="status">
            <Callout.Text>{successMessage}</Callout.Text>
          </Callout.Root>
        )}

        <Box asChild>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleApply();
            }}
          >
            <Flex gap="2" direction={{ initial: "column", xs: "row" }}>
              <Box style={{ flex: 1, minWidth: 0 }}>
                <TextField.Root
                  placeholder="PROMO2025"
                  value={code}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    setCode(event.currentTarget.value.toUpperCase());
                  }}
                  disabled={loading}
                  aria-label="Promo code"
                  size="2"
                >
                  <TextField.Slot>
                    <Tag size={15} aria-hidden="true" />
                  </TextField.Slot>
                </TextField.Root>
              </Box>
              <Button
                type="submit"
                color={SEMANTIC_COLOR.primary}
                disabled={loading || !code.trim()}
                size="2"
              >
                {loading ? "Applying…" : "Apply"}
              </Button>
            </Flex>
          </form>
        </Box>
      </Flex>
    </Card>
  );
}

PromoCodeInput.displayName = "PromoCodeInput";
