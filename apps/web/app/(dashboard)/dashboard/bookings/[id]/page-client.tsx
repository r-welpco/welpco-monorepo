"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box } from "@welpco/ui/box";
import { Container } from "@welpco/ui/container";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Button } from "@welpco/ui/button";
import { Card } from "@welpco/ui/card";
import { Badge } from "@welpco/ui/badge";
import { Skeleton } from "@welpco/ui/skeleton";
import { Callout } from "@welpco/ui/callout";
import { Separator } from "@welpco/ui/separator";
import { Avatar } from "@welpco/ui/avatar";
import { TextArea } from "@welpco/ui/text-area";
import { TextField } from "@welpco/ui/text-field";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import Link from "next/link";
import {
  RatingForm,
  Dialog,
  DialogContent,
  DisputeForm,
  DisputeStatusBadge,
  ActionConfirmDialog,
} from "@welpco/ui";
import { useAuthStore } from "@/stores/authStore";
import { useQueryClient } from "@tanstack/react-query";
import {
  useBookingById,
  useAcceptBooking,
  useDeclineBooking,
  useCancelBooking,
  useCheckInBooking,
  useServiceReceiptDraft,
  useSubmitServiceReceipt,
} from "@/lib/hooks/use-bookings";
import {
  useBookingReview,
  useCreateBookingReview,
  useUpdateBookingReview,
} from "@/lib/hooks/use-booking-review";
import {
  useBookingDispute,
  useCreateDispute,
} from "@/lib/hooks/use-disputes";
import { uploadDisputeEvidence } from "@/lib/services/dispute-evidence-upload-service";
import { useCreateBookingPaymentIntent } from "@/lib/hooks/use-payments";
import { loadStripe } from "@stripe/stripe-js";
import { usePublicWelperProfile } from "@/lib/hooks/use-service-discovery";
import { useBookableAction } from "@/lib/hooks/use-bookable-action";
import { EmailVerificationRequiredDialog } from "@/components/features/dashboard/email-verification-required-dialog";
import { EmailVerificationRequiredError } from "@/lib/api/client";
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  FileText,
  MessageCircle,
  Receipt,
  Download,
  Paperclip,
} from "lucide-react";
import { Tooltip } from "@welpco/ui/tooltip";
import type { ReceiptEvidenceFile } from "@/lib/services/booking-service";
import { format } from "date-fns";
import { getStatusColor, formatStatusLabel } from "@/lib/constants/booking";
import styles from "./booking-detail.module.css";

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    // For date-only strings (YYYY-MM-DD), append T00:00:00 to avoid UTC midnight
    // being displayed as the previous day in western timezones
    const d = dateStr.length === 10 ? new Date(dateStr + "T00:00:00") : new Date(dateStr);
    return format(d, dateStr.length === 10 ? "PPP" : "PPP 'at' p");
  } catch {
    return dateStr;
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = dateStr.length === 10 ? new Date(dateStr + "T00:00:00") : new Date(dateStr);
    return format(d, "PPP");
  } catch {
    return dateStr;
  }
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function previewReceiptTotalCents(checkInLocal: string, checkOutLocal: string, hourlyRate: number): number {
  const a = new Date(checkInLocal).getTime();
  const b = new Date(checkOutLocal).getTime();
  if (!checkInLocal || !checkOutLocal || Number.isNaN(a) || Number.isNaN(b) || b <= a) return 0;
  const hours = (b - a) / (1000 * 60 * 60);
  return Math.round(hours * hourlyRate * 100);
}

/** Capitalize the first letter — keeps casing predictable without inline `textTransform`. */
function startCase(input: string): string {
  if (!input) return input;
  return input.charAt(0).toUpperCase() + input.slice(1);
}

const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "heic",
]);

/**
 * Wave 2 (BFF): pull a human filename from the S3 key (which is opaque). The
 * key shape is typically `evidence/<bookingId>/<uuid>-<original-name.ext>`,
 * but we only rely on "everything after the last slash". Falls back to the
 * raw key when there's no slash.
 */
function evidenceFilename(file: ReceiptEvidenceFile): string {
  const tail = file.key.split("/").pop() ?? file.key;
  return tail || "Attachment";
}

function isImageEvidence(file: ReceiptEvidenceFile): boolean {
  const dot = file.key.lastIndexOf(".");
  if (dot === -1) return false;
  const ext = file.key.slice(dot + 1).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const cadFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
});

// ─── Types ────────────────────────────────────────────────────────────────

interface BookingDetailClientProps {
  bookingId: string;
}

interface TimelineEvent {
  label: string;
  date: string | null;
}

type ConfirmKind = "accept" | "decline" | "check-in" | "cancel";

// ─── Sub-components ───────────────────────────────────────────────────────

/**
 * Renders the welper's attached evidence files (Wave 2 BFF wire).
 *
 * - Images get a thumbnail grid; click → open the presigned URL in a new tab.
 * - Non-images get a file row with a download icon + filename.
 * - When `signedUrl === null` (presigner degraded), the tile/row is shown but
 *   disabled with a tooltip explaining the file isn't downloadable right now.
 *   We never hide the metadata — bible §22.6: be honest about what's there.
 *
 * Click → new tab. No lightbox, no inline preview (bible §15.5: don't over-build
 * low-frequency surfaces).
 */
function ReceiptEvidenceSection({ files }: { files: ReceiptEvidenceFile[] }) {
  const images = files.filter(isImageEvidence);
  const others = files.filter((f) => !isImageEvidence(f));

  return (
    <Flex direction="column" gap="3">
      <Text size="1" color="gray" weight="medium">
        Attached evidence
      </Text>

      {images.length > 0 ? (
        <Box className={styles.evidenceGrid}>
          {images.map((file, idx) => {
            const filename = evidenceFilename(file);
            const key = file.id ?? `${file.key}-${idx}`;
            if (!file.signedUrl) {
              return (
                <Tooltip key={key} content="Preview unavailable right now">
                  <Box
                    className={`${styles.evidenceThumb} ${styles.evidenceThumbDisabled}`}
                    aria-label={`${filename} — preview unavailable`}
                    aria-disabled="true"
                  />
                </Tooltip>
              );
            }
            return (
              <a
                key={key}
                href={file.signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View evidence file ${filename} (opens in a new tab)`}
                className={styles.evidenceThumb}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={file.signedUrl} alt={filename} loading="lazy" />
              </a>
            );
          })}
        </Box>
      ) : null}

      {others.length > 0 ? (
        <Box className={styles.evidenceFileList}>
          {others.map((file, idx) => {
            const filename = evidenceFilename(file);
            const key = file.id ?? `${file.key}-${idx}`;
            if (!file.signedUrl) {
              return (
                <Tooltip key={key} content="Preview unavailable right now">
                  <Box
                    className={`${styles.evidenceFileRow} ${styles.evidenceFileRowDisabled}`}
                    aria-label={`${filename} — preview unavailable`}
                    aria-disabled="true"
                  >
                    <Paperclip size={16} aria-hidden />
                    <Text size="2" className={styles.truncate ?? ""}>
                      {filename}
                    </Text>
                  </Box>
                </Tooltip>
              );
            }
            return (
              <a
                key={key}
                href={file.signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Download evidence file ${filename} (opens in a new tab)`}
                className={styles.evidenceFileRow}
              >
                <Download size={16} aria-hidden />
                <Text size="2">{filename}</Text>
              </a>
            );
          })}
        </Box>
      ) : null}
    </Flex>
  );
}

// ─── Component ────────────────────────────────────────────────────────────

export default function BookingDetailClient({
  bookingId,
}: BookingDetailClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { data: booking, isLoading, isError, error } = useBookingById(bookingId);
  const { data: welperProfile } = usePublicWelperProfile(
    booking?.welperId ?? null,
  );

  const [mutationError, setMutationError] = useState<string | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<"customer" | "welper" | null>(null);
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [paymentActionError, setPaymentActionError] = useState<string | null>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [billingInLocal, setBillingInLocal] = useState("");
  const [billingOutLocal, setBillingOutLocal] = useState("");
  const [receiptNotes, setReceiptNotes] = useState("");
  const [confirmKind, setConfirmKind] = useState<ConfirmKind | null>(null);

  const acceptMutation = useAcceptBooking();
  const declineMutation = useDeclineBooking();
  const cancelMutation = useCancelBooking();
  const checkInMutation = useCheckInBooking();
  const submitReceiptMutation = useSubmitServiceReceipt();

  // Day 15 Dispatch C — bookable-action wrapper. Wraps the BFF
  // `EmailVerifiedGuard` 403 into a focused dialog with a one-click resend.
  // Each mutation's `onError` checks `EmailVerificationRequiredError`
  // explicitly so the existing inline error UI keeps handling everything else.
  const bookable = useBookableAction();
  const handleBookableError = useCallback(
    (err: unknown, fallback: string): string | null => {
      if (err instanceof EmailVerificationRequiredError) {
        bookable.setDialogOpen(true);
        return null;
      }
      return err instanceof Error ? err.message : fallback;
    },
    [bookable],
  );

  const { data: bookingReview, isSuccess: reviewQuerySuccess } = useBookingReview(bookingId);
  const createReviewMutation = useCreateBookingReview(bookingId);
  const updateReviewMutation = useUpdateBookingReview(bookingId);

  const { data: bookingDispute, isSuccess: disputeQuerySuccess } = useBookingDispute(bookingId);
  const createDisputeMutation = useCreateDispute(bookingId);
  const bookingPayIntentMutation = useCreateBookingPaymentIntent(bookingId);

  const disputableStatuses = ["in_progress", "completed", "payment_released", "no_show"];
  const canDispute =
    booking &&
    user?.id &&
    (booking.customerId === user.id || booking.welperId === user.id) &&
    disputableStatuses.includes(booking.status);
  const hasDispute = disputeQuerySuccess && bookingDispute != null;

  const isWelper = user?.role === "welper";
  const isCustomer = user?.role === "customer";
  const actions = booking?.availableActions ?? [];

  const { data: receiptDraft, isLoading: receiptDraftLoading } = useServiceReceiptDraft(bookingId, {
    enabled: receiptDialogOpen && isWelper && actions.includes("check-out"),
  });

  useEffect(() => {
    if (!receiptDraft || receiptDraft.confirmedReceipt || !receiptDialogOpen) return;
    setBillingInLocal(isoToDatetimeLocal(receiptDraft.suggestedBillingCheckInAt));
    setBillingOutLocal(isoToDatetimeLocal(receiptDraft.suggestedBillingCheckOutAt));
  }, [
    receiptDialogOpen,
    receiptDraft,
    receiptDraft?.confirmedReceipt,
    receiptDraft?.suggestedBillingCheckInAt,
    receiptDraft?.suggestedBillingCheckOutAt,
  ]);

  const receiptPreviewCents = useMemo(() => {
    if (!receiptDraft || receiptDraft.confirmedReceipt) return 0;
    return previewReceiptTotalCents(billingInLocal, billingOutLocal, receiptDraft.hourlyRate);
  }, [receiptDraft, billingInLocal, billingOutLocal]);

  const paymentPhase = booking?.paymentPhase ?? "none";
  const needsCustomerAuthorization =
    !!booking &&
    isCustomer &&
    user?.id === booking.customerId &&
    booking.status === "accepted" &&
    booking.totalPrice != null &&
    booking.totalPrice > 0;
  /** Manual authorize only if hold did not complete at accept (legacy rows or rare edge cases). */
  const showAuthorizePayment =
    needsCustomerAuthorization &&
    (paymentPhase === "none" ||
      paymentPhase === "pending" ||
      paymentPhase === "requires_action" ||
      paymentPhase === "failed");

  const showReceiptBalancePayment =
    !!booking &&
    isCustomer &&
    user?.id === booking.customerId &&
    booking.status === "completed" &&
    paymentPhase === "requires_action";

  const showPaymentCard =
    !!booking && (needsCustomerAuthorization || showReceiptBalancePayment);

  const showLocationCard =
    !!booking &&
    ((booking.address && Object.keys(booking.address).length > 0) ||
      !!booking.notes ||
      (booking.answers && Object.keys(booking.answers).length > 0));

  const handleAuthorizePayment = useCallback(async () => {
    if (!bookingId) return;
    setPaymentActionError(null);
    try {
      const res = await bookingPayIntentMutation.mutateAsync();
      const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (res.requiresAction && res.clientSecret && pk) {
        const stripe = await loadStripe(pk);
        if (!stripe) {
          throw new Error("Payment UI could not load. Check Stripe configuration.");
        }
        const { error } = await stripe.confirmCardPayment(res.clientSecret);
        if (error) throw new Error(error.message ?? "Authentication failed");
      }
    } catch (e) {
      // Day 15 Dispatch C — payment-intent creation is `EmailVerifiedGuard`-gated
      // BFF-side; surface the verification dialog instead of a generic error.
      if (e instanceof EmailVerificationRequiredError) {
        bookable.setDialogOpen(true);
        return;
      }
      setPaymentActionError(e instanceof Error ? e.message : "Payment authorization failed");
    }
  }, [bookingId, bookingPayIntentMutation, bookable]);

  const handleCompleteReceiptBalance = useCallback(async () => {
    if (!bookingId || !booking?.paymentClientSecret) return;
    setPaymentActionError(null);
    try {
      const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (!pk) throw new Error("Stripe is not configured.");
      const stripe = await loadStripe(pk);
      if (!stripe) throw new Error("Payment UI could not load.");
      const { error } = await stripe.confirmCardPayment(booking.paymentClientSecret);
      if (error) throw new Error(error.message ?? "Payment failed");
      await queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
    } catch (e) {
      setPaymentActionError(e instanceof Error ? e.message : "Payment failed");
    }
  }, [bookingId, booking?.paymentClientSecret, queryClient]);

  // Derive welper display name
  const welperDisplayName = useMemo(() => {
    if (!welperProfile) return null;
    return (
      [welperProfile.firstName, welperProfile.lastName]
        .filter(Boolean)
        .join(" ") || null
    );
  }, [welperProfile]);

  // Derive service offering name from welper profile
  const serviceOfferingName = useMemo(() => {
    if (!welperProfile?.serviceOfferings || !booking?.serviceOfferingId)
      return null;
    const offering = welperProfile.serviceOfferings.find(
      (o) => o.id === booking.serviceOfferingId,
    );
    if (!offering) return null;
    return offering.parentCategoryName
      ? `${offering.categoryName} · ${offering.parentCategoryName}`
      : offering.categoryName;
  }, [welperProfile, booking?.serviceOfferingId]);

  const handleBack = useCallback(() => {
    router.push("/dashboard/bookings");
  }, [router]);

  // Build timeline events from booking timestamps
  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    if (!booking) return [];

    const events: TimelineEvent[] = [
      { label: "Created", date: booking.createdAt },
    ];

    if (booking.acceptedAt) {
      events.push({ label: "Accepted", date: booking.acceptedAt });
    }

    if (booking.checkedInAt) {
      events.push({ label: "Checked in", date: booking.checkedInAt });
    }

    if (booking.checkedOutAt) {
      events.push({ label: "Checked out", date: booking.checkedOutAt });
    }

    if (booking.serviceReceipt) {
      const receiptAt =
        booking.serviceReceipt.sentToCustomerAt ??
        booking.serviceReceipt.confirmedAt;
      events.push({ label: "Receipt sent", date: receiptAt });
    }

    if (booking.completedAt) {
      events.push({ label: "Completed", date: booking.completedAt });
    }

    if (booking.cancelledAt) {
      events.push({ label: "Cancelled", date: booking.cancelledAt });
    }

    if (booking.declinedAt) {
      events.push({ label: "Declined", date: booking.declinedAt });
    }

    return events;
  }, [booking]);

  // ── Loading skeleton ───────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Container size="3" px={{ initial: "4", sm: "6" }}>
        <Flex direction="column" gap="6">
          <Box>
            <Button
              variant="ghost"
              color="gray"
              size="2"
              onClick={handleBack}
            >
              <ArrowLeft size={16} aria-hidden />
              Back to bookings
            </Button>
          </Box>

          <Card size="4" variant="surface">
            <Flex direction="column" gap="4">
              <Skeleton width="120px" height="28px" />
              <Skeleton width="60%" height="20px" />
              <Skeleton width="40%" height="18px" />
              <Skeleton width="80%" height="18px" />
              <Skeleton width="50%" height="18px" />
            </Flex>
          </Card>

          <Card size="3" variant="surface">
            <Flex direction="column" gap="4">
              <Skeleton width="100px" height="22px" />
              <Skeleton width="70%" height="16px" />
              <Skeleton width="70%" height="16px" />
              <Skeleton width="70%" height="16px" />
            </Flex>
          </Card>
        </Flex>
      </Container>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────

  if (isError || !booking) {
    return (
      <Container size="3" px={{ initial: "4", sm: "6" }}>
        <Flex direction="column" gap="6">
          <Box>
            <Button
              variant="ghost"
              color="gray"
              size="2"
              onClick={handleBack}
            >
              <ArrowLeft size={16} aria-hidden />
              Back to bookings
            </Button>
          </Box>

          <Card size="4" variant="surface">
            <Flex direction="column" align="center" gap="3" py="7" px="5">
              <Heading as="h2" size="5" mb="0" trim="start">
                {isError ? "We couldn't load this booking" : "Booking not found"}
              </Heading>
              <Text size="2" color="gray" align="center">
                {error instanceof Error
                  ? error.message
                  : "Try again, or head back to your bookings list."}
              </Text>
              <Button
                size="2"
                variant="soft"
                color="gray"
                onClick={handleBack}
                mt="2"
              >
                Back to bookings
              </Button>
            </Flex>
          </Card>
        </Flex>
      </Container>
    );
  }

  const bookingAllowsReview =
    booking.status === "completed" || booking.status === "payment_released";

  const canShowReviewInActions =
    reviewQuerySuccess &&
    !reviewDialogOpen &&
    bookingAllowsReview &&
    ((isCustomer && user?.id === booking.customerId) ||
      (isWelper && user?.id === booking.welperId));

  const showLeaveReviewAction = canShowReviewInActions && bookingReview === null;

  const showExistingReviewInActions = canShowReviewInActions && bookingReview != null;

  const openNewReviewDialog = () => {
    setReviewTarget(isWelper ? "customer" : "welper");
    setReviewDialogOpen(true);
  };

  const openEditReviewDialog = () => {
    if (!bookingReview) return;
    setReviewTarget(bookingReview.reviewerType === "customer" ? "welper" : "customer");
    setReviewDialogOpen(true);
  };

  const reviewMutationError =
    (createReviewMutation.error instanceof Error
      ? createReviewMutation.error.message
      : undefined) ??
    (updateReviewMutation.error instanceof Error
      ? updateReviewMutation.error.message
      : undefined);

  const reviewMutationPending =
    createReviewMutation.isPending || updateReviewMutation.isPending;

  // ── Confirm dialog config ──────────────────────────────────────────────
  // Centralizes the per-action copy + handler so the JSX stays clean.

  const confirmConfig: Record<
    ConfirmKind,
    {
      title: string;
      description: string;
      confirmLabel: string;
      cancelLabel: string;
      variant: "primary" | "danger";
      reasonField?: { label: string; placeholder?: string; required?: boolean };
      pending: boolean;
      onConfirm: (reason?: string) => void;
    }
  > = {
    accept: {
      title: "Accept this booking?",
      description:
        "We'll place a payment hold on the customer's saved card before confirming. If the hold fails, the booking stays pending.",
      confirmLabel: "Accept booking",
      cancelLabel: "Not now",
      variant: "primary",
      pending: acceptMutation.isPending,
      onConfirm: () => {
        setMutationError(null);
        acceptMutation.mutate(bookingId, {
          onSuccess: () => setConfirmKind(null),
          onError: (err) => {
            setMutationError(handleBookableError(err, "Failed to accept booking."));
            setConfirmKind(null);
          },
        });
      },
    },
    decline: {
      title: "Decline this booking?",
      description:
        "Tell the customer why so they can find another welper quickly.",
      confirmLabel: "Decline",
      cancelLabel: "Keep pending",
      variant: "danger",
      reasonField: {
        label: "Reason (optional)",
        placeholder: "e.g. Schedule conflict on that day",
      },
      pending: declineMutation.isPending,
      onConfirm: (reason) => {
        setMutationError(null);
        declineMutation.mutate(
          { bookingId, reason: reason || undefined },
          {
            onSuccess: () => setConfirmKind(null),
            onError: (err) => {
              setMutationError(handleBookableError(err, "Failed to decline booking."));
              setConfirmKind(null);
            },
          },
        );
      },
    },
    "check-in": {
      title: "Check in now?",
      description:
        "This starts the service. The customer will be notified you're on the clock.",
      confirmLabel: "Check in",
      cancelLabel: "Not yet",
      variant: "primary",
      pending: checkInMutation.isPending,
      onConfirm: () => {
        setMutationError(null);
        checkInMutation.mutate(bookingId, {
          onSuccess: () => setConfirmKind(null),
          onError: (err) => {
            setMutationError(handleBookableError(err, "Failed to check in."));
            setConfirmKind(null);
          },
        });
      },
    },
    cancel: {
      title: "Cancel this booking?",
      // Bible §17.5: what (what happens to the hold), why (so the user knows
      // the cost), what-to-do (free up to 24h before start). The MVP doesn't
      // charge a late-cancellation fee — say that honestly. SETTINGS/BOOKING
      // ticket tracks the fee policy when product turns it on.
      description:
        "Free cancellation any time before the service starts — your card hold is released and no fee is charged. Tell us why so we can keep things fair.",
      confirmLabel: "Cancel booking",
      cancelLabel: "Keep booking",
      variant: "danger",
      reasonField: {
        label: "Reason for cancellation",
        placeholder: "e.g. Plans changed, found another welper",
        required: true,
      },
      pending: cancelMutation.isPending,
      onConfirm: (reason) => {
        setMutationError(null);
        cancelMutation.mutate(
          {
            bookingId,
            reason: reason || undefined,
            timezoneOffsetMinutes: -(new Date().getTimezoneOffset()),
          },
          {
            onSuccess: () => setConfirmKind(null),
            onError: (err) => {
              setMutationError(handleBookableError(err, "Failed to cancel booking."));
              setConfirmKind(null);
            },
          },
        );
      },
    },
  };

  const activeConfirm = confirmKind ? confirmConfig[confirmKind] : null;

  const formattedTotal =
    booking.totalPrice != null ? usdFormatter.format(booking.totalPrice) : null;
  const formattedRate =
    booking.hourlyRate != null ? usdFormatter.format(booking.hourlyRate) : null;

  // ── Main content ───────────────────────────────────────────────────────

  return (
    <Container size="3" px={{ initial: "4", sm: "6" }}>
      <EmailVerificationRequiredDialog
        open={bookable.dialogOpen}
        onOpenChange={bookable.setDialogOpen}
        email={bookable.email}
        pending={bookable.resendPending}
        onResend={bookable.resend}
      />
      <Flex direction="column" gap="6">
        {/* Back Button */}
        <Box>
          <Button
            variant="ghost"
            color="gray"
            size="2"
            onClick={handleBack}
          >
            <ArrowLeft size={16} aria-hidden />
            Back to bookings
          </Button>
        </Box>

        {/* Header: Booking ID + Status. aria-live so SR users hear status changes. */}
        <Flex direction="column" gap="2" aria-live="polite">
          <Heading as="h1" size="7" mb="0" trim="start">
            Booking #{booking.id.slice(-8).toUpperCase()}
          </Heading>
          <Box>
            <Badge
              color={getStatusColor(booking.status)}
              variant="soft"
              size="2"
            >
              <Text size="2" weight="bold">
                {startCase(formatStatusLabel(booking.status))}
              </Text>
            </Badge>
          </Box>
        </Flex>

        {/* Horizontal timeline */}
        <Card size="4" variant="surface">
          <Flex direction="column" gap="3">
            <Heading as="h2" size="5" mb="2">
              Timeline
            </Heading>
            <Box className={styles.timelineScroll}>
              <Box className={styles.timelineRow}>
                {timelineEvents.map((event, index) => {
                  const isCancelledOrDeclined =
                    event.label === "Cancelled" || event.label === "Declined";
                  const isLast = index === timelineEvents.length - 1;
                  return (
                    <Flex
                      key={`${event.label}-${index}`}
                      align="start"
                      gap="0"
                      flexShrink="0"
                    >
                      <Box className={styles.timelineStep}>
                        <Box
                          className={`${styles.timelineDot} ${
                            isCancelledOrDeclined
                              ? styles.timelineDotDanger
                              : styles.timelineDotPrimary
                          }`}
                        />
                        <Text size="2" weight="medium" align="center">
                          {event.label}
                        </Text>
                        <Text size="1" color="gray" align="center">
                          {formatDateTime(event.date)}
                        </Text>
                      </Box>
                      {!isLast ? <Box className={styles.timelineConnector} /> : null}
                    </Flex>
                  );
                })}
              </Box>
            </Box>
          </Flex>
        </Card>

        {/* Quick actions — first for welper/customer task focus */}
        {actions.length > 0 && (
          <Card size="3" variant="surface">
            <Flex direction="column" gap="4">
              <Flex direction="column" gap="2">
                <Heading as="h2" size="5" mb="0">
                  Quick actions
                </Heading>
                <Text as="p" size="2" color="gray">
                  Accept, check in, check out, or cancel this booking.
                </Text>
              </Flex>
              <Flex gap="3" justify="end" wrap="wrap">
                {actions.includes("decline") && isWelper && (
                  <Button
                    size="3"
                    color={SEMANTIC_COLOR.danger}
                    variant="outline"
                    onClick={() => setConfirmKind("decline")}
                    disabled={declineMutation.isPending}
                  >
                    Decline
                  </Button>
                )}
                {actions.includes("cancel") && (
                  <Button
                    size="3"
                    color={SEMANTIC_COLOR.danger}
                    variant="outline"
                    onClick={() => setConfirmKind("cancel")}
                    disabled={cancelMutation.isPending}
                  >
                    Cancel booking
                  </Button>
                )}
                {actions.includes("check-in") && isWelper && (
                  <Button
                    size="3"
                    color={SEMANTIC_COLOR.info}
                    variant="solid"
                    onClick={() => setConfirmKind("check-in")}
                    disabled={checkInMutation.isPending}
                  >
                    Check in
                  </Button>
                )}
                {actions.includes("check-out") && isWelper && (
                  <Button
                    size="3"
                    color={SEMANTIC_COLOR.primary}
                    variant="solid"
                    onClick={() => {
                      setMutationError(null);
                      setReceiptNotes("");
                      setReceiptDialogOpen(true);
                    }}
                    disabled={submitReceiptMutation.isPending}
                  >
                    Check out
                  </Button>
                )}
                {actions.includes("accept") && isWelper && (
                  <Button
                    size="3"
                    color={SEMANTIC_COLOR.primary}
                    variant="solid"
                    onClick={() => setConfirmKind("accept")}
                    disabled={acceptMutation.isPending}
                  >
                    Accept booking
                  </Button>
                )}
              </Flex>
            </Flex>
          </Card>
        )}

        {/* Booking overview — the hero/summary card. */}
        <Card size="4" variant="surface">
          <Flex direction="column" gap="5">
            <Box>
              <Heading as="h2" size="5" mb="2" trim="start">
                Booking overview
              </Heading>
              <Text size="4" weight="bold" as="p">
                {serviceOfferingName ??
                  `Service #${booking.serviceOfferingId.slice(-8).toUpperCase()}`}
              </Text>
              <Text as="p" size="2" color="gray" mt="2">
                {booking.scheduledDate
                  ? formatDate(booking.scheduledDate)
                  : "Schedule to be confirmed"}
                {booking.scheduledStartTime
                  ? ` · ${booking.scheduledStartTime}${
                      booking.scheduledEndTime ? ` – ${booking.scheduledEndTime}` : ""
                    }`
                  : null}
                {booking.durationMinutes != null
                  ? ` · ${formatDuration(booking.durationMinutes)}`
                  : null}
              </Text>
            </Box>

            <Separator size="4" />

            <Flex direction="column" gap="3">
              <Heading as="h3" size="3" mb="1">
                People
              </Heading>
              <Flex gap="6" wrap="wrap" align="start">
                <Flex direction="column" gap="1" minWidth="160px" flexBasis="200px" flexGrow="1">
                  <Text size="1" color="gray" weight="medium">
                    Customer
                  </Text>
                  <Flex align="center" gap="2">
                    <Avatar
                      size="2"
                      fallback={
                        isCustomer && user?.id === booking.customerId
                          ? (user?.name?.trim().slice(0, 2) ||
                              user?.email?.slice(0, 2) ||
                              "ME").toUpperCase()
                          : "CU"
                      }
                    />
                    <Text size="2">
                      {isCustomer && user?.id === booking.customerId
                        ? "You"
                        : `#${booking.customerId.slice(-8).toUpperCase()}`}
                    </Text>
                  </Flex>
                </Flex>
                <Flex direction="column" gap="1" minWidth="160px" flexBasis="200px" flexGrow="1">
                  <Text size="1" color="gray" weight="medium">
                    Welper
                  </Text>
                  <Flex align="center" gap="2">
                    <Avatar
                      size="2"
                      src={welperProfile?.profilePhotoUrl ?? undefined}
                      fallback={
                        welperDisplayName
                          ? welperDisplayName.slice(0, 2).toUpperCase()
                          : "W"
                      }
                    />
                    <Text size="2">
                      {isWelper && user?.id === booking.welperId
                        ? "You"
                        : welperDisplayName ??
                          `#${booking.welperId.slice(-8).toUpperCase()}`}
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
            </Flex>

            {(booking.scheduledDate || booking.scheduledStartTime) ? (
              <>
                <Separator size="4" />
                <Flex direction="column" gap="3">
                  <Heading as="h3" size="3" mb="1">
                    Schedule
                  </Heading>
                  <Flex gap="6" wrap="wrap">
                    {booking.scheduledDate && (
                      <Flex direction="column" gap="1">
                        <Flex align="center" gap="2">
                          <Calendar size={14} color="var(--gray-9)" aria-hidden />
                          <Text size="1" color="gray" weight="medium">
                            Date
                          </Text>
                        </Flex>
                        <Text size="2">{formatDate(booking.scheduledDate)}</Text>
                      </Flex>
                    )}
                    {booking.scheduledStartTime && (
                      <Flex direction="column" gap="1">
                        <Flex align="center" gap="2">
                          <Clock size={14} color="var(--gray-9)" aria-hidden />
                          <Text size="1" color="gray" weight="medium">
                            Time window
                          </Text>
                        </Flex>
                        <Text size="2">
                          {booking.scheduledStartTime}
                          {booking.scheduledEndTime
                            ? ` – ${booking.scheduledEndTime}`
                            : ""}
                        </Text>
                      </Flex>
                    )}
                  </Flex>
                </Flex>
              </>
            ) : null}

            <Separator size="4" />

            <Flex direction="column" gap="3">
              <Heading as="h3" size="3" mb="1">
                Pricing
              </Heading>
              <Flex gap="6" wrap="wrap" align="end">
                {booking.durationMinutes != null && (
                  <Flex direction="column" gap="1" minWidth="120px">
                    <Text size="1" color="gray" weight="medium">
                      Duration
                    </Text>
                    <Text size="3" weight="medium">
                      {formatDuration(booking.durationMinutes)}
                    </Text>
                  </Flex>
                )}
                {formattedRate && (
                  <Flex direction="column" gap="1" minWidth="120px">
                    <Flex align="center" gap="2">
                      <DollarSign size={14} color="var(--gray-9)" aria-hidden />
                      <Text size="1" color="gray" weight="medium">
                        Hourly rate
                      </Text>
                    </Flex>
                    <Text size="3" weight="medium">
                      {formattedRate}/hr
                    </Text>
                  </Flex>
                )}
                {formattedTotal && (
                  <Flex direction="column" gap="1" minWidth="140px">
                    <Flex align="center" gap="2">
                      <DollarSign size={14} color="var(--gray-9)" aria-hidden />
                      <Text size="1" color="gray" weight="medium">
                        Agreed total
                      </Text>
                    </Flex>
                    <Text size="6" weight="bold">
                      {formattedTotal}
                    </Text>
                  </Flex>
                )}
              </Flex>
            </Flex>

            <Separator size="4" />

            <Flex direction="column" gap="3">
              <Heading as="h3" size="3" mb="0">
                Actions
              </Heading>
              <Text as="p" size="1" color="gray">
                Message your {isWelper ? "customer" : "welper"}, leave a review, or
                report a problem if something is wrong.
              </Text>
              {booking.status === "disputed" ? (
                <Callout.Root color={SEMANTIC_COLOR.warning} variant="surface">
                  <Callout.Text>
                    This booking is under dispute. You cannot cancel it until support resolves the case.
                  </Callout.Text>
                </Callout.Root>
              ) : null}
              <Flex gap="3" justify="end" wrap="wrap" align="center">
                {showExistingReviewInActions && bookingReview ? (
                  <Flex
                    align="center"
                    gap="3"
                    wrap="wrap"
                    flexBasis="280px"
                    flexGrow="1"
                    minWidth="0"
                  >
                    <Flex direction="column" gap="1" flexBasis="200px" flexGrow="1" minWidth="0">
                      <Text size="1" color="gray" weight="medium">
                        Your review
                      </Text>
                      <Text size="2">
                        {bookingReview.rating} out of 5
                        {bookingReview.comment?.trim()
                          ? ` · ${
                              bookingReview.comment.trim().length > 120
                                ? `${bookingReview.comment.trim().slice(0, 120)}…`
                                : bookingReview.comment.trim()
                            }`
                          : ""}
                      </Text>
                    </Flex>
                    <Button
                      size="2"
                      variant="outline"
                      color={SEMANTIC_COLOR.primary}
                      onClick={openEditReviewDialog}
                    >
                      Edit review
                    </Button>
                  </Flex>
                ) : null}
                {canDispute && hasDispute ? (
                  <Flex align="center" gap="2" wrap="wrap">
                    <Text size="2" color="gray">
                      Report in progress
                    </Text>
                    <DisputeStatusBadge status={bookingDispute!.status} />
                  </Flex>
                ) : null}
                {canDispute && !hasDispute ? (
                  <Button
                    size="2"
                    variant="outline"
                    color={SEMANTIC_COLOR.warning}
                    onClick={() => setDisputeDialogOpen(true)}
                  >
                    Report a problem
                  </Button>
                ) : null}
                {user?.id ? (
                  <Button
                    size="2"
                    variant="outline"
                    color={isWelper ? SEMANTIC_COLOR.primary : SEMANTIC_COLOR.info}
                    asChild
                  >
                    <Link href={`/dashboard/messages/${bookingId}`}>
                      <MessageCircle size={16} aria-hidden />
                      {isWelper ? "Message customer" : "Message welper"}
                    </Link>
                  </Button>
                ) : null}
                {showLeaveReviewAction ? (
                  <Button
                    size="2"
                    variant="solid"
                    color={SEMANTIC_COLOR.primary}
                    onClick={openNewReviewDialog}
                  >
                    {isWelper ? "Review customer" : "Leave a review"}
                  </Button>
                ) : null}
              </Flex>
            </Flex>
          </Flex>
        </Card>

        {booking.serviceReceipt && (
          <Card size="3" variant="surface">
            <Flex direction="column" gap="5">
              <Flex align="start" justify="between" wrap="wrap" gap="4">
                <Flex
                  align="start"
                  gap="3"
                  minWidth="0"
                  flexBasis="220px"
                  flexGrow="1"
                >
                  {/* Medallion (bible §15.5 recipe): circular bg + token color icon. */}
                  <Flex
                    align="center"
                    justify="center"
                    flexShrink="0"
                    p="3"
                    style={{
                      borderRadius: "9999px",
                      backgroundColor: "var(--green-a3)",
                      color: "var(--green-11)",
                    }}
                  >
                    <Receipt size={22} strokeWidth={2} aria-hidden />
                  </Flex>
                  <Flex direction="column" gap="1" minWidth="0">
                    <Heading as="h2" size="5" mb="0" trim="start">
                      Service receipt
                    </Heading>
                    <Text as="p" size="1" color="gray">
                      Confirmed billing for this booking
                    </Text>
                  </Flex>
                </Flex>
                <Badge color={SEMANTIC_COLOR.primary} variant="soft" size="2">
                  <Text size="2" weight="bold">
                    Confirmed
                  </Text>
                </Badge>
              </Flex>

              <Card size="2" variant="surface">
                <Flex direction="column" gap="4">
                  <Flex gap="6" wrap="wrap">
                    <Flex
                      direction="column"
                      gap="1"
                      minWidth="200px"
                      flexBasis="200px"
                      flexGrow="1"
                    >
                      <Text size="1" color="gray" weight="medium">
                        Billing period
                      </Text>
                      <Text size="2">
                        {formatDateTime(booking.serviceReceipt.billingCheckInAt)} —{" "}
                        {formatDateTime(booking.serviceReceipt.billingCheckOutAt)}
                      </Text>
                    </Flex>
                    <Flex direction="column" gap="1" minWidth="140px">
                      <Text size="1" color="gray" weight="medium">
                        Rate on receipt
                      </Text>
                      <Text size="2" weight="medium">
                        {usdFormatter.format(booking.serviceReceipt.hourlyRate)}/hr
                      </Text>
                    </Flex>
                  </Flex>

                  <Separator size="4" />

                  <Box>
                    <Text size="1" color="gray" weight="medium">
                      Amount charged
                    </Text>
                    <Text size="6" weight="bold" mt="2" as="p">
                      {(booking.serviceReceipt.totalCents / 100).toLocaleString(
                        "en-US",
                        {
                          style: "currency",
                          currency: booking.serviceReceipt.currency.toUpperCase(),
                          currencyDisplay: "code",
                        },
                      )}
                    </Text>
                  </Box>

                  {booking.serviceReceipt.notes ? (
                    <Flex direction="column" gap="1">
                      <Text size="1" color="gray" weight="medium">
                        Notes from welper
                      </Text>
                      <Text size="2">{booking.serviceReceipt.notes}</Text>
                    </Flex>
                  ) : null}

                  {booking.serviceReceipt.evidenceFiles.length > 0 ? (
                    <>
                      <Separator size="4" />
                      <ReceiptEvidenceSection
                        files={booking.serviceReceipt.evidenceFiles}
                      />
                    </>
                  ) : null}
                </Flex>
              </Card>

              {isCustomer && user?.id === booking.customerId ? (
                <Callout.Root color={SEMANTIC_COLOR.info} variant="surface">
                  <Callout.Text>
                    If this amount or the times look wrong, use Report a problem in Actions above.
                  </Callout.Text>
                </Callout.Root>
              ) : null}
            </Flex>
          </Card>
        )}

        {showPaymentCard ? (
          <Card size="3" variant="surface">
            <Flex direction="column" gap="5">
              <Heading as="h2" size="5" mb="1">
                Payment & authorization
              </Heading>

              {needsCustomerAuthorization ? (
                <Flex direction="column" gap="2">
                  <Text size="2" weight="medium">
                    Card on file
                  </Text>
                  {showAuthorizePayment ? (
                    <Flex direction="column" gap="2" align="start">
                      <Text size="2" color="gray">
                        Complete payment authorization on your saved card (hold only — charged after the service is completed).
                        If you see this after the welper accepted, the automatic hold may have failed; try again or update your
                        card in Settings.
                      </Text>
                      {paymentActionError ? (
                        <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
                          <Callout.Text>{paymentActionError}</Callout.Text>
                        </Callout.Root>
                      ) : null}
                      <Flex justify="end" width="100%">
                        <Button
                          size="2"
                          variant="solid"
                          color={SEMANTIC_COLOR.primary}
                          onClick={() => void handleAuthorizePayment()}
                          disabled={bookingPayIntentMutation.isPending}
                        >
                          {bookingPayIntentMutation.isPending ? "Authorizing…" : "Authorize payment"}
                        </Button>
                      </Flex>
                    </Flex>
                  ) : paymentPhase === "authorized" ? (
                    <Text size="2" color="gray">
                      Payment hold is active (placed when the welper accepted). You are not charged until the service is
                      completed.
                      {booking.captureEligibleAt
                        ? ` Capture is scheduled after ${formatDateTime(booking.captureEligibleAt)} (pending service completion and dispute window).`
                        : null}
                    </Text>
                  ) : paymentPhase === "captured" ? (
                    <Text size="2" color="gray">
                      Payment has been captured.
                    </Text>
                  ) : paymentPhase === "canceled" || paymentPhase === "failed" ? (
                    <Text size="2" color="gray">
                      Payment could not be completed. Contact support if you need help.
                    </Text>
                  ) : null}
                </Flex>
              ) : null}

              {showReceiptBalancePayment ? (
                <Card size="2" variant="surface">
                  <Flex direction="column" gap="3" align="start">
                    <Text size="2" weight="medium">
                      Additional payment required
                    </Text>
                    <Text size="2" color="gray">
                      The service total was higher than the original hold. Complete authentication on your saved
                      card to pay the balance.
                    </Text>
                    {paymentActionError ? (
                      <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
                        <Callout.Text>{paymentActionError}</Callout.Text>
                      </Callout.Root>
                    ) : null}
                    <Flex justify="end" width="100%">
                      <Button
                        size="2"
                        variant="solid"
                        color={SEMANTIC_COLOR.primary}
                        onClick={() => void handleCompleteReceiptBalance()}
                        disabled={!booking.paymentClientSecret}
                      >
                        Pay balance
                      </Button>
                    </Flex>
                  </Flex>
                </Card>
              ) : null}
            </Flex>
          </Card>
        ) : null}

        {showLocationCard ? (
          <Card size="3" variant="surface">
            <Flex direction="column" gap="5">
              <Heading as="h2" size="5" mb="1">
                Location & requests
              </Heading>

              {booking.address &&
                Object.keys(booking.address).length > 0 && (
                  <Flex direction="column" gap="2">
                    <Flex align="center" gap="2">
                      <MapPin size={14} color="var(--gray-9)" aria-hidden />
                      <Text size="1" color="gray" weight="medium">
                        Service address
                      </Text>
                    </Flex>
                    <Text size="2">
                      {Object.values(booking.address)
                        .filter(Boolean)
                        .join(", ")}
                    </Text>
                  </Flex>
                )}

              {booking.notes ? (
                <Flex direction="column" gap="2">
                  <Flex align="center" gap="2">
                    <FileText size={14} color="var(--gray-9)" aria-hidden />
                    <Text size="1" color="gray" weight="medium">
                      Notes
                    </Text>
                  </Flex>
                  <Text size="2">{booking.notes}</Text>
                </Flex>
              ) : null}

              {booking.answers && Object.keys(booking.answers).length > 0 ? (
                <Flex direction="column" gap="3">
                  <Heading as="h3" size="3" mb="0">
                    Service questions
                  </Heading>
                  <Card size="2" variant="surface">
                    <Flex direction="column" gap="4">
                      {Object.entries(booking.answers).map(([key, value]) => (
                        <Flex key={key} direction="column" gap="1">
                          <Text size="1" color="gray" weight="medium">
                            {startCase(key.replace(/_/g, " "))}
                          </Text>
                          <Text size="2">{String(value)}</Text>
                        </Flex>
                      ))}
                    </Flex>
                  </Card>
                </Flex>
              ) : null}
            </Flex>
          </Card>
        ) : null}

        {/* Cancellation Reason — Callout (bible §17.5/§25.5). */}
        {booking.cancellationReason && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
            <Callout.Text>
              <Text as="span" weight="bold">
                Cancellation reason:
              </Text>{" "}
              {booking.cancellationReason}
            </Callout.Text>
          </Callout.Root>
        )}

        {/* Decline Reason — Callout. */}
        {booking.declineReason && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
            <Callout.Text>
              <Text as="span" weight="bold">
                Decline reason:
              </Text>{" "}
              {booking.declineReason}
            </Callout.Text>
          </Callout.Root>
        )}

        {/* Mutation Error */}
        {mutationError && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
            <Callout.Text>{mutationError}</Callout.Text>
          </Callout.Root>
        )}

        {/* Receipt dialog (welper) */}
        <Dialog
          open={receiptDialogOpen}
          onOpenChange={(open) => {
            if (!open) setReceiptDialogOpen(false);
          }}
        >
          <DialogContent
            title="Confirm service receipt"
            description="Adjust billing check-in and check-out if needed. The customer is charged the total shown when you confirm."
          >
            {receiptDraftLoading ? (
              <Skeleton height="120px" width="100%" />
            ) : receiptDraft?.confirmedReceipt ? (
              <Text size="2">This booking already has a confirmed receipt.</Text>
            ) : receiptDraft ? (
              <Flex direction="column" gap={FORM_SPACING.fieldGap}>
                <Box>
                  <Text
                    as="label"
                    htmlFor="receipt-billing-in"
                    size="2"
                    weight="bold"
                    mb={FORM_SPACING.labelGap}
                  >
                    Billing check-in
                    <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                      *
                    </Text>
                  </Text>
                  <TextField.Root
                    id="receipt-billing-in"
                    type="datetime-local"
                    size="2"
                    value={billingInLocal}
                    onChange={(e) => setBillingInLocal(e.target.value)}
                    aria-required="true"
                  />
                </Box>
                <Box>
                  <Text
                    as="label"
                    htmlFor="receipt-billing-out"
                    size="2"
                    weight="bold"
                    mb={FORM_SPACING.labelGap}
                  >
                    Billing check-out
                    <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                      *
                    </Text>
                  </Text>
                  <TextField.Root
                    id="receipt-billing-out"
                    type="datetime-local"
                    size="2"
                    value={billingOutLocal}
                    onChange={(e) => setBillingOutLocal(e.target.value)}
                    aria-required="true"
                  />
                </Box>
                <Box>
                  <Text
                    as="label"
                    htmlFor="receipt-notes"
                    size="2"
                    weight="bold"
                    mb={FORM_SPACING.labelGap}
                  >
                    Notes (optional)
                  </Text>
                  <TextArea
                    id="receipt-notes"
                    value={receiptNotes}
                    onChange={(e) => setReceiptNotes(e.target.value)}
                    rows={3}
                    size="2"
                  />
                </Box>
                {receiptDraft.authorizedHoldCents != null ? (
                  <Text size="2" color="gray">
                    Original card hold: {cadFormatter.format(receiptDraft.authorizedHoldCents / 100)}.
                    If your total is higher, the customer may need to authenticate an extra charge.
                  </Text>
                ) : null}
                <Text size="3" weight="bold">
                  Receipt total: {cadFormatter.format(receiptPreviewCents / 100)}
                </Text>
                <Flex gap="3" justify="end" wrap="wrap" mt={FORM_SPACING.submitGap}>
                  <Button
                    variant="soft"
                    color="gray"
                    onClick={() => setReceiptDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="solid"
                    color={SEMANTIC_COLOR.primary}
                    disabled={
                      submitReceiptMutation.isPending ||
                      receiptPreviewCents <= 0 ||
                      !billingInLocal ||
                      !billingOutLocal
                    }
                    onClick={() => {
                      setMutationError(null);
                      submitReceiptMutation.mutate(
                        {
                          bookingId,
                          params: {
                            billingCheckInAt: new Date(billingInLocal).toISOString(),
                            billingCheckOutAt: new Date(billingOutLocal).toISOString(),
                            notes: receiptNotes.trim() || undefined,
                          },
                        },
                        {
                          onSuccess: (res) => {
                            setReceiptDialogOpen(false);
                            if (res.deltaPayment?.requiresAction) {
                              setMutationError(
                                "Receipt sent. An additional amount is due above the original hold — ask the customer to open this booking and complete card authentication.",
                              );
                            } else {
                              setMutationError(null);
                            }
                          },
                          onError: (err) =>
                            setMutationError(
                              err instanceof Error ? err.message : "Could not submit receipt.",
                            ),
                        },
                      );
                    }}
                  >
                    {submitReceiptMutation.isPending
                      ? "Submitting…"
                      : "Confirm receipt & charge"}
                  </Button>
                </Flex>
              </Flex>
            ) : (
              <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
                <Callout.Text>
                  We couldn&rsquo;t load the receipt draft. Try again, or contact support if it keeps happening.
                </Callout.Text>
              </Callout.Root>
            )}
          </DialogContent>
        </Dialog>

        {/* Review dialog */}
        <Dialog
          open={reviewDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setReviewDialogOpen(false);
              setReviewTarget(null);
            }
          }}
        >
          <DialogContent
            title={
              bookingReview
                ? "Edit your review"
                : reviewTarget === "customer"
                  ? "Review the customer"
                  : `Review ${welperDisplayName ?? "welper"}`
            }
            description={
              bookingReview
                ? "Update your rating or comment if you need to fix a mistake."
                : reviewTarget === "customer"
                  ? "Share your experience with this customer."
                  : "Your review helps other families find great welpers."
            }
          >
            <Flex direction="column" gap="4">
              <RatingForm
                key={bookingReview?.id ?? "new-review"}
                defaultValues={
                  bookingReview
                    ? {
                        rating: bookingReview.rating,
                        comment: bookingReview.comment ?? "",
                      }
                    : undefined
                }
                heading={bookingReview ? "Update your review" : undefined}
                subheading={
                  bookingReview
                    ? "Change your rating or comment below."
                    : undefined
                }
                submitLabel={bookingReview ? "Save changes" : undefined}
                loading={reviewMutationPending}
                error={reviewMutationError}
                onSubmit={async (values) => {
                  const payload = {
                    rating: values.rating,
                    comment: values.comment?.trim() || undefined,
                  };
                  if (bookingReview) {
                    await updateReviewMutation.mutateAsync(payload);
                  } else {
                    await createReviewMutation.mutateAsync(payload);
                  }
                  setReviewDialogOpen(false);
                  setReviewTarget(null);
                }}
              />
              <Flex justify="end">
                <Button
                  variant="ghost"
                  color="gray"
                  size="2"
                  onClick={() => {
                    setReviewDialogOpen(false);
                    setReviewTarget(null);
                  }}
                  disabled={reviewMutationPending}
                >
                  {bookingReview ? "Cancel" : "Skip for now"}
                </Button>
              </Flex>
            </Flex>
          </DialogContent>
        </Dialog>

        {/* Dispute (Report a problem) dialog */}
        <Dialog
          open={disputeDialogOpen}
          onOpenChange={(open) => {
            if (!open) setDisputeDialogOpen(false);
          }}
        >
          <DialogContent
            title="Report a problem"
            description="We'll review your case and get back to you within 48 hours."
          >
            {/* DISPUTES-001 + DISPUTES-002 (Day 16): DisputeForm now mirrors
                the BFF category enum 1:1 (no lossy mapping) AND mounts the
                EvidenceUpload picker inline when an upload handler is wired.
                Keys flow back via `values.evidence` and ship with the create
                payload so the resulting dispute carries the photos / PDFs
                the user attached. */}
            <DisputeForm
              loading={createDisputeMutation.isPending}
              uploadEvidence={uploadDisputeEvidence}
              error={
                createDisputeMutation.error instanceof Error
                  ? createDisputeMutation.error.message
                  : undefined
              }
              onSubmit={async (values) => {
                await createDisputeMutation.mutateAsync({
                  subject: values.subject,
                  category: values.category,
                  description: values.description || undefined,
                  evidence:
                    values.evidence.length > 0 ? values.evidence : undefined,
                });
                setDisputeDialogOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Single ActionConfirmDialog driven by `confirmKind`. */}
        {activeConfirm ? (
          <ActionConfirmDialog
            open={confirmKind != null}
            onOpenChange={(open) => {
              if (!open && !activeConfirm.pending) setConfirmKind(null);
            }}
            title={activeConfirm.title}
            description={activeConfirm.description}
            confirmLabel={activeConfirm.confirmLabel}
            cancelLabel={activeConfirm.cancelLabel}
            variant={activeConfirm.variant}
            pending={activeConfirm.pending}
            reasonField={activeConfirm.reasonField}
            onConfirm={activeConfirm.onConfirm}
          />
        ) : null}
      </Flex>
    </Container>
  );
}
