"use client";

import { Card } from "@welpco/ui/card";
import { Badge } from "@welpco/ui/badge";
import { Button } from "@welpco/ui/button";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { DisputeStatusBadge } from "./dispute-status-badge";
import { type DisputeStatus } from "./dispute-status-badge";

export interface SupportTicketCardProps {
  ticketId: string;
  subject: string;
  status: DisputeStatus;
  createdAt: string;
  lastUpdated?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  onView?: () => void;
}

const priorityColors: Record<
  NonNullable<SupportTicketCardProps["priority"]>,
  "gray" | "amber" | "red"
> = {
  low: "gray",
  medium: "amber",
  high: "red",
  urgent: "red",
};

export function SupportTicketCard({
  ticketId,
  subject,
  status,
  createdAt,
  lastUpdated,
  priority = "medium",
  onView,
}: SupportTicketCardProps) {
  return (
    <Card size="3" variant="surface" style={{ width: "100%" }}>
      <Flex direction="column" gap="3">
        <Flex justify="between" align="start" gap="3">
          <Box flexGrow="1" style={{ minWidth: 0 }}>
            <Flex gap="2" align="center" mb="1" wrap="wrap">
              <Text size="1" color="gray" weight="medium">
                #{ticketId}
              </Text>
              <DisputeStatusBadge status={status} />
              <Badge color={priorityColors[priority]} variant="soft" size="1">
                {priority}
              </Badge>
            </Flex>
            <Heading size="4" trim="start" mb="1">
              {subject}
            </Heading>
            <Text size="2" color="gray" highContrast>
              Created {createdAt}
              {lastUpdated ? ` \u00B7 Updated ${lastUpdated}` : ""}
            </Text>
          </Box>
        </Flex>
        {onView && (
          <Flex gap="2" justify="end" wrap="wrap">
            <Button variant="ghost" color="gray" size="2" onClick={onView}>
              View
            </Button>
          </Flex>
        )}
      </Flex>
    </Card>
  );
}

