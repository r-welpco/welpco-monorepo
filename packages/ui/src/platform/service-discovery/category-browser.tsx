"use client";

import { Grid } from "@welpco/ui/grid";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { ServiceCategoryCard, ServiceCategoryCardProps } from "./service-category-card";

export interface CategoryBrowserProps {
  /** Optional section heading (e.g. "Browse by category") */
  title?: string;
  /** Optional short description */
  description?: string;
  categories: ServiceCategoryCardProps[];
  /** Grid columns: responsive object (e.g. { initial: "1", sm: "2", md: "3" }) or token "1"-"9" */
  columns?: { initial?: string; sm?: string; md?: string; lg?: string } | string;
}

export function CategoryBrowser({
  title = "Browse by category",
  description = "Find Welpers by service type.",
  categories,
  columns = { initial: "1", sm: "2", md: "3" },
}: CategoryBrowserProps) {
  const gridColumns =
    typeof columns === "string" ? columns : { initial: columns?.initial ?? "1", sm: columns?.sm, md: columns?.md, lg: columns?.lg };

  return (
    <Flex direction="column" gap="5" style={{ width: "100%", minWidth: 0 }}>
      {(title || description) && (
        <Box>
          <Heading size="6" trim="start" mb="2">
            {title}
          </Heading>
          {description && (
            <Text size="2" color="gray" highContrast>
              {description}
            </Text>
          )}
        </Box>
      )}
      <Grid columns={gridColumns} gap="4">
        {categories.map((category) => (
          <ServiceCategoryCard key={category.title} {...category} />
        ))}
      </Grid>
    </Flex>
  );
}
