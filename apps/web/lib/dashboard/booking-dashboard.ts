import { format } from "date-fns";
import type { Locale } from "date-fns";
import type { BookingItem } from "@/lib/services/booking-service";
import { formatStatusLabel } from "@/lib/constants/booking";

export type DashboardActivityItem = {
  id: string;
  type: "booking";
  title: string;
  description: string;
  date: Date;
  href: string;
  user?: { name: string; image?: string };
};

const ACTIVE_STATUSES = new Set<BookingItem["status"]>(["pending", "accepted", "in_progress"]);
const COMPLETED_STATUSES = new Set<BookingItem["status"]>(["completed", "payment_released"]);

/**
 * Bookings that have a future scheduled date and aren't cancelled/declined.
 * Drives the "You have N upcoming bookings" subtitle.
 */
export function countUpcomingBookings(bookings: BookingItem[]): number {
  const now = Date.now();
  return bookings.filter((b) => {
    if (!b.scheduledDate) return false;
    if (b.status === "cancelled" || b.status === "declined") return false;
    const scheduled = b.scheduledDate.length === 10
      ? new Date(`${b.scheduledDate}T23:59:59`).getTime()
      : new Date(b.scheduledDate).getTime();
    return Number.isFinite(scheduled) && scheduled >= now;
  }).length;
}

/**
 * Welper-side: bookings the welper hasn't accepted yet. These need their action.
 * Surfaced in the "Needs your attention" zone.
 */
export function countPendingForWelper(bookings: BookingItem[]): number {
  return bookings.filter((b) => b.status === "pending").length;
}

function formatBookingDate(dateStr: string | null, dateLocale?: Locale): string {
  if (!dateStr) return "";
  try {
    const d = dateStr.length === 10 ? new Date(`${dateStr}T00:00:00`) : new Date(dateStr);
    return format(d, "MMM d, yyyy", dateLocale ? { locale: dateLocale } : undefined);
  } catch {
    return dateStr;
  }
}

export function buildDashboardActivities(
  bookings: BookingItem[],
  role: "customer" | "welper",
  limit = 8,
  options?: {
    jobTitle?: string;
    formatStatus?: (status: string) => string;
    dateLocale?: Locale;
  },
): DashboardActivityItem[] {
  const sorted = [...bookings].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  const formatStatus = options?.formatStatus ?? formatStatusLabel;
  return sorted.slice(0, limit).map((b) => {
    const statusLabel = formatStatus(b.status);
    const when = formatBookingDate(b.scheduledDate, options?.dateLocale);
    const title = role === "customer" ? "Booking" : (options?.jobTitle ?? "Job");
    const parts = [statusLabel];
    if (when) parts.push(when);
    return {
      id: b.id,
      type: "booking",
      title,
      description: parts.join(" · "),
      date: new Date(b.updatedAt),
      href: `/dashboard/bookings/${b.id}`,
    };
  });
}

export type DashboardStatItem = {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down";
};

export function computeCustomerStatsFromBookings(
  bookings: BookingItem[],
  favoriteWelperCount: number,
): DashboardStatItem[] {
  const active = bookings.filter((b) => ACTIVE_STATUSES.has(b.status)).length;
  const completed = bookings.filter((b) => COMPLETED_STATUSES.has(b.status));
  const servicesUsed = completed.length;

  return [
    { title: "Active bookings", value: active },
    { title: "Bookings completed", value: servicesUsed },
    { title: "Favorite Welpers", value: favoriteWelperCount },
  ];
}

export function computeWelperStatsFromBookings(
  bookings: BookingItem[],
  labels: {
    activeJobs: string;
    totalEarnings: string;
    completedJobs: string;
  },
): DashboardStatItem[] {
  const active = bookings.filter((b) => ACTIVE_STATUSES.has(b.status)).length;
  const completed = bookings.filter((b) => COMPLETED_STATUSES.has(b.status));
  const completedCount = completed.length;
  const earnings = completed.reduce((sum, b) => sum + (typeof b.totalPrice === "number" ? b.totalPrice : 0), 0);
  const earningsLabel = earnings > 0 ? `$${earnings.toFixed(2)}` : "$0.00";

  // Rating tile intentionally omitted: BFF doesn't surface a welper-aggregate
  // rating yet, and a placeholder em-dash reads as "we have nothing for you"
  // (bible §22.6 — no fake/empty social proof). Reintroduce when BFF exposes it.
  return [
    { title: labels.activeJobs, value: active },
    { title: labels.totalEarnings, value: earningsLabel },
    { title: labels.completedJobs, value: completedCount },
  ];
}
