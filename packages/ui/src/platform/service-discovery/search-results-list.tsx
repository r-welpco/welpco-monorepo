"use client";

import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { Button } from "@welpco/ui/button";
import { Skeleton } from "@welpco/ui/skeleton";
import { Callout } from "@welpco/ui/callout";
import { Box } from "@welpco/ui/box";
import { Heading } from "@welpco/ui/heading";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { SearchEmptyState } from "./search-empty-state";
import { WelperProfileCard, WelperProfileCardProps } from "./welper-profile-card";

export interface SearchResultsListProps {
  items: WelperProfileCardProps[];
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  /** Optional heading when there are results (e.g. "Welpers near you") */
  resultsHeading?: string;
  onRetry?: () => void;
}

export function SearchResultsList({
  items,
  loading,
  error,
  emptyMessage = "No Welpers match your search or filters. Try adjusting your criteria or browse by category.",
  resultsHeading,
  onRetry,
}: SearchResultsListProps) {
  if (loading) {
    return (
      <Flex direction="column" gap="5" style={{ width: "100%", minWidth: 0 }}>
        {[1, 2, 3, 4].map((key) => (
          <Card key={key} size="4" variant="surface" style={{ width: "100%", minWidth: 0 }}>
            <Flex gap="5" align="start">
              <Skeleton width="56px" height="56px" style={{ borderRadius: "var(--radius-3)" }} />
              <Flex direction="column" gap="2" style={{ flex: 1, minWidth: 0 }}>
                <Skeleton width="60%" height="24px" />
                <Skeleton width="40%" height="16px" />
                <Skeleton width="80%" height="16px" />
              </Flex>
            </Flex>
          </Card>
        ))}
      </Flex>
    );
  }

  if (error) {
    return (
      <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
        <Callout.Text>{error}</Callout.Text>
        {onRetry && (
          <Box mt="3">
            <Button onClick={onRetry} color={SEMANTIC_COLOR.primary} size="2">
              Try again
            </Button>
          </Box>
        )}
      </Callout.Root>
    );
  }

  if (items.length === 0) {
    return (
      <SearchEmptyState
        title="No results yet"
        description={emptyMessage}
      />
    );
  }

  return (
    <Flex direction="column" gap="5" style={{ width: "100%", minWidth: 0 }}>
      {resultsHeading && (
        <Box>
          <Heading size="6" trim="start" mb="2">
            {resultsHeading}
          </Heading>
          <Text size="2" color="gray" highContrast>
            {items.length} {items.length === 1 ? "Welper" : "Welpers"} found
          </Text>
        </Box>
      )}
      <Flex direction="column" gap="5">
        {items.map((item) => (
          <WelperProfileCard key={item.welperId ?? `${item.name}-${item.title}`} {...item} />
        ))}
      </Flex>
    </Flex>
  );
}
