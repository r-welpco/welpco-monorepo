"use client";

import { Card } from "@welpco/ui/card";
import { Badge } from "@welpco/ui/badge";
import { Button } from "@welpco/ui/button";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";

export interface PaymentMethodCardProps {
  brand: string;
  last4: string;
  exp?: string;
  isDefault?: boolean;
  onMakeDefault?: () => void;
  onRemove?: () => void;
}

export function PaymentMethodCard({
  brand,
  last4,
  exp,
  isDefault = false,
  onMakeDefault,
  onRemove,
}: PaymentMethodCardProps) {
  return (
    <Card size="3" variant="surface" style={{ width: "100%" }}>
      <Flex direction="column" gap="3">
        <Flex justify="between" align="start" gap="3">
          <Box flexGrow="1" style={{ minWidth: 0 }}>
            <Heading size="4" trim="start" mb="1">
              {brand} •••• {last4}
            </Heading>
            {exp && (
              <Text size="2" color="gray" highContrast>
                Expires {exp}
              </Text>
            )}
          </Box>
          {isDefault && (
            <Badge color={SEMANTIC_COLOR.success} variant="soft" size="2">
              Default
            </Badge>
          )}
        </Flex>
        {((!isDefault && onMakeDefault) || onRemove) && (
          <Flex gap="2" justify="end" wrap="wrap">
            {!isDefault && onMakeDefault && (
              <Button variant="ghost" color="gray" size="2" onClick={onMakeDefault}>
                Make default
              </Button>
            )}
            {onRemove && (
              <Button variant="ghost" color={SEMANTIC_COLOR.danger} size="2" onClick={onRemove}>
                Remove
              </Button>
            )}
          </Flex>
        )}
      </Flex>
    </Card>
  );
}

