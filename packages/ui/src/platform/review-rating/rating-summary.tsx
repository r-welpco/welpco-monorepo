"use client";

import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Progress } from "@welpco/ui/progress";
import { RatingDisplay } from "./rating-display";

export interface RatingSummaryProps {
  averageRating: number;
  totalReviews: number;
  distribution: {
    rating: number;
    count: number;
  }[];
}

/**
 * Aggregate rating summary. Big average at the top, the canonical RatingDisplay
 * widget below it, then a histogram of the count per star bucket. Bars scale
 * to the highest-count bucket so distribution shape is the visual signal.
 */
export function RatingSummary({
  averageRating,
  totalReviews,
  distribution,
}: RatingSummaryProps) {
  const sorted = [...distribution].sort((a, b) => b.rating - a.rating);
  const maxCount = Math.max(...sorted.map((d) => d.count), 1);

  return (
    <Card size="4" variant="surface" style={{ width: "100%", maxWidth: "400px" }}>
      <Flex direction="column" gap="4">
        {/* Hero: average + stars + count */}
        <Flex direction="column" align="center" gap="1">
          <Heading size="8" mb="0" trim="start" align="center">
            {averageRating.toFixed(1)}
          </Heading>
          <RatingDisplay rating={averageRating} size="3" />
          <Text size="2" color="gray" highContrast align="center">
            Based on {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
          </Text>
        </Flex>

        {/* Distribution histogram */}
        <Flex direction="column" gap="2">
          {sorted.map((item) => {
            const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
            return (
              <Flex key={item.rating} gap="3" align="center">
                <Text size="2" weight="medium" style={{ minWidth: "32px" }}>
                  {item.rating}★
                </Text>
                <Progress
                  value={percentage}
                  aria-label={`${item.rating} star ratings: ${item.count} ${
                    item.count === 1 ? "review" : "reviews"
                  }`}
                  style={{ flex: 1 }}
                />
                <Text
                  size="2"
                  color="gray"
                  highContrast
                  align="right"
                  style={{ minWidth: "40px" }}
                >
                  {item.count}
                </Text>
              </Flex>
            );
          })}
        </Flex>
      </Flex>
    </Card>
  );
}

RatingSummary.displayName = "RatingSummary";
