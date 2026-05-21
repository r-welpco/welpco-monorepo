"use client";

import { memo } from "react";
import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Box } from "@welpco/ui/box";
import { Separator } from "@welpco/ui/separator";
import { Avatar } from "@welpco/ui/avatar";
import { Button } from "@welpco/ui/button";
import { Skeleton } from "@welpco/ui/skeleton";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { format } from "date-fns";
import type { Locale } from "date-fns";
import Link from "next/link";
import { useDateFnsLocale } from "@/lib/i18n/date-fns-locale";
import { Search, UserPlus, Activity } from "lucide-react";
import type { DashboardActivityItem } from "@/lib/dashboard/booking-dashboard";
import styles from "./recent-activity.module.css";

type WelperRecentActivityLabels = {
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  completeProfile: string;
};

interface RecentActivityProps {
  activities: DashboardActivityItem[];
  role: "customer" | "welper";
  loading?: boolean;
  welperLabels?: WelperRecentActivityLabels;
}

function ActivityRow({
  activity,
  isLast,
  dateLocale,
}: {
  activity: DashboardActivityItem;
  isLast: boolean;
  dateLocale?: Locale;
}) {
  const inner = (
    <Flex justify="between" align="start" gap="3" py="3" wrap="wrap">
      <Flex gap="3" align="center" flexGrow="1" minWidth="0">
        {activity.user && (
          <Box flexShrink="0">
            <Avatar
              size="3"
              src={activity.user.image}
              fallback={(activity.user.name?.trim()?.[0] ?? "?").toUpperCase()}
            />
          </Box>
        )}
        <Box minWidth="0">
          <Text as="div" size="2" weight="bold">
            {activity.title}
          </Text>
          <Text as="p" size="2" color="gray" highContrast>
            {activity.description}
          </Text>
        </Box>
      </Flex>
      <Box flexShrink="0">
        <Text size="1" color="gray">
          {format(activity.date, "MMM d, h:mm a", dateLocale ? { locale: dateLocale } : undefined)}
        </Text>
      </Box>
    </Flex>
  );

  const row = activity.href ? (
    <Link href={activity.href} className={styles.activityRowLink}>
      {inner}
    </Link>
  ) : (
    inner
  );

  return (
    <Box>
      {row}
      {!isLast && <Separator size="4" />}
    </Box>
  );
}

export const RecentActivity = memo(function RecentActivity({
  activities,
  role,
  loading,
  welperLabels,
}: RecentActivityProps) {
  const dateFnsLocale = useDateFnsLocale();
  const dateLocale = role === "welper" ? dateFnsLocale : undefined;

  return (
    <Box>
      <Heading as="h2" size="5" mb="3" trim="start">
        {role === "welper" && welperLabels ? welperLabels.title : "Recent activity"}
      </Heading>

      {loading ? (
        <Card size="3" variant="surface" aria-busy="true" aria-live="polite">
          <Flex direction="column" gap="3">
            {[0, 1, 2].map((i) => (
              <Box key={i}>
                <Flex justify="between" align="center" gap="3" py="2">
                  <Flex gap="3" align="center" flexGrow="1">
                    <Skeleton width="2.25rem" height="2.25rem" style={{ borderRadius: "999px" }} />
                    <Box flexGrow="1">
                      <Skeleton width="40%" height="0.9rem" />
                      <Box mt="1">
                        <Skeleton width="60%" height="0.8rem" />
                      </Box>
                    </Box>
                  </Flex>
                  <Skeleton width="5rem" height="0.8rem" />
                </Flex>
                {i < 2 && <Separator size="4" />}
              </Box>
            ))}
          </Flex>
        </Card>
      ) : activities.length === 0 ? (
        <Card size="3" variant="surface">
          <Flex direction="column" align="center" justify="center" gap="4" py="6" px="4">
            <Box className={styles.iconMedallion} aria-hidden="true">
              <Activity size={24} />
            </Box>
            <Box>
              <Heading as="h3" size="3" align="center" trim="start">
                {role === "welper" && welperLabels
                  ? welperLabels.emptyTitle
                  : "No activity yet"}
              </Heading>
              <Text size="2" color="gray" highContrast align="center" as="p" mt="1">
                {role === "customer"
                  ? "Bookings and updates show up here."
                  : (welperLabels?.emptyDescription ?? "Jobs and check-ins show up here.")}
              </Text>
            </Box>
            <Button size="2" color={SEMANTIC_COLOR.primary} variant="soft" asChild>
              <Link href={role === "customer" ? "/dashboard/search" : "/dashboard/profile"}>
                {role === "customer" ? (
                  <>
                    <Search size={16} aria-hidden="true" />
                    Find a Welper
                  </>
                ) : (
                  <>
                    <UserPlus size={16} aria-hidden="true" />
                    {welperLabels?.completeProfile ?? "Complete your profile"}
                  </>
                )}
              </Link>
            </Button>
          </Flex>
        </Card>
      ) : (
        <Card size="3" variant="surface">
          <Flex direction="column" gap="0">
            {activities.map((activity, index) => (
              <ActivityRow
                key={activity.id}
                activity={activity}
                isLast={index === activities.length - 1}
                dateLocale={dateLocale}
              />
            ))}
          </Flex>
        </Card>
      )}
    </Box>
  );
});
