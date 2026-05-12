"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Button } from "@welpco/ui/button";
import { Card } from "@welpco/ui/card";
import { Badge } from "@welpco/ui/badge";
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
} from "lucide-react";
import { format } from "date-fns";
import { getStatusColor, formatStatusLabel } from "@/lib/constants/booking";

// ─── Constants ────────────────────────────────────────────────────────────

// Tabs cover every BFF-emitted status the user can land in. Without a
// "Disputed" tab (and the off-paths Declined / No-show), a customer with one
// of those bookings would have no way to filter to it. Bible §17.3: lists
// must be honest about what's there.
const STATUS_TABS: Array<{ label: string; value: BookingStatus | undefined }> = [
  { label: "All", value: undefined },
  { label: "Pending", value: "pending" },
  { label: "Upcoming", value: "accepted" },
  { label: "Active", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Declined", value: "declined" },
  { label: "Disputed", value: "disputed" },
];

type ConfirmKind = "accept" | "decline" | "cancel";
interface PendingConfirm {
  kind: ConfirmKind;
  bookingId: string;
}

const DEFAULT_LIMIT = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatDateSafe(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    // For date-only strings (YYYY-MM-DD), append T00:00:00 to avoid UTC midnight
    // being displayed as the previous day in western timezones
    const d = dateStr.length === 10 ? new Date(dateStr + "T00:00:00") : new Date(dateStr);
    return format(d, "PPP");
  } catch {
    return dateStr;
  }
}

// ─── Component ────────────────────────────────────────────────────────────

export default function BookingsPageClient() {
  const router = useRouter();
  const { user } = useAuthStore();
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
            err instanceof Error ? err.message : "Failed to accept booking.",
          );
          setPendingConfirm(null);
        },
      });
    },
    [acceptMutation]
  );

  const runDecline = useCallback(
    (bookingId: string, reason?: string) => {
      declineMutation.mutate(
        { bookingId, reason: reason || undefined },
        {
          onSuccess: () => setPendingConfirm(null),
          onError: (err) => {
            setMutationError(
              err instanceof Error ? err.message : "Failed to decline booking.",
            );
            setPendingConfirm(null);
          },
        },
      );
    },
    [declineMutation]
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
              err instanceof Error ? err.message : "Failed to cancel booking.",
            );
            setPendingConfirm(null);
          },
        },
      );
    },
    [cancelMutation]
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
          Please sign in to view bookings.
        </Text>
      </Flex>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <Flex direction="column" gap="6">
      {/* Header */}
      <Box>
        <Heading as="h1" size="8" mb="2">
          Bookings
        </Heading>
        <Text as="p" size="3" color="gray">
          {isCustomer
            ? "Manage your service bookings and appointments."
            : "Manage incoming booking requests and jobs."}
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
        {STATUS_TABS.map((tab) => (
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
              Failed to load bookings
            </Text>
            <Text size="2" color="gray">
              {error instanceof Error
                ? error.message
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
              No bookings found
            </Text>
            <Text size="2" color="gray" align="center">
              {activeTab
                ? `No ${formatStatusLabel(activeTab)} bookings.`
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
          {bookings.map((booking: BookingItem) => (
            <Card
              key={booking.id}
              size="3"
              variant="surface"
              style={{ cursor: "pointer" }}
              onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
            >
              <Flex direction="column" gap="3">
                {/* Status + Booking ID */}
                <Flex align="center" justify="between" wrap="wrap" gap="2">
                  <Flex align="center" gap="3">
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
                        {formatStatusLabel(booking.status)}
                      </Text>
                    </Badge>
                    <Text size="2" color="gray">
                      #{booking.id.slice(-8).toUpperCase()}
                    </Text>
                  </Flex>
                </Flex>

                {/* Schedule & Price Info */}
                <Flex gap="5" wrap="wrap" align="center">
                  {booking.scheduledDate && (
                    <Flex align="center" gap="2">
                      <Calendar size={14} color="var(--gray-9)" />
                      <Text size="2" color="gray">
                        {formatDateSafe(booking.scheduledDate)}
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
                  {booking.totalPrice != null && (
                    <Flex align="center" gap="2">
                      <DollarSign size={14} color="var(--gray-9)" />
                      <Text size="2" color="gray">
                        ${booking.totalPrice.toFixed(2)}
                      </Text>
                    </Flex>
                  )}
                </Flex>

                {/* Created Date */}
                <Text size="1" color="gray">
                  Created {formatDateSafe(booking.createdAt)}
                </Text>

                {/* Actions (driven by availableActions from the API).
                    Welper for a PENDING booking gets ONE destructive action
                    (Decline) — not both Decline + Cancel — to avoid the
                    duplicate-destructive-action confusion. The customer keeps
                    Cancel for PENDING (their natural escape hatch). */}
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
                        Decline
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
                          Cancel booking
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
                        Accept
                      </Button>
                    )}
                  </Flex>
                )}
              </Flex>
            </Card>
          ))}
        </Flex>
      )}

      {/* Confirm dialogs — same primitive as bookings/[id]. */}
      {pendingConfirm?.kind === "accept" && (
        <ActionConfirmDialog
          open
          onOpenChange={(open) => !open && !acceptMutation.isPending && closeConfirm()}
          title="Accept this booking?"
          description="We'll place a payment hold on the customer's saved card before confirming. If the hold fails, the booking stays pending."
          confirmLabel="Accept booking"
          cancelLabel="Not now"
          variant="primary"
          pending={acceptMutation.isPending}
          onConfirm={() => runAccept(pendingConfirm.bookingId)}
        />
      )}
      {pendingConfirm?.kind === "decline" && (
        <ActionConfirmDialog
          open
          onOpenChange={(open) => !open && !declineMutation.isPending && closeConfirm()}
          title="Decline this booking?"
          description="Tell the customer why so they can find another welper quickly."
          confirmLabel="Decline"
          cancelLabel="Keep pending"
          variant="danger"
          pending={declineMutation.isPending}
          reasonField={{
            label: "Reason (optional)",
            placeholder: "e.g. Schedule conflict on that day",
          }}
          onConfirm={(reason) => runDecline(pendingConfirm.bookingId, reason)}
        />
      )}
      {pendingConfirm?.kind === "cancel" && (
        <ActionConfirmDialog
          open
          onOpenChange={(open) => !open && !cancelMutation.isPending && closeConfirm()}
          title="Cancel this booking?"
          description="Free cancellation up to 24 hours before the start time. Tell us why so we can keep things fair."
          confirmLabel="Cancel booking"
          cancelLabel="Keep booking"
          variant="danger"
          pending={cancelMutation.isPending}
          reasonField={{
            label: "Reason for cancellation",
            placeholder: "e.g. Plans changed, found another welper",
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
            aria-label="Previous page"
          >
            <ChevronLeft size={18} />
          </Button>
          <Text size="2" color="gray">
            Page {page} of {totalPages}
          </Text>
          <Button
            variant="soft"
            color="gray"
            size="2"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={18} />
          </Button>
        </Flex>
      )}
    </Flex>
  );
}
