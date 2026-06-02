"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Box } from "@welpco/ui/box";
import { Container } from "@welpco/ui/container";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Button } from "@welpco/ui/button";
import { Card } from "@welpco/ui/card";
import { Badge } from "@welpco/ui/badge";
import { Avatar } from "@welpco/ui/avatar";
import { Callout } from "@welpco/ui/callout";
import { ActionConfirmDialog } from "@welpco/ui";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useAuthStore } from "@/stores/authStore";
import {
  useBookings,
  useAcceptBooking,
  useDeclineBooking,
  useCancelBooking,
} from "@/lib/hooks/use-bookings";
import type { BookingStatus, BookingItem } from "@/lib/services/booking-service";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
} from "lucide-react";
import { format, type Locale } from "date-fns";
import { useTranslations } from "next-intl";
import { getStatusColor } from "@/lib/constants/booking";
import {
  useWelperBookingsLabels,
  welperBookingTabLabel,
} from "@/lib/i18n/use-dashboard-labels";
import { useDateFnsLocale } from "@/lib/i18n/date-fns-locale";

// ─── Constants ────────────────────────────────────────────────────────────

// Tabs cover every BFF-emitted status the user can land in. Without a
// "Disputed" tab (and the off-paths Declined / No-show), a customer with one
// of those bookings would have no way to filter to it. Bible §17.3: lists
// must be honest about what's there.
type ConfirmKind = "accept" | "decline" | "cancel";
interface PendingConfirm {
  kind: ConfirmKind;
  bookingId: string;
}

const DEFAULT_LIMIT = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatDateSafe(dateStr: string | null, dateLocale: Locale): string {
  if (!dateStr) return "—";
  try {
    // For date-only strings (YYYY-MM-DD), append T00:00:00 to avoid UTC midnight
    // being displayed as the previous day in western timezones
    const d = dateStr.length === 10 ? new Date(dateStr + "T00:00:00") : new Date(dateStr);
    return format(d, "PPP", { locale: dateLocale });
  } catch {
    return dateStr;
  }
}

function customerDisplayInitials(name: string | null | undefined): string {
  const trimmed = name?.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

function formatBookingAddress(address: Record<string, string> | null | undefined): string | null {
  if (!address) return null;
  const line = [address.line1, address.city, address.region].filter(Boolean).join(", ");
  return line || null;
}

// ─── Component ────────────────────────────────────────────────────────────

const CUSTOMER_STATUS_TABS: Array<{ label: string; value: BookingStatus | undefined }> = [
  { label: "All", value: undefined },
  { label: "Pending", value: "pending" },
  { label: "Upcoming", value: "accepted" },
  { label: "Active", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Declined", value: "declined" },
  { label: "Disputed", value: "disputed" },
];

const WELPER_TAB_VALUES: Array<BookingStatus | undefined> = [
  undefined,
  "pending",
  "accepted",
  "in_progress",
  "completed",
  "cancelled",
  "declined",
  "disputed",
];

export default function BookingsPageClient() {
  const router = useRouter();
  const { user } = useAuthStore();
  const welperLabels = useWelperBookingsLabels();
  const tBookings = useTranslations("dashboard.bookings");
  const dateLocale = useDateFnsLocale();
  const [activeTab, setActiveTab] = useState<BookingStatus | undefined>(
    undefined
  );
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      status: activeTab,
      page,
      limit: DEFAULT_LIMIT,
    }),
    [activeTab, page]
  );

  const { data, isLoading, isError, error } = useBookings(params);
  const acceptMutation = useAcceptBooking();
  const declineMutation = useDeclineBooking();
  const cancelMutation = useCancelBooking();

  const [mutationError, setMutationError] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);

  const bookings = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const isWelper = user?.role === "welper";
  const isCustomer = user?.role === "customer";

  const statusTabs = useMemo(() => {
    if (!isWelper) return CUSTOMER_STATUS_TABS;
    return WELPER_TAB_VALUES.map((value) => ({
      value,
      label: welperBookingTabLabel(welperLabels, value),
    }));
  }, [isWelper, welperLabels]);

  const handleTabChange = useCallback(
    (status: BookingStatus | undefined) => {
      setActiveTab(status);
      setPage(1);
    },
    []
  );

  // Day 11 audit: replaced `window.confirm` + `window.prompt` (both jarring
  // on mobile, neither bible-compliant) with the canonical `<ActionConfirmDialog>`
  // primitive — same component used on the booking detail page (Day 2 Phase 2).
  // The handlers below set `pendingConfirm`; the dialog renders below the list.
  const openConfirm = useCallback((kind: ConfirmKind, bookingId: string) => {
    return (e: React.MouseEvent) => {
      e.stopPropagation();
      setMutationError(null);
      setPendingConfirm({ kind, bookingId });
    };
  }, []);

  const closeConfirm = useCallback(() => {
    setPendingConfirm(null);
  }, []);

  const runAccept = useCallback(
    (bookingId: string) => {
      acceptMutation.mutate(bookingId, {
        onSuccess: () => setPendingConfirm(null),
        onError: (err) => {
          setMutationError(
            err instanceof Error
              ? err.message
              : isWelper
                ? welperLabels.acceptFailed
                : "Failed to accept booking.",
          );
          setPendingConfirm(null);
        },
      });
    },
    [acceptMutation, isWelper, welperLabels.acceptFailed]
  );

  const runDecline = useCallback(
    (bookingId: string, reason?: string) => {
      declineMutation.mutate(
        { bookingId, reason: reason || undefined },
        {
          onSuccess: () => setPendingConfirm(null),
          onError: (err) => {
            setMutationError(
              err instanceof Error
                ? err.message
                : isWelper
                  ? welperLabels.declineFailed
                  : "Failed to decline booking.",
            );
            setPendingConfirm(null);
          },
        },
      );
    },
    [declineMutation, isWelper, welperLabels.declineFailed]
  );

  const runCancel = useCallback(
    (bookingId: string, reason?: string) => {
      cancelMutation.mutate(
        {
          bookingId,
          reason: reason || undefined,
          timezoneOffsetMinutes: -(new Date().getTimezoneOffset()),
        },
        {
          onSuccess: () => setPendingConfirm(null),
          onError: (err) => {
            setMutationError(
              err instanceof Error
                ? err.message
                : isWelper
                  ? welperLabels.cancelFailed
                  : "Failed to cancel booking.",
            );
            setPendingConfirm(null);
          },
        },
      );
    },
    [cancelMutation, isWelper, welperLabels.cancelFailed]
  );

  // ── Not authenticated ──────────────────────────────────────────────────

  if (!user) {
    return (
      <Flex
        direction="column"
        gap="4"
        align="center"
        justify="center"
        style={{ minHeight: "400px" }}
      >
        <Text size="3" color="gray">
          {isWelper ? welperLabels.signInRequired : "Please sign in to view bookings."}
        </Text>
      </Flex>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <Container size="3" px={{ initial: "4", sm: "6" }}>
    <Flex direction="column" gap="6">
      {/* Header */}
      <Box>
        <Heading as="h1" size="7" mb="2" trim="start">
          {isWelper ? welperLabels.title : "Bookings"}
        </Heading>
        <Text as="p" size="3" color="gray">
          {isCustomer
            ? "Manage your service bookings and appointments."
            : welperLabels.subtitle}
        </Text>
      </Box>

      {/* Mutation Error */}
      {mutationError && (
        <Callout.Root color="red" variant="surface">
          <Callout.Text>{mutationError}</Callout.Text>
        </Callout.Root>
      )}

      {/* Status Filter Tabs */}
      <Flex gap="2" wrap="wrap">
        {statusTabs.map((tab) => (
          <Button
            key={tab.label}
            size="2"
            variant={activeTab === tab.value ? "solid" : "soft"}
            color={activeTab === tab.value ? "blue" : "gray"}
            onClick={() => handleTabChange(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </Flex>

      {/* Loading State */}
      {isLoading && (
        <Flex direction="column" gap="3">
          {[1, 2, 3].map((i) => (
            <Card key={i} size="3" variant="surface">
              <Flex direction="column" gap="3" style={{ padding: "8px 0" }}>
                <Box
                  style={{
                    width: "80px",
                    height: "24px",
                    background: "var(--gray-a4)",
                    borderRadius: "var(--radius-2)",
                  }}
                />
                <Box
                  style={{
                    width: "200px",
                    height: "18px",
                    background: "var(--gray-a3)",
                    borderRadius: "var(--radius-2)",
                  }}
                />
                <Box
                  style={{
                    width: "140px",
                    height: "16px",
                    background: "var(--gray-a3)",
                    borderRadius: "var(--radius-2)",
                  }}
                />
              </Flex>
            </Card>
          ))}
        </Flex>
      )}

      {/* Error State */}
      {isError && (
        <Card size="4" variant="surface">
          <Flex
            direction="column"
            align="center"
            gap="3"
            style={{ padding: "48px 24px" }}
          >
            <Text size="3" color="red" weight="medium">
              {isWelper ? welperLabels.loadFailed : "Failed to load bookings"}
            </Text>
            <Text size="2" color="gray">
              {error instanceof Error
                ? error.message
                : isWelper
                  ? welperLabels.genericError
                  : "Something went wrong. Please try again."}
            </Text>
          </Flex>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !isError && bookings.length === 0 && (
        <Card size="4" variant="surface">
          <Flex
            direction="column"
            align="center"
            gap="3"
            style={{ padding: "48px 24px" }}
          >
            <Calendar size={48} color="var(--gray-9)" />
            <Text size="3" weight="medium">
              {isWelper ? welperLabels.emptyTitle : "No bookings found"}
            </Text>
            <Text size="2" color="gray" align="center">
              {activeTab
                ? isWelper
                  ? welperLabels.emptyFiltered(activeTab)
                  : `No ${activeTab.replace(/_/g, " ")} bookings.`
                : isWelper
                  ? welperLabels.emptyAll
                  : "You don't have any bookings yet."}
            </Text>
            {isCustomer && (
              <Button
                size="3"
                color="green"
                onClick={() => router.push("/dashboard/search")}
                style={{ marginTop: "8px" }}
              >
                Browse Services
              </Button>
            )}
          </Flex>
        </Card>
      )}

      {/* Bookings List */}
      {!isLoading && !isError && bookings.length > 0 && (
        <Flex
          direction="column"
          gap="3"
          style={{
            contentVisibility: "auto",
            containIntrinsicSize: "0 800px",
          }}
        >
          {bookings.map((booking: BookingItem) => {
            const customerName =
              booking.customerFirstName?.trim() ||
              (isWelper ? welperLabels.customerFallback : tBookings("customerFallback"));
            const addressLine = formatBookingAddress(booking.address);
            const viewDetailsLabel = isWelper
              ? welperLabels.viewDetails
              : tBookings("viewDetails");

            return (
            <Card
              key={booking.id}
              size="3"
              variant="surface"
            >
              <Flex direction="column" gap="3">
                <Flex
                  align="start"
                  justify="between"
                  gap="3"
                  wrap="wrap"
                  direction={{ initial: "column", sm: "row" }}
                >
                  <Flex align="start" gap="3" style={{ minWidth: 0, flex: 1 }}>
                    {isWelper && (
                      <Avatar
                        size="3"
                        src={booking.customerPhotoUrl ?? undefined}
                        fallback={customerDisplayInitials(customerName)}
                        radius="full"
                        style={{ flexShrink: 0 }}
                      />
                    )}
                    <Flex direction="column" gap="2" style={{ minWidth: 0, flex: 1 }}>
                      {isWelper && (
                        <Text size="3" weight="medium" highContrast>
                          {customerName}
                        </Text>
                      )}
                      <Flex align="center" gap="3" wrap="wrap">
                        <Badge
                          color={getStatusColor(booking.status)}
                          variant="soft"
                          size="2"
                        >
                          <Text
                            size="1"
                            weight="medium"
                            style={{ textTransform: "capitalize" }}
                          >
                            {isWelper
                              ? welperLabels.statusLabel(booking.status)
                              : booking.status.replace(/_/g, " ")}
                          </Text>
                        </Badge>
                        <Text size="2" color="gray">
                          #{booking.id.slice(-8).toUpperCase()}
                        </Text>
                      </Flex>
                    </Flex>
                  </Flex>
                  <Button
                    size="2"
                    variant="outline"
                    color={SEMANTIC_COLOR.primary}
                    onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
                    style={{ flexShrink: 0 }}
                  >
                    {viewDetailsLabel}
                  </Button>
                </Flex>

                <Flex gap="5" wrap="wrap" align="center">
                  {booking.scheduledDate && (
                    <Flex align="center" gap="2">
                      <Calendar size={14} color="var(--gray-9)" />
                      <Text size="2" color="gray">
                        {formatDateSafe(booking.scheduledDate, dateLocale)}
                      </Text>
                    </Flex>
                  )}
                  {booking.scheduledStartTime && (
                    <Flex align="center" gap="2">
                      <Clock size={14} color="var(--gray-9)" />
                      <Text size="2" color="gray">
                        {booking.scheduledStartTime}
                        {booking.scheduledEndTime
                          ? ` – ${booking.scheduledEndTime}`
                          : ""}
                      </Text>
                    </Flex>
                  )}
                  {booking.durationMinutes != null && booking.durationMinutes > 0 && (
                    <Text size="2" color="gray">
                      {booking.durationMinutes < 60
                        ? `${booking.durationMinutes} min`
                        : `${Math.floor(booking.durationMinutes / 60)}h${
                            booking.durationMinutes % 60
                              ? ` ${booking.durationMinutes % 60}m`
                              : ""
                          }`}
                    </Text>
                  )}
                  {booking.totalPrice != null && (
                    <Flex align="center" gap="2">
                      <DollarSign size={14} color="var(--gray-9)" />
                      <Text size="2" color="gray">
                        ${booking.totalPrice.toFixed(2)}
                      </Text>
                    </Flex>
                  )}
                  {addressLine && (
                    <Flex align="center" gap="2" style={{ minWidth: 0, maxWidth: "100%" }}>
                      <MapPin size={14} color="var(--gray-9)" style={{ flexShrink: 0 }} />
                      <Text size="2" color="gray" truncate>
                        {addressLine}
                      </Text>
                    </Flex>
                  )}
                </Flex>

                {booking.notes?.trim() && (
                  <Text
                    size="2"
                    color="gray"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {booking.notes.trim()}
                  </Text>
                )}

                <Text size="1" color="gray">
                  {isWelper
                    ? welperLabels.created(formatDateSafe(booking.createdAt, dateLocale))
                    : `Created ${formatDateSafe(booking.createdAt, dateLocale)}`}
                </Text>

                {(booking.availableActions?.length ?? 0) > 0 && (
                  <Flex gap="2" justify="end" wrap="wrap" style={{ marginTop: "4px" }}>
                    {isWelper && booking.availableActions?.includes("decline") && (
                      <Button
                        size="2"
                        color={SEMANTIC_COLOR.danger}
                        variant="outline"
                        onClick={openConfirm("decline", booking.id)}
                        disabled={declineMutation.isPending}
                      >
                        {welperLabels.decline}
                      </Button>
                    )}
                    {booking.availableActions?.includes("cancel") &&
                      // Hide redundant "Cancel" for the welper when "Decline"
                      // is already shown (PENDING booking) — Decline is the
                      // semantically correct verb for the welper at this state.
                      !(isWelper && booking.availableActions?.includes("decline")) && (
                        <Button
                          size="2"
                          color={SEMANTIC_COLOR.danger}
                          variant="outline"
                          onClick={openConfirm("cancel", booking.id)}
                          disabled={cancelMutation.isPending}
                        >
                          {isWelper ? welperLabels.cancelBooking : "Cancel booking"}
                        </Button>
                      )}
                    {isWelper && booking.availableActions?.includes("accept") && (
                      <Button
                        size="2"
                        color={SEMANTIC_COLOR.primary}
                        variant="solid"
                        onClick={openConfirm("accept", booking.id)}
                        disabled={acceptMutation.isPending}
                      >
                        {welperLabels.accept}
                      </Button>
                    )}
                  </Flex>
                )}
              </Flex>
            </Card>
            );
          })}
        </Flex>
      )}

      {/* Confirm dialogs — same primitive as bookings/[id]. */}
      {pendingConfirm?.kind === "accept" && isWelper && (
        <ActionConfirmDialog
          open
          onOpenChange={(open) => !open && !acceptMutation.isPending && closeConfirm()}
          title={welperLabels.confirm.acceptTitle}
          description={welperLabels.confirm.acceptDescription}
          confirmLabel={welperLabels.confirm.acceptConfirm}
          cancelLabel={welperLabels.confirm.acceptCancel}
          variant="primary"
          pending={acceptMutation.isPending}
          onConfirm={() => runAccept(pendingConfirm.bookingId)}
        />
      )}
      {pendingConfirm?.kind === "decline" && isWelper && (
        <ActionConfirmDialog
          open
          onOpenChange={(open) => !open && !declineMutation.isPending && closeConfirm()}
          title={welperLabels.confirm.declineTitle}
          description={welperLabels.confirm.declineDescription}
          confirmLabel={welperLabels.confirm.declineConfirm}
          cancelLabel={welperLabels.confirm.declineCancel}
          variant="danger"
          pending={declineMutation.isPending}
          reasonField={{
            label: welperLabels.confirm.declineReasonLabel,
            placeholder: welperLabels.confirm.declineReasonPlaceholder,
          }}
          onConfirm={(reason) => runDecline(pendingConfirm.bookingId, reason)}
        />
      )}
      {pendingConfirm?.kind === "cancel" && (
        <ActionConfirmDialog
          open
          onOpenChange={(open) => !open && !cancelMutation.isPending && closeConfirm()}
          title={
            isWelper ? welperLabels.confirm.cancelTitle : "Cancel this booking?"
          }
          description={
            isWelper
              ? welperLabels.confirm.cancelDescription
              : "Cancel more than 24 hours before the start time and the one-hour hold is released with no fee. Cancel within 24 hours of the start time and that hold may be charged as a cancellation fee. Tell us why so we can keep things fair."
          }
          confirmLabel={isWelper ? welperLabels.confirm.cancelConfirm : "Cancel booking"}
          cancelLabel={isWelper ? welperLabels.confirm.cancelCancel : "Keep booking"}
          variant="danger"
          pending={cancelMutation.isPending}
          reasonField={{
            label: isWelper
              ? welperLabels.confirm.cancelReasonLabel
              : "Reason for cancellation",
            placeholder: isWelper
              ? welperLabels.confirm.cancelReasonPlaceholder
              : "e.g. Plans changed, found another welper",
            required: true,
          }}
          onConfirm={(reason) => runCancel(pendingConfirm.bookingId, reason)}
        />
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <Flex gap="2" justify="center" align="center" py="4">
          <Button
            variant="soft"
            color="gray"
            size="2"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label={isWelper ? welperLabels.prevPage : "Previous page"}
          >
            <ChevronLeft size={18} />
          </Button>
          <Text size="2" color="gray">
            {isWelper
              ? welperLabels.pageOf(page, totalPages)
              : `Page ${page} of ${totalPages}`}
          </Text>
          <Button
            variant="soft"
            color="gray"
            size="2"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            aria-label={isWelper ? welperLabels.nextPage : "Next page"}
          >
            <ChevronRight size={18} />
          </Button>
        </Flex>
      )}
    </Flex>
    </Container>
  );
}
