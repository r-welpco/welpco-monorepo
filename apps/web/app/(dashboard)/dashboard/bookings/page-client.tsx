"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ApiClientError } from "@/lib/api/client";
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
import { getStatusColor } from "@/lib/constants/booking";
import {
  useWelperBookingsLabels,
  useCustomerPreviewLabels,
  welperBookingTabLabel,
} from "@/lib/i18n/use-dashboard-labels";
import { CustomerPreviewDialog } from "@/components/features/dashboard/customer-preview-dialog";
import { useDateFnsLocale } from "@/lib/i18n/date-fns-locale";

// ─── Constants ────────────────────────────────────────────────────────────

// Tabs cover every BFF-emitted status the user can land in. Without a
// "Disputed" tab (and the off-paths Declined / No-show), a customer with one
// of those bookings would have no way to filter to it. Bible §17.3: lists
// must be honest about what's there.
type ConfirmKind = "accept" | "decline" | "cancel" | "modify";
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
  const customerPreviewLabels = useCustomerPreviewLabels();
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
  // Adoption report item 13 / risk D3 — accepting requires a completed Stripe
  // Connect payout account. Set when quick-accept fails with the BFF's stable
  // `PAYOUT_ACCOUNT_REQUIRED` code.
  const [payoutRequired, setPayoutRequired] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [previewCustomerId, setPreviewCustomerId] = useState<string | null>(null);
  const [previewCustomerFallback, setPreviewCustomerFallback] = useState<{
    name: string;
    photoUrl: string | null;
  } | null>(null);

  const bookings = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const isWelper = user?.role === "welper";
  const isCustomer = user?.role === "customer";

  const statusTabs = useMemo(
    () =>
      WELPER_TAB_VALUES.map((value) => ({
        value,
        label: welperBookingTabLabel(welperLabels, value),
      })),
    [welperLabels],
  );

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
      setPayoutRequired(false);
      acceptMutation.mutate(bookingId, {
        onSuccess: () => setPendingConfirm(null),
        onError: (err) => {
          if (
            err instanceof ApiClientError &&
            err.code === "PAYOUT_ACCOUNT_REQUIRED"
          ) {
            setPayoutRequired(true);
          } else {
            setMutationError(
              err instanceof Error
                ? err.message
                : welperLabels.acceptFailed,
            );
          }
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
                  : welperLabels.declineFailed,
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
                  : welperLabels.cancelFailed,
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
          {welperLabels.signInRequired}
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
          {welperLabels.title}
        </Heading>
        <Text as="p" size="3" color="gray">
          {isCustomer ? welperLabels.subtitleCustomer : welperLabels.subtitle}
        </Text>
      </Box>

      {/* Payout account required to accept (adoption report item 13 / risk D3) */}
      {payoutRequired && (
        <Callout.Root color={SEMANTIC_COLOR.warning} variant="surface" role="alert">
          <Flex direction="column" gap="2" align="start">
            <Callout.Text>{welperLabels.payoutRequired}</Callout.Text>
            <Button asChild size="2" color={SEMANTIC_COLOR.warning} variant="soft">
              <Link href="/dashboard/profile?tab=payout">
                {welperLabels.payoutRequiredCta}
              </Link>
            </Button>
          </Flex>
        </Callout.Root>
      )}

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
              {welperLabels.loadFailed}
            </Text>
            <Text size="2" color="gray">
              {error instanceof Error
                ? error.message
                : isWelper
                  ? welperLabels.genericError
                  : welperLabels.genericError}
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
              {welperLabels.emptyTitle}
            </Text>
            <Text size="2" color="gray" align="center">
              {activeTab ? welperLabels.emptyFiltered(activeTab) : welperLabels.emptyAll}
            </Text>
            {isCustomer && (
              <Button
                size="3"
                color="green"
                onClick={() => router.push("/dashboard/search")}
                style={{ marginTop: "8px" }}
              >
                {welperLabels.browseServices}
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
              welperLabels.customerFallback;
            const addressLine = formatBookingAddress(booking.address);
            const viewDetailsLabel = welperLabels.viewDetails;

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
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewCustomerFallback({
                            name: customerName,
                            photoUrl: booking.customerPhotoUrl ?? null,
                          });
                          setPreviewCustomerId(booking.customerId);
                        }}
                        aria-label={customerPreviewLabels.viewCustomerAria}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "var(--space-3)",
                          padding: 0,
                          margin: 0,
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          borderRadius: "var(--radius-2)",
                          minWidth: 0,
                          flexShrink: 0,
                        }}
                      >
                        <Avatar
                          size="3"
                          src={booking.customerPhotoUrl ?? undefined}
                          fallback={customerDisplayInitials(customerName)}
                          radius="full"
                          style={{ flexShrink: 0 }}
                        />
                        <Text size="3" weight="medium" highContrast>
                          {customerName}
                        </Text>
                      </button>
                    )}
                    <Flex direction="column" gap="2" style={{ minWidth: 0, flex: 1 }}>
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
                            {welperLabels.statusLabel(booking.status)}
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
                      {welperLabels.formatDuration(booking.durationMinutes)}
                    </Text>
                  )}
                  {booking.totalPrice != null && (
                    <Flex align="center" gap="2">
                      <DollarSign size={14} color="var(--gray-9)" />
                      <Text size="2" color="gray">
                        {welperLabels.formatCurrency(booking.totalPrice)}
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

                {/* B3 fix — customer-side "what happens next" for pending
                    bookings. List items don't carry the welper's name, so
                    the copy uses "your welper". */}
                {isCustomer && booking.status === "pending" && (
                  <Text size="1" color="gray">
                    {welperLabels.pendingWaitCustomer}
                  </Text>
                )}

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
                  {welperLabels.created(formatDateSafe(booking.createdAt, dateLocale))}
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
                        <>
                          <Button
                            size="2"
                            color="gray"
                            variant="outline"
                            onClick={openConfirm("modify", booking.id)}
                          >
                            {welperLabels.modifyBooking}
                          </Button>
                          <Button
                            size="2"
                            color={SEMANTIC_COLOR.danger}
                            variant="outline"
                            onClick={openConfirm("cancel", booking.id)}
                            disabled={cancelMutation.isPending}
                          >
                            {welperLabels.cancelBooking}
                          </Button>
                        </>
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
          title={welperLabels.confirm.cancelTitle}
          description={
            isWelper
              ? welperLabels.confirm.cancelDescription
              : welperLabels.confirm.cancelDescriptionCustomer
          }
          confirmLabel={welperLabels.confirm.cancelConfirm}
          cancelLabel={welperLabels.confirm.cancelCancel}
          variant="danger"
          pending={cancelMutation.isPending}
          reasonField={{
            label: welperLabels.confirm.cancelReasonLabel,
            placeholder: welperLabels.confirm.cancelReasonPlaceholder,
            required: true,
          }}
          onConfirm={(reason) => runCancel(pendingConfirm.bookingId, reason)}
        />
      )}
      {pendingConfirm?.kind === "modify" && (
        <ActionConfirmDialog
          open
          onOpenChange={(open) => !open && closeConfirm()}
          title={welperLabels.confirm.modifyTitle}
          description={
            isWelper
              ? welperLabels.confirm.modifyDescription
              : welperLabels.confirm.modifyDescriptionCustomer
          }
          confirmLabel={welperLabels.confirm.modifyConfirm}
          cancelLabel={welperLabels.confirm.modifyCancel}
          variant="primary"
          onConfirm={() => closeConfirm()}
        />
      )}

      {isWelper && (
        <CustomerPreviewDialog
          customerId={previewCustomerId}
          open={previewCustomerId !== null}
          onOpenChange={(open) => {
            if (!open) {
              setPreviewCustomerId(null);
              setPreviewCustomerFallback(null);
            }
          }}
          fallbackName={previewCustomerFallback?.name}
          fallbackPhotoUrl={previewCustomerFallback?.photoUrl}
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
            aria-label={welperLabels.prevPage}
          >
            <ChevronLeft size={18} />
          </Button>
          <Text size="2" color="gray">
            {welperLabels.pageOf(page, totalPages)}
          </Text>
          <Button
            variant="soft"
            color="gray"
            size="2"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            aria-label={welperLabels.nextPage}
          >
            <ChevronRight size={18} />
          </Button>
        </Flex>
      )}
    </Flex>
    </Container>
  );
}
