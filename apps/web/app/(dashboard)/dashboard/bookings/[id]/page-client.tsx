"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  MIN_BOOKING_DURATION_MINUTES,
  snapReceiptBillingWindow,
  receiptBillingDurationMinutes,
  RECEIPT_BILLING_STEP_MINUTES,
} from "@/lib/booking/booking-pricing";
import { canReportDisputeForBooking, canMessageBookingParticipant } from "@/lib/booking/dispute-report-window";
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
import { useRouter } from "next/navigation";
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
  useServiceQuestionsForCategories,
} from "@/lib/hooks/use-bookings";
import { useCustomerProfile } from "@/lib/hooks/use-profile";
import { buildAnswerLabelMap } from "@/lib/services/service-questions-utils";
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
import { publicWelperDisplayName } from "@/lib/display-name";
import { useBookableAction } from "@/lib/hooks/use-bookable-action";
import { EmailVerificationRequiredDialog } from "@/components/features/dashboard/email-verification-required-dialog";
import { CustomerPreviewDialog } from "@/components/features/dashboard/customer-preview-dialog";
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
import type { Locale } from "date-fns";
import { getStatusColor } from "@/lib/constants/booking";
import {
  useBookingStatusLabel,
  useCustomerBookingDetailLabels,
  useWelperBookingDetailLabels,
  useWelperBookingsLabels,
  useCustomerPreviewLabels,
  useDashboardCommonLabels,
} from "@/lib/i18n/use-dashboard-labels";
import {
  useDisputeFormCategoryLabels,
  useDisputeStatusLabel,
} from "@/lib/i18n/dispute-labels";
import { useDateFnsLocale } from "@/lib/i18n/date-fns-locale";
import { useCategoryDisplayName } from "@/lib/i18n/category-display-name";
import { useServiceQuestionCopy } from "@/lib/i18n/service-question-copy";
import { formatOfferingCategoryLabel } from "@/lib/utils/category-utils";
import styles from "./booking-detail.module.css";

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatDateTime(dateStr: string | null, locale?: Locale): string {
  if (!dateStr) return "—";
  try {
    // For date-only strings (YYYY-MM-DD), append T00:00:00 to avoid UTC midnight
    // being displayed as the previous day in western timezones
    const d = dateStr.length === 10 ? new Date(dateStr + "T00:00:00") : new Date(dateStr);
    return format(d, dateStr.length === 10 ? "PPP" : "PPP 'at' p", locale ? { locale } : undefined);
  } catch {
    return dateStr;
  }
}

function formatDate(dateStr: string | null, locale?: Locale): string {
  if (!dateStr) return "—";
  try {
    const d = dateStr.length === 10 ? new Date(dateStr + "T00:00:00") : new Date(dateStr);
    return format(d, "PPP", locale ? { locale } : undefined);
  } catch {
    return dateStr;
  }
}

function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDatetimeLocalValue(date: Date): string {
  return isoToDatetimeLocal(date.toISOString());
}

function applyReceiptBillingWindow(checkIn: Date, checkOut: Date): {
  checkInLocal: string;
  checkOutLocal: string;
} {
  const snapped = snapReceiptBillingWindow(checkIn, checkOut);
  return {
    checkInLocal: toDatetimeLocalValue(snapped.checkIn),
    checkOutLocal: toDatetimeLocalValue(snapped.checkOut),
  };
}

function previewReceiptTotalCents(checkInLocal: string, checkOutLocal: string, hourlyRate: number): number {
  const a = new Date(checkInLocal).getTime();
  const b = new Date(checkOutLocal).getTime();
  if (!checkInLocal || !checkOutLocal || Number.isNaN(a) || Number.isNaN(b) || b <= a) return 0;
  const hours = (b - a) / (1000 * 60 * 60);
  return Math.round(hours * hourlyRate * 100);
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
function evidenceFilename(file: ReceiptEvidenceFile, fallback: string): string {
  const tail = file.key.split("/").pop() ?? file.key;
  return tail || fallback;
}

function isImageEvidence(file: ReceiptEvidenceFile): boolean {
  const dot = file.key.lastIndexOf(".");
  if (dot === -1) return false;
  const ext = file.key.slice(dot + 1).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}

// ─── Types ────────────────────────────────────────────────────────────────

interface BookingDetailClientProps {
  bookingId: string;
}

type TimelineKey =
  | "created"
  | "accepted"
  | "checkedIn"
  | "checkedOut"
  | "receiptSent"
  | "completed"
  | "cancelled"
  | "declined";

interface TimelineEvent {
  key: TimelineKey;
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
function ReceiptEvidenceSection({
  files,
  attachmentFallback,
  previewUnavailable,
}: {
  files: ReceiptEvidenceFile[];
  attachmentFallback: string;
  previewUnavailable: string;
}) {
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
            const filename = evidenceFilename(file, attachmentFallback);
            const key = file.id ?? `${file.key}-${idx}`;
            if (!file.signedUrl) {
              return (
                <Tooltip key={key} content={previewUnavailable}>
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
            const filename = evidenceFilename(file, attachmentFallback);
            const key = file.id ?? `${file.key}-${idx}`;
            if (!file.signedUrl) {
              return (
                <Tooltip key={key} content={previewUnavailable}>
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
  const [previewCustomerId, setPreviewCustomerId] = useState<string | null>(null);
  const [previewCustomerFallback, setPreviewCustomerFallback] = useState<{
    name: string;
    photoUrl: string | null;
  } | null>(null);

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

  const disputableStatuses = ["in_progress", "completed", "payment_released", "no_show"];
  const bookingAllowsReview =
    booking?.status === "completed" || booking?.status === "payment_released";
  const shouldFetchDispute =
    !!booking &&
    (booking.status === "disputed" ||
      disputableStatuses.includes(booking.status));

  const { data: bookingReview, isSuccess: reviewQuerySuccess } = useBookingReview(bookingId, {
    enabled: bookingAllowsReview,
  });
  const createReviewMutation = useCreateBookingReview(bookingId);
  const updateReviewMutation = useUpdateBookingReview(bookingId);

  const { data: bookingDispute, isSuccess: disputeQuerySuccess } = useBookingDispute(bookingId, {
    enabled: shouldFetchDispute,
  });
  const createDisputeMutation = useCreateDispute(bookingId);
  const bookingPayIntentMutation = useCreateBookingPaymentIntent(bookingId);
  const canDispute =
    booking &&
    user?.id &&
    (booking.customerId === user.id || booking.welperId === user.id) &&
    disputableStatuses.includes(booking.status) &&
    canReportDisputeForBooking(booking);
  const hasDispute = disputeQuerySuccess && bookingDispute != null;

  const isWelper = user?.role === "welper";
  const isCustomer = user?.role === "customer";
  const welperBookings = useWelperBookingsLabels();
  const welperDetail = useWelperBookingDetailLabels();
  const customerDetail = useCustomerBookingDetailLabels();
  const disputeFormCategories = useDisputeFormCategoryLabels();
  const disputeStatusLabel = useDisputeStatusLabel();
  const customerPreviewLabels = useCustomerPreviewLabels();
  const serviceQuestionCopy = useServiceQuestionCopy();
  const commonLabels = useDashboardCommonLabels();
  const bookingStatusLabel = useBookingStatusLabel();
  const dateFnsLocale = useDateFnsLocale();
  const dateLocale = dateFnsLocale;
  const categoryDisplayName = useCategoryDisplayName();

  const timelineLabel = useCallback(
    (key: TimelineKey) => welperDetail.timelineLabels[key],
    [welperDetail],
  );
  const actions = booking?.availableActions ?? [];

  const { data: receiptDraft, isLoading: receiptDraftLoading } = useServiceReceiptDraft(bookingId, {
    enabled: receiptDialogOpen && isWelper && actions.includes("check-out"),
  });

  useEffect(() => {
    if (!receiptDraft || receiptDraft.confirmedReceipt || !receiptDialogOpen) return;
    const { checkInLocal, checkOutLocal } = applyReceiptBillingWindow(
      new Date(receiptDraft.suggestedBillingCheckInAt),
      new Date(receiptDraft.suggestedBillingCheckOutAt),
    );
    setBillingInLocal(checkInLocal);
    setBillingOutLocal(checkOutLocal);
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

  const receiptBillingDurationOk = useMemo(() => {
    if (!billingInLocal || !billingOutLocal) return false;
    const checkIn = new Date(billingInLocal);
    const checkOut = new Date(billingOutLocal);
    if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) return false;
    return receiptBillingDurationMinutes(checkIn, checkOut) >= MIN_BOOKING_DURATION_MINUTES;
  }, [billingInLocal, billingOutLocal]);

  const handleReceiptBillingInChange = useCallback(
    (raw: string) => {
      if (!raw) {
        setBillingInLocal("");
        return;
      }
      const checkIn = new Date(raw);
      if (Number.isNaN(checkIn.getTime())) return;
      const checkOut = billingOutLocal
        ? new Date(billingOutLocal)
        : new Date(checkIn.getTime() + MIN_BOOKING_DURATION_MINUTES * 60 * 1000);
      const { checkInLocal, checkOutLocal } = applyReceiptBillingWindow(checkIn, checkOut);
      setBillingInLocal(checkInLocal);
      setBillingOutLocal(checkOutLocal);
    },
    [billingOutLocal],
  );

  const handleReceiptBillingOutChange = useCallback(
    (raw: string) => {
      if (!raw) {
        setBillingOutLocal("");
        return;
      }
      const checkOut = new Date(raw);
      if (Number.isNaN(checkOut.getTime())) return;
      const checkIn = billingInLocal
        ? new Date(billingInLocal)
        : new Date(checkOut.getTime() - MIN_BOOKING_DURATION_MINUTES * 60 * 1000);
      const { checkInLocal, checkOutLocal } = applyReceiptBillingWindow(checkIn, checkOut);
      setBillingInLocal(checkInLocal);
      setBillingOutLocal(checkOutLocal);
    },
    [billingInLocal],
  );

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
          throw new Error(customerDetail.payment.paymentUiLoadFailed);
        }
        const { error } = await stripe.confirmCardPayment(res.clientSecret);
        if (error) throw new Error(error.message ?? customerDetail.payment.authenticationFailed);
      }
    } catch (e) {
      // Day 15 Dispatch C — payment-intent creation is `EmailVerifiedGuard`-gated
      // BFF-side; surface the verification dialog instead of a generic error.
      if (e instanceof EmailVerificationRequiredError) {
        bookable.setDialogOpen(true);
        return;
      }
      setPaymentActionError(
        e instanceof Error ? e.message : customerDetail.payment.authorizeFailed,
      );
    }
  }, [bookingId, bookingPayIntentMutation, bookable, customerDetail.payment]);

  const handleCompleteReceiptBalance = useCallback(async () => {
    if (!bookingId || !booking?.paymentClientSecret) return;
    setPaymentActionError(null);
    try {
      const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (!pk) throw new Error(customerDetail.payment.stripeNotConfigured);
      const stripe = await loadStripe(pk);
      if (!stripe) throw new Error(customerDetail.payment.paymentUiLoadFailed);
      const { error } = await stripe.confirmCardPayment(booking.paymentClientSecret);
      if (error) throw new Error(error.message ?? customerDetail.payment.paymentFailed);
      await queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
    } catch (e) {
      setPaymentActionError(
        e instanceof Error ? e.message : customerDetail.payment.paymentFailed,
      );
    }
  }, [bookingId, booking?.paymentClientSecret, queryClient, customerDetail.payment]);

  const welperDisplayName = useMemo(
    () => publicWelperDisplayName(welperProfile),
    [welperProfile],
  );

  // Derive service offering name from welper profile
  const bookingOffering = useMemo(() => {
    if (!welperProfile?.serviceOfferings || !booking?.serviceOfferingId) {
      return null;
    }
    return (
      welperProfile.serviceOfferings.find((o) => o.id === booking.serviceOfferingId) ??
      null
    );
  }, [welperProfile, booking?.serviceOfferingId]);

  const serviceOfferingName = useMemo(() => {
    if (!bookingOffering) return null;
    return formatOfferingCategoryLabel(bookingOffering, categoryDisplayName);
  }, [bookingOffering, categoryDisplayName]);

  const questionCategoryIds = useMemo(() => {
    if (!bookingOffering) return [];
    const ids = new Set<string>([bookingOffering.serviceCategoryId]);
    for (const sub of bookingOffering.subcategories ?? []) {
      ids.add(sub.id);
    }
    for (const id of bookingOffering.subcategoryIds ?? []) {
      ids.add(id);
    }
    return [...ids];
  }, [bookingOffering]);

  const { data: serviceQuestionsForAnswers } = useServiceQuestionsForCategories(
    questionCategoryIds,
  );

  const { data: myCustomerProfile } = useCustomerProfile(
    user?.id ?? "",
    isCustomer && user?.id === booking?.customerId,
  );

  const customerDisplayFirstName = useMemo(() => {
    if (isCustomer && user?.id === booking?.customerId) {
      return myCustomerProfile?.firstName?.trim() || booking?.customerFirstName?.trim() || null;
    }
    return booking?.customerFirstName?.trim() || null;
  }, [
    isCustomer,
    user?.id,
    booking?.customerId,
    booking?.customerFirstName,
    myCustomerProfile?.firstName,
  ]);

  const customerDisplayPhotoUrl = useMemo(() => {
    if (isCustomer && user?.id === booking?.customerId) {
      return myCustomerProfile?.photoUrl ?? booking?.customerPhotoUrl ?? null;
    }
    return booking?.customerPhotoUrl ?? null;
  }, [
    isCustomer,
    user?.id,
    booking?.customerId,
    booking?.customerPhotoUrl,
    myCustomerProfile?.photoUrl,
  ]);

  const bookingAnswerRows = useMemo(() => {
    if (!booking?.answers) return [];
    const labelMap = buildAnswerLabelMap(
      serviceQuestionsForAnswers ?? [],
      serviceQuestionCopy,
    );
    return Object.entries(booking.answers).map(([questionId, value]) => {
      const meta = labelMap.get(questionId);
      return {
        key: questionId,
        label: meta?.label ?? welperDetail.additionalDetail,
        displayValue: meta ? meta.format(value) : String(value),
      };
    });
  }, [
    booking?.answers,
    serviceQuestionsForAnswers,
    serviceQuestionCopy,
    welperDetail.additionalDetail,
  ]);

  const handleBack = useCallback(() => {
    router.push("/dashboard/bookings");
  }, [router]);

  // Build timeline events from booking timestamps
  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    if (!booking) return [];

    const events: TimelineEvent[] = [
      { key: "created", date: booking.createdAt },
    ];

    if (booking.acceptedAt) {
      events.push({ key: "accepted", date: booking.acceptedAt });
    }

    if (booking.checkedInAt) {
      events.push({ key: "checkedIn", date: booking.checkedInAt });
    }

    if (booking.checkedOutAt) {
      events.push({ key: "checkedOut", date: booking.checkedOutAt });
    }

    if (booking.serviceReceipt) {
      const receiptAt =
        booking.serviceReceipt.sentToCustomerAt ??
        booking.serviceReceipt.confirmedAt;
      events.push({ key: "receiptSent", date: receiptAt });
    }

    if (booking.completedAt) {
      events.push({ key: "completed", date: booking.completedAt });
    }

    if (booking.cancelledAt) {
      events.push({ key: "cancelled", date: booking.cancelledAt });
    }

    if (booking.declinedAt) {
      events.push({ key: "declined", date: booking.declinedAt });
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
              {welperDetail.backToBookings}
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
              {welperDetail.backToBookings}
            </Button>
          </Box>

          <Card size="4" variant="surface">
            <Flex direction="column" align="center" gap="3" py="7" px="5">
              <Heading as="h2" size="5" mb="0" trim="start">
                {isError ? welperDetail.loadFailed : customerDetail.notFoundTitle}
              </Heading>
              <Text size="2" color="gray" align="center">
                {error instanceof Error ? error.message : welperDetail.notFoundHint}
              </Text>
              <Button
                size="2"
                variant="soft"
                color="gray"
                onClick={handleBack}
                mt="2"
              >
                {welperDetail.backToBookings}
              </Button>
            </Flex>
          </Card>
        </Flex>
      </Container>
    );
  }

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
      title: welperBookings.confirm.acceptTitle,
      description: welperBookings.confirm.acceptDescription,
      confirmLabel: welperBookings.confirm.acceptConfirm,
      cancelLabel: welperBookings.confirm.acceptCancel,
      variant: "primary",
      pending: acceptMutation.isPending,
      onConfirm: () => {
        setMutationError(null);
        acceptMutation.mutate(bookingId, {
          onSuccess: () => setConfirmKind(null),
          onError: (err) => {
            setMutationError(
              handleBookableError(err, welperBookings.acceptFailed),
            );
            setConfirmKind(null);
          },
        });
      },
    },
    decline: {
      title: welperBookings.confirm.declineTitle,
      description: welperBookings.confirm.declineDescription,
      confirmLabel: welperBookings.confirm.declineConfirm,
      cancelLabel: welperBookings.confirm.declineCancel,
      variant: "danger",
      reasonField: {
        label: welperBookings.confirm.declineReasonLabel,
        placeholder: welperBookings.confirm.declineReasonPlaceholder,
      },
      pending: declineMutation.isPending,
      onConfirm: (reason) => {
        setMutationError(null);
        declineMutation.mutate(
          { bookingId, reason: reason || undefined },
          {
            onSuccess: () => setConfirmKind(null),
            onError: (err) => {
              setMutationError(
                handleBookableError(err, welperBookings.declineFailed),
              );
              setConfirmKind(null);
            },
          },
        );
      },
    },
    "check-in": {
      title: welperDetail.confirmCheckIn.title,
      description: welperDetail.confirmCheckIn.description,
      confirmLabel: welperDetail.confirmCheckIn.confirm,
      cancelLabel: welperDetail.confirmCheckIn.cancel,
      variant: "primary",
      pending: checkInMutation.isPending,
      onConfirm: () => {
        setMutationError(null);
        checkInMutation.mutate(bookingId, {
          onSuccess: () => setConfirmKind(null),
          onError: (err) => {
            setMutationError(
              handleBookableError(err, welperDetail.checkInFailed),
            );
            setConfirmKind(null);
          },
        });
      },
    },
    cancel: {
      title: welperBookings.confirm.cancelTitle,
      description: isWelper
        ? welperBookings.confirm.cancelDescription
        : welperBookings.confirm.cancelDescriptionCustomer,
      confirmLabel: welperBookings.confirm.cancelConfirm,
      cancelLabel: welperBookings.confirm.cancelCancel,
      variant: "danger",
      reasonField: {
        label: welperBookings.confirm.cancelReasonLabel,
        placeholder: welperBookings.confirm.cancelReasonPlaceholder,
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
              setMutationError(
                handleBookableError(err, welperBookings.cancelFailed),
              );
              setConfirmKind(null);
            },
          },
        );
      },
    },
  };

  const activeConfirm = confirmKind ? confirmConfig[confirmKind] : null;

  const formattedTotal =
    booking.totalPrice != null ? welperDetail.formatCurrency(booking.totalPrice) : null;
  const formattedRate =
    booking.hourlyRate != null ? welperDetail.formatCurrency(booking.hourlyRate) : null;

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
            {welperDetail.backToBookings}
          </Button>
        </Box>

        {/* Header: Booking ID + Status. aria-live so SR users hear status changes. */}
        <Flex direction="column" gap="2" aria-live="polite">
          <Heading as="h1" size="7" mb="0" trim="start">
            {welperDetail.bookingTitle(booking.id.slice(-8).toUpperCase())}
          </Heading>
          <Box>
            <Badge
              color={getStatusColor(booking.status)}
              variant="soft"
              size="2"
            >
              <Text size="2" weight="bold">
                {bookingStatusLabel(booking.status)}
              </Text>
            </Badge>
          </Box>
        </Flex>

        {isWelper && booking.status === "payment_released" && (
          <Callout.Root color={SEMANTIC_COLOR.info} variant="surface">
            <Callout.Text>{welperDetail.paymentReleasedPayoutNote}</Callout.Text>
          </Callout.Root>
        )}

        {/* Horizontal timeline */}
        <Card size="4" variant="surface">
          <Flex direction="column" gap="3">
            <Heading as="h2" size="5" mb="2">
              {welperDetail.timeline}
            </Heading>
            <Box className={styles.timelineScroll}>
              <Box className={styles.timelineRow}>
                {timelineEvents.map((event, index) => {
                  const isCancelledOrDeclined =
                    event.key === "cancelled" || event.key === "declined";
                  const isLast = index === timelineEvents.length - 1;
                  return (
                    <Flex
                      key={`${event.key}-${index}`}
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
                          {timelineLabel(event.key)}
                        </Text>
                        <Text size="1" color="gray" align="center">
                          {formatDateTime(event.date, dateLocale)}
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
                  {welperDetail.quickActionsTitle}
                </Heading>
                <Text as="p" size="2" color="gray">
                  {welperDetail.quickActionsHint}
                </Text>
              </Flex>
              {isWelper && actions.includes("check-in") && (
                <Callout.Root color={SEMANTIC_COLOR.info} variant="surface">
                  <Callout.Text>{welperDetail.checkInLateHint}</Callout.Text>
                </Callout.Root>
              )}
              <Flex gap="3" justify="end" wrap="wrap">
                {actions.includes("decline") && isWelper && (
                  <Button
                    size="3"
                    color={SEMANTIC_COLOR.danger}
                    variant="outline"
                    onClick={() => setConfirmKind("decline")}
                    disabled={declineMutation.isPending}
                  >
                    {welperBookings.decline}
                  </Button>
                )}
                {actions.includes("cancel") &&
                  !(isWelper && actions.includes("decline")) && (
                  <Button
                    size="3"
                    color={SEMANTIC_COLOR.danger}
                    variant="outline"
                    onClick={() => setConfirmKind("cancel")}
                    disabled={cancelMutation.isPending}
                  >
                    {welperBookings.cancelBooking}
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
                    {welperDetail.checkIn}
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
                    {welperDetail.checkOut}
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
                    {welperDetail.acceptBooking}
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
                {welperDetail.overviewTitle}
              </Heading>
              <Text size="4" weight="bold" as="p">
                {serviceOfferingName ??
                  welperDetail.serviceFallback(
                    booking.serviceOfferingId.slice(-8).toUpperCase(),
                  )}
              </Text>
              <Text as="p" size="2" color="gray" mt="2">
                {booking.scheduledDate
                  ? formatDate(booking.scheduledDate, dateLocale)
                  : welperDetail.scheduleTbd}
                {booking.scheduledStartTime
                  ? ` · ${booking.scheduledStartTime}${
                      booking.scheduledEndTime ? ` – ${booking.scheduledEndTime}` : ""
                    }`
                  : null}
                {booking.durationMinutes != null
                  ? ` · ${welperDetail.formatDuration(booking.durationMinutes)}`
                  : null}
              </Text>
            </Box>

            <Separator size="4" />

            <Flex direction="column" gap="3">
              <Heading as="h3" size="3" mb="1">
                {welperDetail.peopleTitle}
              </Heading>
              <Flex gap="6" wrap="wrap" align="start">
                <Flex direction="column" gap="1" minWidth="160px" flexBasis="200px" flexGrow="1">
                  <Text size="1" color="gray" weight="medium">
                    {welperDetail.customer}
                  </Text>
                  {isWelper ? (
                    <button
                      type="button"
                      onClick={() => {
                        const name =
                          customerDisplayFirstName?.trim() ||
                          `#${booking.customerId.slice(-8).toUpperCase()}`;
                        setPreviewCustomerFallback({
                          name,
                          photoUrl: customerDisplayPhotoUrl ?? null,
                        });
                        setPreviewCustomerId(booking.customerId);
                      }}
                      aria-label={customerPreviewLabels.viewCustomerAria}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "var(--space-2)",
                        padding: "var(--space-1) var(--space-2)",
                        margin: "calc(-1 * var(--space-1)) calc(-1 * var(--space-2))",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        borderRadius: "var(--radius-2)",
                        minWidth: 0,
                        textAlign: "left",
                      }}
                    >
                      <Avatar
                        size="2"
                        src={customerDisplayPhotoUrl ?? undefined}
                        fallback={
                          customerDisplayFirstName
                            ? customerDisplayFirstName.slice(0, 2).toUpperCase()
                            : "CU"
                        }
                      />
                      <Text size="2" weight="medium" highContrast>
                        {customerDisplayFirstName ??
                          `#${booking.customerId.slice(-8).toUpperCase()}`}
                      </Text>
                    </button>
                  ) : (
                    <Flex align="center" gap="2">
                      <Avatar
                        size="2"
                        src={customerDisplayPhotoUrl ?? undefined}
                        fallback={
                          customerDisplayFirstName
                            ? customerDisplayFirstName.slice(0, 2).toUpperCase()
                            : user?.id === booking.customerId
                              ? (user?.name?.trim().slice(0, 2) ||
                                  user?.email?.slice(0, 2) ||
                                  "ME").toUpperCase()
                              : "CU"
                        }
                      />
                      <Text size="2">
                        {user?.id === booking.customerId
                          ? welperDetail.you
                          : customerDisplayFirstName ??
                            `#${booking.customerId.slice(-8).toUpperCase()}`}
                      </Text>
                    </Flex>
                  )}
                </Flex>
                <Flex direction="column" gap="1" minWidth="160px" flexBasis="200px" flexGrow="1">
                  <Text size="1" color="gray" weight="medium">
                    {welperDetail.welper}
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
                        ? welperDetail.you
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
                    {welperDetail.scheduleTitle}
                  </Heading>
                  <Flex gap="6" wrap="wrap">
                    {booking.scheduledDate && (
                      <Flex direction="column" gap="1">
                        <Flex align="center" gap="2">
                          <Calendar size={14} color="var(--gray-9)" aria-hidden />
                          <Text size="1" color="gray" weight="medium">
                            {welperDetail.scheduleDate}
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
                            {welperDetail.scheduleTimeWindow}
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
                {welperDetail.pricingTitle}
              </Heading>
              <Flex gap="6" wrap="wrap" align="end">
                {booking.durationMinutes != null && (
                  <Flex direction="column" gap="1" minWidth="120px">
                    <Text size="1" color="gray" weight="medium">
                      {welperDetail.durationLabel}
                    </Text>
                    <Text size="3" weight="medium">
                      {welperDetail.formatDuration(booking.durationMinutes)}
                    </Text>
                  </Flex>
                )}
                {formattedRate && (
                  <Flex direction="column" gap="1" minWidth="120px">
                    <Flex align="center" gap="2">
                      <DollarSign size={14} color="var(--gray-9)" aria-hidden />
                      <Text size="1" color="gray" weight="medium">
                        {welperDetail.hourlyRate}
                      </Text>
                    </Flex>
                    <Text size="3" weight="medium">
                      {welperDetail.ratePerHour(formattedRate)}
                    </Text>
                  </Flex>
                )}
                {formattedTotal && (
                  <Flex direction="column" gap="1" minWidth="140px">
                    <Flex align="center" gap="2">
                      <DollarSign size={14} color="var(--gray-9)" aria-hidden />
                      <Text size="1" color="gray" weight="medium">
                        {welperDetail.agreedTotal}
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
                {welperDetail.actionsTitle}
              </Heading>
              <Text as="p" size="1" color="gray">
                {isWelper
                  ? welperDetail.actionsHint
                  : customerDetail.actionsHint}
              </Text>
              {booking.status === "disputed" ? (
                <Callout.Root color={SEMANTIC_COLOR.warning} variant="surface">
                  <Callout.Text>
                    {isWelper
                      ? welperDetail.disputeBlocked
                      : welperDetail.disputeBlocked}
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
                        {welperDetail.yourReview}
                      </Text>
                      <Text size="2">
                        {welperDetail.reviewRating(bookingReview.rating)}
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
                      {welperDetail.editReview}
                    </Button>
                  </Flex>
                ) : null}
                {canDispute && hasDispute ? (
                  <Flex align="center" gap="2" wrap="wrap">
                    <Text size="2" color="gray">
                      {welperDetail.reportInProgress}
                    </Text>
                    <DisputeStatusBadge
                      status={bookingDispute!.status}
                      label={disputeStatusLabel(bookingDispute!.status)}
                    />
                  </Flex>
                ) : null}
                {canDispute && !hasDispute ? (
                  <Button
                    size="2"
                    variant="outline"
                    color={SEMANTIC_COLOR.warning}
                    onClick={() => setDisputeDialogOpen(true)}
                  >
                    {welperDetail.reportProblem}
                  </Button>
                ) : null}
                {user?.id && booking && canMessageBookingParticipant(booking) ? (
                  <Button
                    size="2"
                    variant="outline"
                    color={isWelper ? SEMANTIC_COLOR.primary : SEMANTIC_COLOR.info}
                    asChild
                  >
                    <Link href={`/dashboard/messages/${bookingId}`}>
                      <MessageCircle size={16} aria-hidden />
                      {isWelper ? welperDetail.messageCustomer : customerDetail.messageWelper}
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
                    {isWelper ? welperDetail.reviewCustomer : customerDetail.reviewWelper}
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
                      {welperDetail.serviceReceiptTitle}
                    </Heading>
                    <Text as="p" size="1" color="gray">
                      {welperDetail.serviceReceiptSubtitle}
                    </Text>
                  </Flex>
                </Flex>
                <Badge color={SEMANTIC_COLOR.primary} variant="soft" size="2">
                  <Text size="2" weight="bold">
                    {welperDetail.confirmed}
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
                        {welperDetail.billingPeriod}
                      </Text>
                      <Text size="2">
                        {formatDateTime(booking.serviceReceipt.billingCheckInAt, dateLocale)} —{" "}
                        {formatDateTime(booking.serviceReceipt.billingCheckOutAt, dateLocale)}
                      </Text>
                    </Flex>
                    <Flex direction="column" gap="1" minWidth="140px">
                      <Text size="1" color="gray" weight="medium">
                        {welperDetail.rateOnReceipt}
                      </Text>
                      <Text size="2" weight="medium">
                        {welperDetail.ratePerHour(
                          welperDetail.formatCurrency(booking.serviceReceipt.hourlyRate),
                        )}
                      </Text>
                    </Flex>
                  </Flex>

                  <Separator size="4" />

                  <Box>
                    <Text size="1" color="gray" weight="medium">
                      {welperDetail.amountCharged}
                    </Text>
                    <Text size="6" weight="bold" mt="2" as="p">
                      {welperDetail.formatCurrency(booking.serviceReceipt.totalCents / 100)}
                    </Text>
                  </Box>

                  {/* Price transparency (subtotal + tax), when provided by BFF */}
                  {typeof booking.serviceReceipt.subtotalCents === "number" ? (
                    <Flex direction="column" gap="2">
                      <Flex justify="between">
                        <Text size="2" color="gray">
                          Subtotal
                        </Text>
                        <Text size="2">
                          {(booking.serviceReceipt.subtotalCents / 100).toLocaleString("en-US", {
                            style: "currency",
                            currency: booking.serviceReceipt.currency.toUpperCase(),
                            currencyDisplay: "code",
                          })}
                        </Text>
                      </Flex>
                      <Flex justify="between">
                        <Text size="2" color="gray">
                          Tax
                        </Text>
                        <Text size="2">
                          {(booking.serviceReceipt.taxCents / 100).toLocaleString("en-US", {
                            style: "currency",
                            currency: booking.serviceReceipt.currency.toUpperCase(),
                            currencyDisplay: "code",
                          })}
                        </Text>
                      </Flex>
                    </Flex>
                  ) : null}

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
                        attachmentFallback={welperDetail.attachmentFallback}
                        previewUnavailable={welperDetail.previewUnavailable}
                      />
                    </>
                  ) : null}
                </Flex>
              </Card>

              {isCustomer && user?.id === booking.customerId ? (
                <Callout.Root color={SEMANTIC_COLOR.info} variant="surface">
                  <Callout.Text>
                    {customerDetail.receiptWrongAmountCallout}
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
                {customerDetail.payment.sectionTitle}
              </Heading>

              {needsCustomerAuthorization ? (
                <Flex direction="column" gap="2">
                  <Text size="2" weight="medium">
                    {customerDetail.payment.cardOnFile}
                  </Text>
                  {showAuthorizePayment ? (
                    <Flex direction="column" gap="2" align="start">
                      <Text size="2" color="gray">
                        {customerDetail.payment.authorizeHint}
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
                          {bookingPayIntentMutation.isPending
                            ? customerDetail.payment.authorizing
                            : customerDetail.payment.authorize}
                        </Button>
                      </Flex>
                    </Flex>
                  ) : paymentPhase === "authorized" ? (
                    <Text size="2" color="gray">
                      {customerDetail.payment.holdActive}
                      {booking.captureEligibleAt
                        ? customerDetail.payment.captureScheduled(
                            formatDateTime(booking.captureEligibleAt),
                          )
                        : null}
                    </Text>
                  ) : paymentPhase === "captured" ? (
                    <Text size="2" color="gray">
                      {customerDetail.payment.captured}
                    </Text>
                  ) : paymentPhase === "canceled" || paymentPhase === "failed" ? (
                    <Text size="2" color="gray">
                      {customerDetail.payment.failed}
                    </Text>
                  ) : null}
                </Flex>
              ) : null}

              {showReceiptBalancePayment ? (
                <Card size="2" variant="surface">
                  <Flex direction="column" gap="3" align="start">
                    <Text size="2" weight="medium">
                      {customerDetail.payment.balanceTitle}
                    </Text>
                    <Text size="2" color="gray">
                      {customerDetail.payment.balanceHint}
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
                        {customerDetail.payment.payBalance}
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
                {customerDetail.locationSectionTitle}
              </Heading>

              {booking.address &&
                Object.keys(booking.address).length > 0 && (
                  <Flex direction="column" gap="2">
                    <Flex align="center" gap="2">
                      <MapPin size={14} color="var(--gray-9)" aria-hidden />
                      <Text size="1" color="gray" weight="medium">
                        {customerDetail.serviceAddress}
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
                      {welperDetail.notesTitle}
                    </Text>
                  </Flex>
                  <Text size="2">{booking.notes}</Text>
                </Flex>
              ) : null}

              {bookingAnswerRows.length > 0 ? (
                <Flex direction="column" gap="3">
                  <Heading as="h3" size="3" mb="0">
                    {customerDetail.serviceQuestions}
                  </Heading>
                  <Card size="2" variant="surface">
                    <Flex direction="column" gap="4">
                      {bookingAnswerRows.map((row) => (
                        <Flex key={row.key} direction="column" gap="1">
                          <Text size="1" color="gray" weight="medium">
                            {row.label}
                          </Text>
                          <Text size="2">{row.displayValue}</Text>
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
                {customerDetail.cancellationReason}
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
                {customerDetail.declineReason}
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
            title={welperDetail.receiptDialog.title}
            description={welperDetail.receiptDialog.description}
          >
            {receiptDraftLoading ? (
              <Skeleton height="120px" width="100%" />
            ) : receiptDraft?.confirmedReceipt ? (
              <Text size="2">{customerDetail.receiptAlreadyConfirmed}</Text>
            ) : receiptDraft ? (
              <Flex direction="column" gap={FORM_SPACING.fieldGap}>
                <Box>
                  <Text
                    as="label"
                    htmlFor="receipt-billing-in"
                    size="2"
                    weight="medium"
                    mb={FORM_SPACING.labelGap}
                  >
                    {welperDetail.receiptDialog.billingIn}
                    <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                      *
                    </Text>
                  </Text>
                  <TextField.Root
                    id="receipt-billing-in"
                    type="datetime-local"
                    size="2"
                    step={RECEIPT_BILLING_STEP_MINUTES * 60}
                    value={billingInLocal}
                    onChange={(e) => handleReceiptBillingInChange(e.target.value)}
                    aria-required="true"
                  />
                </Box>
                <Box>
                  <Text
                    as="label"
                    htmlFor="receipt-billing-out"
                    size="2"
                    weight="medium"
                    mb={FORM_SPACING.labelGap}
                  >
                    {welperDetail.receiptDialog.billingOut}
                    <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                      *
                    </Text>
                  </Text>
                  <TextField.Root
                    id="receipt-billing-out"
                    type="datetime-local"
                    size="2"
                    step={RECEIPT_BILLING_STEP_MINUTES * 60}
                    value={billingOutLocal}
                    onChange={(e) => handleReceiptBillingOutChange(e.target.value)}
                    aria-required="true"
                  />
                </Box>
                <Box>
                  <Text
                    as="label"
                    htmlFor="receipt-notes"
                    size="2"
                    weight="medium"
                    mb={FORM_SPACING.labelGap}
                  >
                    {welperDetail.receiptDialog.notes}
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
                    {welperDetail.receiptOriginalHold(
                      welperDetail.formatCurrency(receiptDraft.authorizedHoldCents / 100),
                    )}{" "}
                    {welperDetail.receiptExtraChargeHint}
                  </Text>
                ) : null}
                <Text size="3" weight="bold">
                  {welperDetail.receiptTotal(
                    welperDetail.formatCurrency(receiptPreviewCents / 100),
                  )}
                </Text>
                <Flex gap="3" justify="end" wrap="wrap" mt={FORM_SPACING.submitGap}>
                  <Button
                    variant="soft"
                    color="gray"
                    onClick={() => setReceiptDialogOpen(false)}
                  >
                    {commonLabels.cancel}
                  </Button>
                  <Button
                    variant="solid"
                    color={SEMANTIC_COLOR.primary}
                    disabled={
                      submitReceiptMutation.isPending ||
                      receiptPreviewCents <= 0 ||
                      !billingInLocal ||
                      !billingOutLocal ||
                      !receiptBillingDurationOk
                    }
                    onClick={() => {
                      setMutationError(null);
                      const snapped = snapReceiptBillingWindow(
                        new Date(billingInLocal),
                        new Date(billingOutLocal),
                      );
                      submitReceiptMutation.mutate(
                        {
                          bookingId,
                          params: {
                            billingCheckInAt: snapped.checkIn.toISOString(),
                            billingCheckOutAt: snapped.checkOut.toISOString(),
                            notes: receiptNotes.trim() || undefined,
                          },
                        },
                        {
                          onSuccess: (res) => {
                            setReceiptDialogOpen(false);
                            if (res.deltaPayment?.requiresAction) {
                              setMutationError(welperDetail.receiptDialog.extraAuth);
                            } else {
                              setMutationError(null);
                            }
                          },
                          onError: (err) =>
                            setMutationError(
                              err instanceof Error
                                ? err.message
                                : welperDetail.receiptDialog.failed,
                            ),
                        },
                      );
                    }}
                  >
                    {submitReceiptMutation.isPending
                      ? welperDetail.receiptDialog.submitting
                      : welperDetail.receiptDialog.submit}
                  </Button>
                </Flex>
              </Flex>
            ) : (
              <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
                <Callout.Text>
                  {welperDetail.receiptDraftLoadFailed}
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
                ? isWelper
                  ? welperDetail.reviewDialog.editTitle
                  : customerDetail.reviewDialog.editTitle
                : reviewTarget === "customer"
                  ? welperDetail.reviewDialog.newTitle
                  : customerDetail.reviewDialog.newTitle
            }
            description={
              bookingReview
                ? isWelper
                  ? welperDetail.reviewDialog.editDescription
                  : customerDetail.reviewDialog.editDescription
                : reviewTarget === "customer"
                  ? welperDetail.reviewDialog.newDescription
                  : customerDetail.reviewDialog.newDescription
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
                submitLabel={
                  bookingReview
                    ? isWelper
                      ? welperDetail.reviewDialog.saveChanges
                      : customerDetail.reviewDialog.saveChanges
                    : undefined
                }
                labels={welperDetail.ratingForm}
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
                  {bookingReview
                    ? commonLabels.cancel
                    : isWelper
                      ? welperDetail.reviewDialog.skip
                      : customerDetail.reviewDialog.skip}
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
            title={welperDetail.dispute.title}
            description={welperDetail.dispute.description}
          >
            {/* DISPUTES-001 + DISPUTES-002 (Day 16): DisputeForm now mirrors
                the BFF category enum 1:1 (no lossy mapping) AND mounts the
                EvidenceUpload picker inline when an upload handler is wired.
                Keys flow back via `values.evidence` and ship with the create
                payload so the resulting dispute carries the photos / PDFs
                the user attached. */}
            <DisputeForm
              reporterRole={isWelper ? "welper" : "customer"}
              categoryLabels={
                isWelper ? welperDetail.dispute.categories : disputeFormCategories
              }
              labels={welperDetail.disputeForm}
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
      </Flex>
    </Container>
  );
}
