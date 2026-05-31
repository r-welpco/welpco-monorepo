"use client";

import { Card } from "@welpco/ui/card";
import { Badge } from "@welpco/ui/badge";
import { Button } from "@welpco/ui/button";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Avatar } from "@welpco/ui/avatar";
import { Separator } from "@welpco/ui/separator";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { BadgeCheck, Clock, Wallet } from "lucide-react";
import type { ReactNode } from "react";

export interface ApplicationReviewCardLabels {
  verified: string;
  applied: (date: string) => string;
  sendBookingRequest: string;
  statusLabel: (status: "pending" | "accepted" | "rejected" | "withdrawn") => string;
}

const STATUS_TOKENS: Record<
  NonNullable<ApplicationReviewCardProps["status"]>,
  { label: string; color: "gray" | "blue" | "red" | "green" }
> = {
  pending: { label: "Pending", color: "blue" },
  accepted: { label: "Selected", color: "green" },
  rejected: { label: "Rejected", color: "red" },
  withdrawn: { label: "Withdrawn", color: "gray" },
};

const DEFAULT_LABELS: ApplicationReviewCardLabels = {
  verified: "Verified",
  applied: (date) => `Applied ${date}`,
  sendBookingRequest: "Send booking request",
  statusLabel: (status) => STATUS_TOKENS[status]?.label ?? STATUS_TOKENS.pending.label,
};

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
  labels?: ApplicationReviewCardLabels;
}

function candidateInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function MetaItem({ children }: { children: ReactNode }) {
  return (
    <Flex align="center" gap="2" style={{ minWidth: 0, color: "var(--gray-9)" }}>
      {children}
    </Flex>
  );
}

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
  labels: labelsProp,
}: ApplicationReviewCardProps) {
  const labels = labelsProp ?? DEFAULT_LABELS;
  const statusToken = STATUS_TOKENS[status] || STATUS_TOKENS.pending;
  const statusText = labels.statusLabel(status);

  return (
    <Card size="3" variant="surface" style={{ width: "100%" }}>
      <Flex direction="column" gap="4">
        <Flex justify="between" align="start" gap="3">
          <Flex gap="3" align="center" style={{ minWidth: 0 }}>
            <Avatar
              size="3"
              fallback={candidateInitials(candidateName)}
              radius="full"
              color={SEMANTIC_COLOR.primary}
            />
            <Box style={{ minWidth: 0 }}>
              <Flex align="center" gap="2" mb="1" wrap="wrap">
                <Heading size="4" trim="start">
                  {candidateName}
                </Heading>
                {welperVerified && (
                  <Badge color={SEMANTIC_COLOR.primary} variant="soft" size="1" radius="full">
                    <Flex align="center" gap="1">
                      <BadgeCheck size={12} aria-hidden />
                      {labels.verified}
                    </Flex>
                  </Badge>
                )}
              </Flex>
              <Text size="2" color="gray" truncate>
                {role}
              </Text>
            </Box>
          </Flex>
          <Box style={{ flexShrink: 0 }}>
            <Badge color={statusToken.color} variant="soft" size="2" radius="full">
              {statusText}
            </Badge>
          </Box>
        </Flex>

        <Flex wrap="wrap" gapX="4" gapY="2">
          <MetaItem>
            <Wallet size={14} aria-hidden style={{ flexShrink: 0 }} />
            <Text size="2" color="gray" highContrast>
              {hourlyRate}
            </Text>
          </MetaItem>
          {submittedAt && (
            <MetaItem>
              <Clock size={14} aria-hidden style={{ flexShrink: 0 }} />
              <Text size="2" color="gray" highContrast>
                {labels.applied(submittedAt)}
              </Text>
            </MetaItem>
          )}
        </Flex>

        {proposalMessage && (
          <Box
            p="3"
            style={{
              backgroundColor: "var(--gray-2)",
              borderRadius: "var(--radius-3)",
              borderLeft: "2px solid var(--gray-5)",
            }}
          >
            <Text size="2" color="gray" highContrast>
              {proposalMessage}
            </Text>
          </Box>
        )}

        {onSendBookingRequest && status === "pending" && (
          <>
            <Separator size="4" />
            <Flex gap="2" justify="end" wrap="wrap">
              <Button
                onClick={onSendBookingRequest}
                variant="solid"
                color={SEMANTIC_COLOR.primary}
                size="2"
                disabled={sendBookingRequestDisabled}
              >
                {labels.sendBookingRequest}
              </Button>
            </Flex>
          </>
        )}
      </Flex>
    </Card>
  );
}
