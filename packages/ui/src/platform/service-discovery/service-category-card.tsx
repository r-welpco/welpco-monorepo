"use client";

import { Card } from "@welpco/ui/card";
import { Badge } from "@welpco/ui/badge";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { type ReactNode } from "react";

export interface ServiceCategoryCardProps {
  title: string;
  description?: string;
  servicesCount?: number;
  icon?: ReactNode;
  onSelect?: () => void;
}

export function ServiceCategoryCard({
  title,
  description,
  servicesCount,
  icon,
  onSelect,
}: ServiceCategoryCardProps) {
  const isInteractive = Boolean(onSelect);

  return (
    <Card
      size="3"
      variant="surface"
      style={{
        width: "100%",
        minWidth: 0,
        cursor: isInteractive ? "pointer" : "default",
      }}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (isInteractive && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect?.();
        }
      }}
      tabIndex={isInteractive ? 0 : undefined}
      role={isInteractive ? "button" : undefined}
      aria-label={isInteractive ? `Browse ${title}` : undefined}
    >
      <Flex direction="column" gap="3" style={{ minWidth: 0 }}>
        <Flex align="start" gap="3">
          {icon && (
            <Box flexShrink="0" style={{ width: "28px", height: "28px" }}>
              {icon}
            </Box>
          )}
          <Box flexGrow="1" style={{ minWidth: 0 }}>
            <Heading size="4" weight="bold" trim="start" mb="1">
              {title}
            </Heading>
            {servicesCount !== undefined && (
              <Badge color="green" variant="soft" size="1">
                {servicesCount} {servicesCount === 1 ? "service" : "services"}
              </Badge>
            )}
          </Box>
        </Flex>
        {description && (
          <Text size="2" color="gray" highContrast>
            {description}
          </Text>
        )}
      </Flex>
    </Card>
  );
}
