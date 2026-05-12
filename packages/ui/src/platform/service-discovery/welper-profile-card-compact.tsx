"use client";

import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { Avatar } from "@welpco/ui/avatar";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";

export interface WelperProfileCardCompactProps {
  name: string;
  title: string;
  location: string;
  hourlyRate: number;
  /** Average rating (1-5). Pass `undefined` or `0` together with `reviews <= 0` to show "No reviews yet". */
  rating?: number;
  /** Total number of completed reviews. Required to gate the rating-vs-no-reviews choice honestly per bible §22.6. */
  reviews?: number;
  imageUrl?: string;
  onView?: () => void;
  onBook?: () => void;
}

export function WelperProfileCardCompact({
  name,
  title,
  location,
  hourlyRate,
  rating,
  reviews,
  imageUrl,
  onView,
  onBook,
}: WelperProfileCardCompactProps) {
  // Bible §22.6: a welper with zero reviews is NOT a 0-star welper.
  // Render the rating only when at least one review exists; otherwise show
  // a neutral "No reviews yet" line so the card doesn't lie about a fresh
  // welper's quality.
  const hasRating =
    typeof rating === "number" &&
    rating > 0 &&
    typeof reviews === "number" &&
    reviews > 0;
  return (
    <Card size="3" variant="surface" style={{ width: "100%", minWidth: 0 }}>
      <Flex direction="column" gap="3" style={{ minWidth: 0 }}>
        <Flex justify="between" align="start" gap="3">
          <Flex gap="3" align="center" flexGrow="1" style={{ minWidth: 0 }}>
            <Avatar
              src={imageUrl}
              fallback={name.charAt(0)}
              size="5"
              radius="full"
              style={{ flexShrink: 0 }}
            />
            <Box flexGrow="1" style={{ minWidth: 0 }}>
              <Heading size="4" weight="bold" trim="start" mb="1">
                {name}
              </Heading>
              <Text size="2" color="gray" highContrast>
                {`${title} \u00B7 ${location}`}
              </Text>
            </Box>
          </Flex>
          <Flex direction="column" align="end" gap="1" style={{ flexShrink: 0 }}>
            <Heading size="4" weight="bold" color={SEMANTIC_COLOR.primary} trim="start">
              ${hourlyRate}
              <Text size="1" color="gray" weight="regular">
                {" "}/hr
              </Text>
            </Heading>
            {hasRating ? (
              <Flex align="center" gap="1" aria-label={`Rated ${rating!.toFixed(1)} out of 5 from ${reviews} ${reviews === 1 ? "review" : "reviews"}`}>
                <Text size="2" weight="bold">
                  {rating!.toFixed(1)}
                </Text>
                <Text size="2" color="gray" aria-hidden="true">★</Text>
                {typeof reviews === "number" && reviews > 0 ? (
                  <Text size="1" color="gray" highContrast aria-hidden="true">
                    ({reviews})
                  </Text>
                ) : null}
              </Flex>
            ) : (
              <Text size="1" color="gray" highContrast>
                No reviews yet
              </Text>
            )}
          </Flex>
        </Flex>
        {(onView || onBook) && (
          <Flex gap="2" justify="end" wrap="wrap">
            {onView ? (
              <Button onClick={onView} variant="soft" color="gray" size="2">
                View
              </Button>
            ) : null}
            {onBook ? (
              <Button onClick={onBook} variant="solid" color={SEMANTIC_COLOR.primary} size="2">
                Book
              </Button>
            ) : null}
          </Flex>
        )}
      </Flex>
    </Card>
  );
}
