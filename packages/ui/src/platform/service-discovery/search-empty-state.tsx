"use client";

import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Button } from "@welpco/ui/button";
import { Card } from "@welpco/ui/card";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { Search } from "lucide-react";
import { type ReactNode } from "react";

export interface SearchEmptyStateProps {
  /** Main heading (e.g. "No Welpers match your search") */
  title?: string;
  /** Supporting text */
  description?: string;
  /** Primary CTA label and handler (e.g. "Browse categories") */
  primaryAction?: { label: string; onClick: () => void };
  /** Secondary CTA (e.g. "Clear filters") */
  secondaryAction?: { label: string; onClick: () => void };
  /** Optional illustration or icon (default: search icon) */
  icon?: ReactNode;
  /** Compact layout */
  compact?: boolean;
}

/**
 * Empty state shown when a search returns zero results. Bible §17.3 pattern:
 * icon in a subtle colored medallion, short non-apologetic headline,
 * actionable description, one primary + one secondary CTA.
 */
export function SearchEmptyState({
  title = "No Welpers found",
  description = "Try adjusting your search or filters, or browse by category to discover Welpers.",
  primaryAction,
  secondaryAction,
  icon,
  compact = false,
}: SearchEmptyStateProps) {
  const medallionSize = compact ? "56px" : "72px";
  const iconSize = compact ? 24 : 32;

  return (
    <Card size="4" variant="surface" style={{ width: "100%", maxWidth: "560px", minWidth: 0 }}>
      <Flex direction="column" gap="4" align="center">
        {/* Icon in colored medallion for visual anchor */}
        <Flex
          align="center"
          justify="center"
          style={{
            width: medallionSize,
            height: medallionSize,
            borderRadius: "9999px",
            backgroundColor: "var(--gray-3)",
            color: "var(--gray-11)",
          }}
        >
          {icon ?? <Search size={iconSize} aria-hidden="true" />}
        </Flex>

        <Box>
          <Heading size="5" mb="2" align="center" trim="start">
            {title}
          </Heading>
          <Text size="2" color="gray" highContrast align="center" as="p">
            {description}
          </Text>
        </Box>

        {(primaryAction || secondaryAction) && (
          <Flex gap="2" wrap="wrap" justify="center">
            {secondaryAction && (
              <Button
                variant="soft"
                color="gray"
                size="2"
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.label}
              </Button>
            )}
            {primaryAction && (
              <Button
                color={SEMANTIC_COLOR.primary}
                size="2"
                onClick={primaryAction.onClick}
              >
                {primaryAction.label}
              </Button>
            )}
          </Flex>
        )}
      </Flex>
    </Card>
  );
}

SearchEmptyState.displayName = "SearchEmptyState";
