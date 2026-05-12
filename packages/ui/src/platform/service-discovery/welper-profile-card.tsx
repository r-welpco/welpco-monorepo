"use client";

import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { Avatar } from "@welpco/ui/avatar";
import { Badge } from "@welpco/ui/badge";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { MapPin, Star } from "lucide-react";

export interface WelperProfileCardProps {
  /** Unique id for the welper (used as React key in lists). */
  welperId?: string;
  name: string;
  title: string;
  location: string;
  hourlyRate: number;
  rating?: number;
  reviews?: number;
  specialties?: string[];
  /** Optional avatar image URL */
  imageUrl?: string;
  onView?: () => void;
  onBook?: () => void;
}

/**
 * Customer-facing welper summary used in search results and the discovery
 * hero card. Canonical card pattern (bible §6.1): avatar + identity on the
 * left, price + rating on the right, specialties beneath, actions right-
 * aligned at the bottom.
 */
export function WelperProfileCard({
  name,
  title,
  location,
  hourlyRate,
  rating,
  reviews,
  specialties = [],
  imageUrl,
  onView,
  onBook,
}: WelperProfileCardProps) {
  // Bible §22.6: zero reviews ≠ zero stars. Only render the star line when
  // the welper has at least one real review backing the number.
  const hasRating =
    typeof rating === "number" &&
    rating > 0 &&
    typeof reviews === "number" &&
    reviews > 0;

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "640px", minWidth: 0 }}
    >
      <Flex direction="column" gap="4">
        {/* Identity row: avatar + name+title+location | price+rating */}
        <Flex gap="4" align="start" wrap="wrap">
          <Avatar
            src={imageUrl}
            fallback={name.charAt(0).toUpperCase()}
            alt={name}
            size="6"
            radius="full"
            style={{ flexShrink: 0 }}
          />

          <Box flexGrow="1" style={{ minWidth: 0 }}>
            <Heading size="4" mb="1" trim="start">
              {name}
            </Heading>
            <Text size="2" weight="medium" as="div" mb="1">
              {title}
            </Text>
            <Flex align="center" gap="1">
              <MapPin
                size={14}
                aria-hidden="true"
                style={{ color: "var(--gray-10)", flexShrink: 0 }}
              />
              <Text size="2" color="gray" highContrast>
                {location}
              </Text>
            </Flex>
          </Box>

          <Flex
            direction="column"
            align="end"
            gap="1"
            flexShrink="0"
          >
            <Flex align="baseline" gap="1">
              <Heading size="5" color={SEMANTIC_COLOR.primary}>
                ${hourlyRate}
              </Heading>
              <Text size="1" color="gray" highContrast>
                /hr
              </Text>
            </Flex>
            {hasRating ? (
              <Flex align="center" gap="1" aria-label={`Rated ${rating!.toFixed(1)} out of 5 from ${reviews} ${reviews === 1 ? "review" : "reviews"}`}>
                <Star
                  size={14}
                  aria-hidden="true"
                  style={{
                    color: "var(--amber-9)",
                    fill: "var(--amber-9)",
                    flexShrink: 0,
                  }}
                />
                <Text size="2" weight="medium">
                  {rating!.toFixed(1)}
                </Text>
                {reviews != null && reviews > 0 && (
                  <Text size="2" color="gray" highContrast aria-hidden="true">
                    ({reviews})
                  </Text>
                )}
              </Flex>
            ) : (
              <Text size="1" color="gray" highContrast>
                No reviews yet
              </Text>
            )}
          </Flex>
        </Flex>

        {/* Specialties row — neutral tags, not status */}
        {specialties.length > 0 && (
          <Flex gap="2" wrap="wrap">
            {specialties.slice(0, 4).map((spec) => (
              <Badge key={spec} variant="soft" color="gray" size="1" highContrast>
                {spec}
              </Badge>
            ))}
          </Flex>
        )}

        {/* Actions — right-aligned, primary last */}
        {(onView || onBook) && (
          <Flex gap="2" justify="end" wrap="wrap">
            {onView && (
              <Button onClick={onView} variant="soft" color="gray" size="2">
                View profile
              </Button>
            )}
            {onBook && (
              <Button
                onClick={onBook}
                color={SEMANTIC_COLOR.primary}
                size="2"
                variant="solid"
              >
                Book now
              </Button>
            )}
          </Flex>
        )}
      </Flex>
    </Card>
  );
}

WelperProfileCard.displayName = "WelperProfileCard";
