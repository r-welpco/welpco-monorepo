"use client";

import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { Avatar } from "@welpco/ui/avatar";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Badge } from "@welpco/ui/badge";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";

export interface FavoriteWelperCardProps {
  name: string;
  role: string;
  location: string;
  rating?: number;
  completedJobs?: number;
  isFavorite?: boolean;
  onToggleFavorite?: (next: boolean) => void;
  onViewProfile?: () => void;
}

export function FavoriteWelperCard({
  name,
  role,
  location,
  rating,
  completedJobs,
  isFavorite = true,
  onToggleFavorite,
  onViewProfile,
}: FavoriteWelperCardProps) {
  const nextState = !isFavorite;

  return (
    <Card size="3" variant="surface" style={{ width: "100%", minWidth: 0 }}>
      <Flex direction="column" gap="3">
        <Flex justify="between" align="start" gap="3">
          <Flex gap="3" align="center" flexGrow="1" style={{ minWidth: 0 }}>
            <Avatar fallback={name.charAt(0)} />
            <Box flexGrow="1" style={{ minWidth: 0 }}>
              <Heading size="4" trim="start" mb="1">
                {name}
              </Heading>
              <Flex gap="2" align="center" wrap="wrap">
                <Badge color="blue" variant="soft" size="1">
                  {role}
                </Badge>
                <Text size="2" color="gray" highContrast>
                  {location}
                </Text>
              </Flex>
              {(typeof rating === "number" || completedJobs !== undefined) && (
                <Flex gap="2" align="center" mt="1">
                  {typeof rating === "number" && (
                    <Text size="2" weight="bold">
                      {rating.toFixed(1)} ★
                    </Text>
                  )}
                  {completedJobs !== undefined && (
                    <Text size="2" color="gray" highContrast>
                      {completedJobs} jobs
                    </Text>
                  )}
                </Flex>
              )}
            </Box>
          </Flex>
        </Flex>

        <Flex gap="2" justify="end" wrap="wrap">
          {onViewProfile && (
            <Button onClick={onViewProfile} variant="ghost" color="gray" size="2">
              View
            </Button>
          )}
          {isFavorite ? (
            <Button
              onClick={() => onToggleFavorite?.(nextState)}
              variant="ghost"
              color={SEMANTIC_COLOR.danger}
              size="2"
            >
              Remove
            </Button>
          ) : (
            <Button
              onClick={() => onToggleFavorite?.(nextState)}
              variant="solid"
              color={SEMANTIC_COLOR.primary}
              size="2"
            >
              Save
            </Button>
          )}
        </Flex>
      </Flex>
    </Card>
  );
}

