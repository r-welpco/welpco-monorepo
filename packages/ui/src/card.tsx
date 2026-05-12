"use client";

import { Card as RadixCard, Heading, Text, Flex } from "@radix-ui/themes";
import { type ComponentPropsWithoutRef, forwardRef } from "react";

export interface CardProps extends ComponentPropsWithoutRef<typeof RadixCard> {
  /** Card title — rendered as `<Heading size="4">` in the header row. */
  title?: string;
  /** Card description — rendered as `<Text size="2" color="gray">` under the title. */
  description?: string;
}

/**
 * Card with an optional header (title + description). Internal spacing is
 * deterministic regardless of which header fields are present, so the card
 * never jumps when content changes.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ title, description, children, size = "4", ...props }, ref) => {
    const hasHeader = Boolean(title || description);

    return (
      <RadixCard ref={ref} size={size} {...props}>
        <Flex direction="column" gap="4">
          {hasHeader && (
            <Flex direction="column" gap="1">
              {title && <Heading size="4">{title}</Heading>}
              {description && (
                <Text size="2" color="gray">
                  {description}
                </Text>
              )}
            </Flex>
          )}
          {children}
        </Flex>
      </RadixCard>
    );
  },
);

Card.displayName = "Card";
