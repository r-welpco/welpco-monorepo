"use client";

import { Card } from "@welpco/ui/card";
import { Badge } from "@welpco/ui/badge";
import { Button } from "@welpco/ui/button";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";

export interface ApplicationReviewCardProps {
  candidateName: string;
  role: string;
  hourlyRate: string;
  submittedAt?: string;
  proposalMessage?: string;
  status?: "pending" | "accepted" | "rejected" | "withdrawn";
  welperVerified?: boolean;
  onSendBookingRequest?: () => void;
  sendBookingRequestDisabled?: boolean;
}

const statusLabel: Record<
  NonNullable<ApplicationReviewCardProps["status"]>,
  { label: string; color: "gray" | "blue" | "red" | "green" }
> = {
  pending: { label: "Pending", color: "blue" },
  accepted: { label: "Selected", color: "green" },
  rejected: { label: "Rejected", color: "red" },
  withdrawn: { label: "Withdrawn", color: "gray" },
};

export function ApplicationReviewCard({
  candidateName,
  role,
  hourlyRate,
  submittedAt,
  proposalMessage,
  status = "pending",
  welperVerified,
  onSendBookingRequest,
  sendBookingRequestDisabled,
}: ApplicationReviewCardProps) {
  const statusToken = statusLabel[status] || statusLabel.pending;

  return (
    <Card size="3" variant="surface" style={{ width: "100%" }}>
      <Flex direction="column" gap="3">
        <Flex justify="between" align="start" gap="3">
          <Box flexGrow="1" style={{ minWidth: 0 }}>
            <Flex align="center" gap="2" mb="1" wrap="wrap">
              <Heading size="4" trim="start">
                {candidateName}
              </Heading>
              <Badge color={statusToken.color} variant="soft" size="1">
                {statusToken.label}
              </Badge>
              {welperVerified && (
                <Badge color="green" variant="soft" size="1">
                  Verified
                </Badge>
              )}
            </Flex>
            <Text size="2" color="gray" highContrast>
              {`${role} · Rate ${hourlyRate}${submittedAt ? ` · Submitted ${submittedAt}` : ""}`}
            </Text>
          </Box>
        </Flex>

        {proposalMessage && (
          <Box p="3" style={{ backgroundColor: "var(--gray-2)", borderRadius: "var(--radius-3)" }}>
            <Text size="2" color="gray" highContrast>
              {proposalMessage}
            </Text>
          </Box>
        )}

        {onSendBookingRequest && status === "pending" && (
          <Flex gap="2" justify="end" wrap="wrap">
            <Button
              onClick={onSendBookingRequest}
              variant="solid"
              color={SEMANTIC_COLOR.primary}
              size="2"
              disabled={sendBookingRequestDisabled}
            >
              Send booking request
            </Button>
          </Flex>
        )}
      </Flex>
    </Card>
  );
}
