"use client";

import { memo } from "react";
import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { Box } from "@welpco/ui/box";
import { Grid } from "@welpco/ui/grid";
import { Badge } from "@welpco/ui/badge";
import { Heading } from "@welpco/ui/heading";
import { Skeleton } from "@welpco/ui/skeleton";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { ArrowUpIcon, ArrowDownIcon } from "@radix-ui/react-icons";
import type { DashboardStatItem } from "@/lib/dashboard/booking-dashboard";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down";
  loading?: boolean;
}

const StatCard = memo(function StatCard({ title, value, change, trend, loading }: StatCardProps) {
  return (
    <Card size="3" variant="surface">
      <Flex direction="column" gap="2">
        <Flex gap="2" align="center" justify="between" wrap="wrap">
          <Text size="1" color="gray" highContrast>
            {title}
          </Text>
          {!loading && change != null && change !== "" && trend ? (
            <Badge
              color={trend === "up" ? SEMANTIC_COLOR.success : SEMANTIC_COLOR.danger}
              variant="soft"
              highContrast
              size="1"
            >
              {trend === "up" ? (
                <ArrowUpIcon width="10" height="10" aria-hidden="true" />
              ) : (
                <ArrowDownIcon width="10" height="10" aria-hidden="true" />
              )}
              {change}
            </Badge>
          ) : null}
        </Flex>
        {loading ? (
          <Skeleton height="2rem" width="3.5rem" />
        ) : (
          <Text as="div" size="6" weight="bold">
            {value}
          </Text>
        )}
      </Flex>
    </Card>
  );
});

export interface DashboardStatsProps {
  role: "customer" | "welper";
  /** When provided, shows real metrics. */
  stats?: DashboardStatItem[];
  loading?: boolean;
  /** Shown under the section heading when stats are partial (e.g. paginated list). */
  footnote?: string;
  /** Welper-only section heading from i18n. */
  welperSectionTitle?: string;
}

const FALLBACK_WELPER: DashboardStatItem[] = [
  { title: "Active jobs", value: 0 },
  { title: "Total earnings", value: "$0.00" },
  { title: "Completed jobs", value: 0 },
];

export function DashboardStats({
  role,
  stats: statsProp,
  loading,
  footnote,
  welperSectionTitle,
}: DashboardStatsProps) {
  const stats = statsProp ?? (role === "customer" ? [] : FALLBACK_WELPER);

  // Stat tiles render bare on the page (no wrapping section card) so they
  // compete less for attention than the actionable surfaces above them.
  // Section heading is plain page-level h2 per bible §6/§19.3.
  return (
    <Box aria-busy={loading || undefined} aria-live="polite">
      <Box mb="3">
        <Heading as="h2" size="5" trim="start">
          {welperSectionTitle ?? "Your numbers"}
        </Heading>
        {footnote ? (
          <Text as="p" size="1" color="gray" mt="1">
            {footnote}
          </Text>
        ) : null}
      </Box>

      <Grid columns={{ initial: "2", sm: "3" }} gap="3">
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            trend={stat.trend}
            loading={loading}
          />
        ))}
      </Grid>
    </Box>
  );
}
