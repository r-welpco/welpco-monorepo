"use client";

import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { PaymentStatusBadge, type PaymentStatus } from "./payment-status-badge";

export interface PaymentAuthorizationCardProps {
  amount: string;
  methodSummary: string;
  status: PaymentStatus;
  createdAt?: string;
  onApprove?: () => void;
  onCancel?: () => void;
}

export function PaymentAuthorizationCard({
  amount,
  methodSummary,
  status,
  createdAt,
  onApprove,
  onCancel,
}: PaymentAuthorizationCardProps) {
  return (
    <Card size="3" variant="surface" style={{ width: "100%", maxWidth: "640px" }}>
      <Flex direction="column" gap="3">
        <Flex justify="between" align="start" gap="3">
          <Box flexGrow="1" style={{ minWidth: 0 }}>
            <Heading size="4" trim="start" mb="1">
              Authorization
            </Heading>
            <Text size="2" color="gray" highContrast>
              {`${methodSummary}${createdAt ? ` \u00B7 Created ${createdAt}` : ""}`}
            </Text>
          </Box>
          <PaymentStatusBadge status={status} />
        </Flex>

        <Text size="6" weight="bold">
          {amount}
        </Text>

        {(onApprove || onCancel) && (
          <Flex gap="2" justify="end" wrap="wrap">
            {onCancel && (
              <Button onClick={onCancel} variant="ghost" color={SEMANTIC_COLOR.danger} size="2">
                Cancel
              </Button>
            )}
            {onApprove && (
              <Button onClick={onApprove} variant="solid" color={SEMANTIC_COLOR.primary} size="2">
                Approve
              </Button>
            )}
          </Flex>
        )}
      </Flex>
    </Card>
  );
}

