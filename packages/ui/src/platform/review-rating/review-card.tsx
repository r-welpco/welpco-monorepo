"use client";

import { Card } from "@welpco/ui/card";
import { Avatar } from "@welpco/ui/avatar";
import { Badge } from "@welpco/ui/badge";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { RatingDisplay } from "./rating-display";
import { BadgeCheck } from "lucide-react";

export interface ReviewCardProps {
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number;
  comment?: string;
  date: string;
  verified?: boolean;
}

/**
 * Review list item. Canonical card pattern (bible §6.1): identity + verified
 * badge on the left, date aligned to the right, rating under the name,
 * comment as the body.
 *
 * `verified` uses the standard trust badge (bible §20.1) — never restyle it.
 */
export function ReviewCard({
  reviewerName,
  reviewerAvatar,
  rating,
  comment,
  date,
  verified = false,
}: ReviewCardProps) {
  return (
    <Card size="3" variant="surface" style={{ width: "100%" }}>
      <Flex direction="column" gap="3">
        <Flex justify="between" align="start" gap="3">
          <Flex gap="3" align="start" style={{ flex: 1, minWidth: 0 }}>
            <Avatar
              src={reviewerAvatar}
              fallback={reviewerName.charAt(0).toUpperCase()}
              alt={reviewerName}
              size="3"
            />
            <Box style={{ minWidth: 0 }}>
              <Flex gap="2" align="center" wrap="wrap" mb="1">
                <Text size="2" weight="bold">
                  {reviewerName}
                </Text>
                {verified && (
                  <Badge
                    color={SEMANTIC_COLOR.primary}
                    variant="soft"
                    size="1"
                    highContrast
                  >
                    <Flex align="center" gap="1">
                      <BadgeCheck size={12} aria-hidden="true" />
                      Booked through Welpco
                    </Flex>
                  </Badge>
                )}
              </Flex>
              <RatingDisplay rating={rating} size="2" />
            </Box>
          </Flex>
          <Text size="1" color="gray" highContrast style={{ flexShrink: 0 }}>
            {date}
          </Text>
        </Flex>

        {comment && <Text size="2">{comment}</Text>}
      </Flex>
    </Card>
  );
}

ReviewCard.displayName = "ReviewCard";
