"use client";

import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { StarIcon } from "@radix-ui/react-icons";

export type RatingDisplaySize = "1" | "2" | "3" | "4" | "5";

export interface RatingDisplayProps {
  rating: number;
  maxRating?: number;
  showValue?: boolean;
  size?: RatingDisplaySize;
}

const STAR_PX: Record<RatingDisplaySize, string> = {
  "1": "12px",
  "2": "16px",
  "3": "20px",
  "4": "24px",
  "5": "28px",
};

const FILL_VAR = "var(--amber-9)";
const EMPTY_VAR = "var(--gray-5)";

/**
 * Star rating widget. The full rating is announced as a single accessible
 * label ("4.5 out of 5 stars") via `role="img"`; the individual star icons
 * are decorative (`aria-hidden`). Bible §20.2 — rating must always be
 * legible to assistive tech, never just visual.
 */
export function RatingDisplay({
  rating,
  maxRating = 5,
  showValue = false,
  size = "2",
}: RatingDisplayProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);

  const px = STAR_PX[size];
  const starStyle = { width: px, height: px };

  const ariaLabel = `${rating.toFixed(1)} out of ${maxRating} stars`;

  return (
    <Flex gap="2" align="center" role="img" aria-label={ariaLabel}>
      <Flex gap="1" align="center" aria-hidden="true">
        {Array.from({ length: fullStars }).map((_, i) => (
          <StarIcon
            key={`full-${i}`}
            style={{ ...starStyle, fill: FILL_VAR, color: FILL_VAR }}
          />
        ))}
        {hasHalfStar && (
          <Box position="relative" display="inline-block">
            <StarIcon style={{ ...starStyle, fill: EMPTY_VAR, color: EMPTY_VAR }} />
            <Box
              position="absolute"
              top="0"
              left="0"
              style={{ width: "50%", height: "100%", overflow: "hidden" }}
            >
              <StarIcon style={{ ...starStyle, fill: FILL_VAR, color: FILL_VAR }} />
            </Box>
          </Box>
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <StarIcon
            key={`empty-${i}`}
            style={{ ...starStyle, fill: EMPTY_VAR, color: EMPTY_VAR }}
          />
        ))}
      </Flex>
      {showValue && (
        <Text size={size} weight="bold" aria-hidden="true">
          {rating.toFixed(1)}
        </Text>
      )}
    </Flex>
  );
}

RatingDisplay.displayName = "RatingDisplay";
