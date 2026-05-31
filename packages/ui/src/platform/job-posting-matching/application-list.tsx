"use client";

import { Card } from "@welpco/ui/card";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Flex } from "@welpco/ui/flex";
import { Button } from "@welpco/ui/button";
import { Skeleton } from "@welpco/ui/skeleton";
import { Callout } from "@welpco/ui/callout";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { Inbox } from "lucide-react";
import { ApplicationReviewCard, type ApplicationReviewCardProps } from "./application-review-card";

export interface ApplicationListProps {
  items?: ApplicationReviewCardProps[];
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  onRetry?: () => void;
  labels?: ApplicationReviewCardProps["labels"];
}

/**
 * List of job applications. Loading state mirrors the post-load card layout.
 * Empty + error states follow bible §17.3 / §17.5 — icon medallion + heading
 * + description + clear retry path on error.
 */
export function ApplicationList({
  items = [],
  loading,
  error,
  emptyMessage,
  onRetry,
  labels,
}: ApplicationListProps) {
  // Loading
  if (loading) {
    return (
      <Flex direction="column" gap="3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} size="3" variant="surface">
            <Flex direction="column" gap="3">
              <Flex gap="3" align="start">
                <Skeleton width="40px" height="40px" style={{ borderRadius: "9999px" }} />
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Skeleton height="16px" width="40%" mb="1" />
                  <Skeleton height="12px" width="60%" />
                </Box>
              </Flex>
              <Skeleton height="48px" />
              <Flex gap="2" justify="end">
                <Skeleton width="80px" height="32px" />
                <Skeleton width="80px" height="32px" />
              </Flex>
            </Flex>
          </Card>
        ))}
      </Flex>
    );
  }

  // Error
  if (error) {
    return (
      <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
        <Flex direction="column" gap="2">
          <Callout.Text>{error}</Callout.Text>
          {onRetry && (
            <Flex justify="end">
              <Button onClick={onRetry} variant="soft" color="gray" size="2">
                Try again
              </Button>
            </Flex>
          )}
        </Flex>
      </Callout.Root>
    );
  }

  // Empty
  if (!items || items.length === 0) {
    return (
      <Card size="3" variant="surface" style={{ width: "100%" }}>
        <Flex direction="column" align="center" gap="3" py="6">
          <Flex
            align="center"
            justify="center"
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "9999px",
              backgroundColor: "var(--gray-3)",
              color: "var(--gray-11)",
            }}
          >
            <Inbox size={24} aria-hidden="true" />
          </Flex>
          <Box>
            <Heading size="4" mb="1" align="center" trim="start">
              {emptyMessage ?? "No applications yet"}
            </Heading>
            <Text size="2" color="gray" highContrast align="center" as="p">
              When Welpers apply to your job, they'll show up here for review.
            </Text>
          </Box>
        </Flex>
      </Card>
    );
  }

  // List
  return (
    <Flex direction="column" gap="3">
      {items.map((item, idx) => (
        <ApplicationReviewCard key={`${item.candidateName}-${idx}`} {...item} labels={labels ?? item.labels} />
      ))}
    </Flex>
  );
}

ApplicationList.displayName = "ApplicationList";
