"use client";

import { Card as RadixCard, Box, Heading, Text, Flex } from "@radix-ui/themes";
import { type ComponentPropsWithoutRef, forwardRef } from "react";

export interface CardProps extends ComponentPropsWithoutRef<typeof RadixCard> {
  title?: string;
  description?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ title, description, children, size = "3", ...props }, ref) => {
    return (
      <RadixCard ref={ref} size={size} {...props}>
        {(title || description || children) && (
          <Flex direction="column" gap={title && description ? "4" : title || description ? "0" : "0"}>
            {(title || description) && (
              <Box>
                {title && (
                  <Heading size="4" mb={description ? "2" : "0"}>
                    {title}
                  </Heading>
                )}
                {description && (
                  <Text size="2" color="gray">
                    {description}
                  </Text>
                )}
              </Box>
            )}
            {children}
          </Flex>
        )}
      </RadixCard>
    );
  }
);

Card.displayName = "Card";

