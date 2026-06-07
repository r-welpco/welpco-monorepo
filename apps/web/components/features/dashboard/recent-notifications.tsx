"use client";

import { memo, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Box } from "@welpco/ui/box";
import { Button } from "@welpco/ui/button";
import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Skeleton } from "@welpco/ui/skeleton";
import { Text } from "@welpco/ui/text";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { NotificationCard } from "@welpco/ui/platform/notification";
import { Bell } from "lucide-react";
import { useDateFnsLocale } from "@/lib/i18n/date-fns-locale";
import {
  useDashboardNotificationLabels,
  useRecentNotificationsLabels,
} from "@/lib/i18n/use-dashboard-labels";
import { normalizeDashboardActionUrl } from "@/lib/i18n/dashboard-navigation";
import {
  getNotificationActionUrl,
  mapNotificationToCardProps,
} from "@/lib/notifications/notification-card-mapper";
import { useMarkAsRead, useNotifications } from "@/lib/hooks/use-notifications";
import styles from "./recent-activity.module.css";

const RECENT_NOTIFICATIONS_LIMIT = 20;

export const RecentNotifications = memo(function RecentNotifications() {
  const router = useRouter();
  const labels = useRecentNotificationsLabels();
  const notificationLabels = useDashboardNotificationLabels();
  const dateFnsLocale = useDateFnsLocale();
  const markAsRead = useMarkAsRead();

  const { data: listData, isLoading } = useNotifications({
    page: 1,
    limit: RECENT_NOTIFICATIONS_LIMIT,
  });

  const items = listData?.items ?? [];

  const notifications = useMemo(
    () =>
      items.map((item) =>
        mapNotificationToCardProps(item, {
          viewLabel: notificationLabels.view,
          dateLocale: dateFnsLocale,
        }),
      ),
    [items, notificationLabels.view, dateFnsLocale],
  );

  const handleNotificationAction = useCallback(
    (id: string) => {
      const item = items.find((n) => n.id === id);
      const actionUrl = item ? getNotificationActionUrl(item.metadata) : undefined;
      if (actionUrl) router.push(normalizeDashboardActionUrl(actionUrl));
    },
    [router, items],
  );

  const handleMarkRead = useCallback(
    (id: string) => {
      markAsRead.mutate(id);
    },
    [markAsRead],
  );

  return (
    <Box>
      <Flex align="center" justify="between" gap="3" mb="3" wrap="wrap">
        <Heading as="h2" size="5" trim="start">
          {labels.title}
        </Heading>
        <Button size="1" variant="soft" color="gray" asChild>
          <Link href="/dashboard/notifications">{labels.viewAll}</Link>
        </Button>
      </Flex>

      {isLoading ? (
        <Card size="3" variant="surface" aria-busy="true" aria-live="polite">
          <Flex direction="column" gap="3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height="4.5rem" />
            ))}
          </Flex>
        </Card>
      ) : notifications.length === 0 ? (
        <Card size="3" variant="surface">
          <Flex direction="column" align="center" justify="center" gap="4" py="6" px="4">
            <Box className={styles.iconMedallion} aria-hidden="true">
              <Bell size={24} />
            </Box>
            <Box>
              <Heading as="h3" size="3" align="center" trim="start">
                {labels.emptyTitle}
              </Heading>
              <Text size="2" color="gray" highContrast align="center" as="p" mt="1">
                {labels.emptyDescription}
              </Text>
            </Box>
            <Button size="2" color={SEMANTIC_COLOR.primary} variant="soft" asChild>
              <Link href="/dashboard/notifications">{labels.viewAll}</Link>
            </Button>
          </Flex>
        </Card>
      ) : (
        <Flex direction="column" gap="3">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              {...notification}
              compact
              markAsReadLabel={notificationLabels.markAsRead}
              newBadgeLabel={notificationLabels.newBadge}
              onAction={() => handleNotificationAction(notification.id)}
              onMarkRead={
                notification.isRead ? undefined : () => handleMarkRead(notification.id)
              }
            />
          ))}
        </Flex>
      )}
    </Box>
  );
});
