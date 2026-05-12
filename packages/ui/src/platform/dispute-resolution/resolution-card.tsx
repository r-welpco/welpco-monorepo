"use client";

import { Card } from "@welpco/ui/card";
import { Badge } from "@welpco/ui/badge";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Separator } from "@welpco/ui/separator";
import { Callout } from "@welpco/ui/callout";
import { SEMANTIC_COLOR, type SemanticColor } from "@welpco/ui/tokens";

export interface ResolutionCardProps {
  resolutionId: string;
  status: "resolved" | "rejected" | "partial";
  resolution: string;
  resolvedBy?: string;
  resolvedAt: string;
  refundAmount?: number;
  notes?: string;
}

/**
 * Day 2 decision 6: status semantics flow through SEMANTIC_COLOR — never raw
 * `color="red|green|amber|blue"`. Bible §20.4: status badges use soft +
 * highContrast.
 */
const statusConfig: Record<
  ResolutionCardProps["status"],
  { color: SemanticColor; label: string }
> = {
  resolved: { color: "success", label: "Resolved" },
  rejected: { color: "danger", label: "Rejected" },
  partial: { color: "warning", label: "Partially resolved" },
};

export function ResolutionCard({
  resolutionId,
  status,
  resolution,
  resolvedBy,
  resolvedAt,
  refundAmount,
  notes,
}: ResolutionCardProps) {
  const config = statusConfig[status];
  const semanticColor = SEMANTIC_COLOR[config.color];

  return (
    <Card size="4" variant="surface" style={{ width: "100%", maxWidth: "640px" }}>
      <Flex direction="column" gap="3">
        <Flex justify="between" align="start" gap="3">
          <Box flexGrow="1" style={{ minWidth: 0 }}>
            <Heading size="4" trim="start" mb="1">
              Resolution #{resolutionId}
            </Heading>
            <Text size="2" color="gray" highContrast>
              Resolved {resolvedAt}
              {resolvedBy ? ` · By ${resolvedBy}` : ""}
            </Text>
          </Box>
          <Badge color={semanticColor} variant="soft" highContrast size="2">
            {config.label}
          </Badge>
        </Flex>

        <Separator />

        <Callout.Root color={semanticColor} variant="surface">
          <Callout.Text>
            <Text size="2" weight="bold" mb="2">
              Resolution
            </Text>
            <Text size="2">{resolution}</Text>
          </Callout.Text>
        </Callout.Root>

        {refundAmount && refundAmount > 0 && (
          <Box
            p="3"
            style={{
              backgroundColor: "var(--green-2)",
              border: "1px solid var(--green-6)",
              borderRadius: "var(--radius-3)",
            }}
          >
            <Text size="2" weight="bold" color={SEMANTIC_COLOR.success} mb="2">
              Refund amount
            </Text>
            <Text size="4" weight="bold" color={SEMANTIC_COLOR.success}>
              ${refundAmount.toFixed(2)}
            </Text>
          </Box>
        )}

        {notes && (
          <Box>
            <Text size="2" weight="bold" mb="2">
              Additional notes
            </Text>
            <Text size="2" color="gray" highContrast>
              {notes}
            </Text>
          </Box>
        )}
      </Flex>
    </Card>
  );
}

