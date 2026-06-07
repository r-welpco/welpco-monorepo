import { formatDistanceToNow } from "date-fns";
import type { Locale } from "date-fns";
import type { NotificationCardProps } from "@welpco/ui/platform/notification";
import type { NotificationItem } from "@/lib/services/notification-service";

/** Maps BFF `NotificationCategory` to platform card visual type. */
export const NOTIFICATION_CATEGORY_TO_CARD_TYPE: Record<
  string,
  NotificationCardProps["type"]
> = {
  booking: "booking",
  payment: "payment",
  review: "info",
  message: "message",
  dispute: "warning",
  job: "info",
  security: "warning",
  system: "info",
};

export function getNotificationCategoryCardType(
  category: string,
): NotificationCardProps["type"] {
  return NOTIFICATION_CATEGORY_TO_CARD_TYPE[category] ?? "info";
}

export function getNotificationActionUrl(
  metadata: Record<string, unknown> | null | undefined,
): string | undefined {
  if (!metadata || typeof metadata.actionUrl !== "string") return undefined;
  const trimmed = metadata.actionUrl.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function mapNotificationToCardProps(
  item: NotificationItem,
  options: {
    viewLabel: string;
    dateLocale?: Locale;
  },
): NotificationCardProps {
  const actionUrl = getNotificationActionUrl(item.metadata);
  return {
    id: item.id,
    title: item.title,
    message: item.body,
    type: getNotificationCategoryCardType(item.category),
    timestamp: formatDistanceToNow(new Date(item.createdAt), {
      addSuffix: true,
      locale: options.dateLocale,
    }),
    isRead: item.isRead,
    actionLabel: actionUrl ? options.viewLabel : undefined,
  };
}
