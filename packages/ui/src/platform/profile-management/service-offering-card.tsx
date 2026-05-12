"use client";

import { Card } from "@welpco/ui/card";
import { Badge } from "@welpco/ui/badge";
import { Button } from "@welpco/ui/button";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";

export interface ServiceOfferingCardProps {
  title: string;
  category: string;
  hourlyRate: number;
  description?: string;
  rating?: number;
  reviewsCount?: number;
  onBook?: () => void;
  onEdit?: () => void;
}

export function ServiceOfferingCard({
  title,
  category,
  hourlyRate,
  description,
  rating,
  reviewsCount,
  onBook,
  onEdit,
}: ServiceOfferingCardProps) {
  return (
    <Card size="3" variant="surface" style={{ width: "100%", minWidth: 0 }}>
      <Flex direction="column" gap="3">
        <Flex align="start" justify="between" gap="3" wrap="wrap">
          <Box flexGrow="1" style={{ minWidth: 0 }}>
            <Heading size="4" trim="start" mb="1">
              {title}
            </Heading>
            <Flex gap="2" align="center" wrap="wrap">
              <Badge color="gray" variant="soft" size="1">
                {category}
              </Badge>
            </Flex>
          </Box>
          <Heading size="4" weight="bold" color={SEMANTIC_COLOR.primary} trim="start" style={{ flexShrink: 0 }}>
            ${hourlyRate}/hr
          </Heading>
        </Flex>

        {description ? (
          <Text size="2" color="gray" highContrast>
            {description}
          </Text>
        ) : null}

        {((typeof rating === "number" && rating >= 0) ||
          (reviewsCount != null && reviewsCount > 0)) && (
          <Flex align="center" gap="2">
            {typeof rating === "number" && rating >= 0 ? (
              <Text size="2" weight="bold">
                {rating.toFixed(1)} ★
              </Text>
            ) : null}
            {reviewsCount != null && reviewsCount > 0 ? (
              <Text size="2" color="gray" highContrast>
                ({reviewsCount} reviews)
              </Text>
            ) : null}
          </Flex>
        )}

        {(onBook || onEdit) && (
          <Flex gap="2" justify="end" wrap="wrap">
            {onEdit ? (
              <Button onClick={onEdit} variant="ghost" color="gray" size="2">
                Edit
              </Button>
            ) : null}
            {onBook ? (
              <Button onClick={onBook} size="2" variant="solid" color={SEMANTIC_COLOR.primary}>
                Book now
              </Button>
            ) : null}
          </Flex>
        )}
      </Flex>
    </Card>
  );
}

