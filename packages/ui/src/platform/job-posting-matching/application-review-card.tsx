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
  coverLetter?: string;
  status?: "new" | "shortlist" | "reject" | "hired";
  onShortlist?: () => void;
  onReject?: () => void;
  onHire?: () => void;
}

const statusLabel: Record<
  NonNullable<ApplicationReviewCardProps["status"]>,
  { label: string; color: "gray" | "blue" | "red" | "green" }
> = {
  new: { label: "New", color: "blue" },
  shortlist: { label: "Shortlisted", color: "blue" },
  reject: { label: "Rejected", color: "red" },
  hired: { label: "Hired", color: "green" },
};

export function ApplicationReviewCard({
  candidateName,
  role,
  hourlyRate,
  submittedAt,
  coverLetter,
  status = "new",
  onShortlist,
  onReject,
  onHire,
}: ApplicationReviewCardProps) {
  const statusToken = statusLabel[status] || statusLabel["new"];

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
            </Flex>
            <Text size="2" color="gray" highContrast>
              {`${role} \u00B7 Rate ${hourlyRate}${submittedAt ? ` \u00B7 Submitted ${submittedAt}` : ""}`}
            </Text>
          </Box>
        </Flex>

        {coverLetter && (
          <Box p="3" style={{ backgroundColor: "var(--gray-2)", borderRadius: "var(--radius-3)" }}>
            <Text size="2" color="gray" highContrast>
              {coverLetter}
            </Text>
          </Box>
        )}

        {(onShortlist || onHire || onReject) && (
          <Flex gap="2" justify="end" wrap="wrap">
            {onShortlist && (
              <Button onClick={onShortlist} variant="soft" color={SEMANTIC_COLOR.info} size="2">
                Shortlist
              </Button>
            )}
            {onReject && (
              <Button onClick={onReject} variant="ghost" color={SEMANTIC_COLOR.danger} size="2">
                Reject
              </Button>
            )}
            {onHire && (
              <Button onClick={onHire} variant="solid" color={SEMANTIC_COLOR.primary} size="2">
                Hire
              </Button>
            )}
          </Flex>
        )}
      </Flex>
    </Card>
  );
}

