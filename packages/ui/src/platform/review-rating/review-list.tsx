"use client";

import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { ReviewCard, type ReviewCardProps } from "./review-card";
import { Skeleton } from "@welpco/ui/skeleton";
import { MessageSquare } from "lucide-react";

export interface ReviewListProps {
  reviews: ReviewCardProps[];
  loading?: boolean;
  emptyMessage?: string;
}

/**
 * List of reviews. Loading state mirrors the post-load card layout (avatar
 * + name+date + body skeleton). Empty state follows bible §17.3 — icon
 * medallion + heading + description.
 */
export function ReviewList({
  reviews,
  loading,
  emptyMessage,
}: ReviewListProps) {
  // Loading
  if (loading && reviews.length === 0) {
    return (
      <Flex direction="column" gap="3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} size="3" variant="surface">
            <Flex direction="column" gap="3">
              <Flex gap="3" align="start">
                <Skeleton width="32px" height="32px" style={{ borderRadius: "9999px" }} />
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Skeleton height="14px" width="40%" mb="1" />
                  <Skeleton height="12px" width="30%" />
                </Box>
              </Flex>
              <Skeleton height="48px" />
            </Flex>
          </Card>
        ))}
      </Flex>
    );
  }

  // Empty
  if (reviews.length === 0) {
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
            <MessageSquare size={24} aria-hidden="true" />
          </Flex>
          <Box>
            <Heading size="4" mb="1" align="center" trim="start">
              {emptyMessage ?? "No reviews yet"}
            </Heading>
            <Text size="2" color="gray" highContrast align="center" as="p">
              When customers leave reviews, they'll appear here.
            </Text>
          </Box>
        </Flex>
      </Card>
    );
  }

  // List
  return (
    <Flex direction="column" gap="3">
      {reviews.map((review, idx) => (
        <ReviewCard key={idx} {...review} />
      ))}
    </Flex>
  );
}

ReviewList.displayName = "ReviewList";
