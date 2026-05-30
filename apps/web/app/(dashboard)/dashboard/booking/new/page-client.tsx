"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Grid } from "@welpco/ui/grid";
import { Container } from "@welpco/ui/container";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Button } from "@welpco/ui/button";
import { Card } from "@welpco/ui/card";
import { Avatar } from "@welpco/ui/avatar";
import { Skeleton } from "@welpco/ui/skeleton";
import { Callout } from "@welpco/ui/callout";
import { Separator } from "@welpco/ui/separator";
import { TextField } from "@welpco/ui/text-field";
import { TextArea } from "@welpco/ui/text-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@welpco/ui/select";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import styles from "./booking-wizard.module.css";
import { usePublicWelperProfile } from "@/lib/hooks/use-service-discovery";
import { useCreateBooking, useServiceQuestions } from "@/lib/hooks/use-bookings";
import { useCustomerProfile } from "@/lib/hooks/use-profile";
import { useAuthStore } from "@/stores/authStore";
import { ApiClientError } from "@/lib/api/client";
import { useBookableAction } from "@/lib/hooks/use-bookable-action";
import { EmailVerificationRequiredDialog } from "@/components/features/dashboard/email-verification-required-dialog";
import { QuestionField } from "@/components/features/booking/question-field";
import {
  areRequiredServiceQuestionsAnswered,
  buildBookingAnswersPayload,
  getVisibleServiceQuestions,
} from "@/lib/services/service-questions-utils";
import {
  computeOneHourHoldSubtotal,
  computeSubtotalFromMinutes,
  MIN_BOOKING_DURATION_MINUTES,
} from "@/lib/booking/booking-pricing";

// ─── Helpers ─────────────────────────────────────────────────────────────

function parseTimeToMinutes(time: string): number | null {
  const parts = time.split(":");
  if (parts.length !== 2) return null;
  const h = parseInt(parts[0]!, 10);
  const m = parseInt(parts[1]!, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

const currencyFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
});

function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

// ─── Required-field marker ───────────────────────────────────────────────

function RequiredMarker() {
  return (
    <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
      *
    </Text>
  );
}

// ─── Component ───────────────────────────────────────────────────────────

interface NewBookingPageClientProps {
  welperId?: string;
  offeringId?: string;
}

export default function NewBookingPageClient({
  welperId,
  offeringId,
}: NewBookingPageClientProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: myCustomerProfile, isSuccess: myProfileLoaded } = useCustomerProfile(
    user?.id ?? "",
    user?.role === "customer",
  );

  // ── Form state ───────────────────────────────────────────────────────
  const [selectedOfferingId, setSelectedOfferingId] = useState(offeringId ?? "");
  const [scheduledDate, setScheduledDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | number | boolean>>({});
  const [selectedQuestionCategoryId, setSelectedQuestionCategoryId] = useState("");

  // ── Queries & mutations ──────────────────────────────────────────────
  const {
    data: profile,
    isPending: profilePending,
    isError: profileError,
  } = usePublicWelperProfile(welperId);

  const profileLoading = profilePending && !profile;

  const createBooking = useCreateBooking();
  const bookable = useBookableAction();

  // ── Derived values ───────────────────────────────────────────────────
  const displayName = useMemo(() => {
    if (!profile) return "Welper";
    return [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Welper";
  }, [profile]);

  const selectedOffering = useMemo(() => {
    if (!profile?.serviceOfferings) return null;
    const id = selectedOfferingId || offeringId;
    if (!id) return null;
    return profile.serviceOfferings.find((o) => o.id === id) ?? null;
  }, [profile?.serviceOfferings, selectedOfferingId, offeringId]);

  useEffect(() => {
    if (offeringId || selectedOfferingId || !profile?.serviceOfferings) return;
    if (profile.serviceOfferings.length === 1) {
      setSelectedOfferingId(profile.serviceOfferings[0]!.id);
    }
  }, [offeringId, profile?.serviceOfferings, selectedOfferingId]);

  const questionCategoryOptions = useMemo(() => {
    if (!selectedOffering) return [];
    return selectedOffering.subcategories && selectedOffering.subcategories.length > 0
      ? selectedOffering.subcategories
      : [{ id: selectedOffering.serviceCategoryId, name: selectedOffering.categoryName }];
  }, [selectedOffering]);

  const offeringSubcategoryCount = selectedOffering?.subcategories?.length ?? 0;
  const showServiceTypeField = offeringSubcategoryCount > 0;
  const serviceTypeIsReadOnly = offeringSubcategoryCount === 1;

  useEffect(() => {
    if (!selectedOffering) {
      setSelectedQuestionCategoryId((prev) => (prev === "" ? prev : ""));
      return;
    }

    const validIds = new Set(questionCategoryOptions.map((option) => option.id));
    if (selectedQuestionCategoryId && validIds.has(selectedQuestionCategoryId)) return;

    const nextCategoryId =
      questionCategoryOptions.length === 1 ? questionCategoryOptions[0]!.id : "";

    if (nextCategoryId !== selectedQuestionCategoryId) {
      setSelectedQuestionCategoryId(nextCategoryId);
      setAnswers({});
    }
  }, [questionCategoryOptions, selectedOffering, selectedQuestionCategoryId]);

  const serviceCategoryId = selectedQuestionCategoryId || undefined;
  const {
    data: serviceQuestions,
    isLoading: serviceQuestionsLoading,
    isError: serviceQuestionsError,
    refetch: refetchServiceQuestions,
  } = useServiceQuestions(serviceCategoryId);

  const displayQuestions = useMemo(() => {
    if (!serviceQuestions) return [];
    return getVisibleServiceQuestions(serviceQuestions, answers, {
      hideScheduleDuplicates: true,
    });
  }, [serviceQuestions, answers]);

  const questionsReady =
    !serviceCategoryId ||
    (!serviceQuestionsLoading && !serviceQuestionsError && !!serviceQuestions);

  const requiredQuestionsAnswered = useMemo(() => {
    if (!serviceQuestions || serviceQuestionsLoading || serviceQuestionsError) {
      return false;
    }
    return areRequiredServiceQuestionsAnswered(serviceQuestions, answers, {
      scheduledDate,
      startTime,
    });
  }, [
    serviceQuestions,
    serviceQuestionsLoading,
    serviceQuestionsError,
    answers,
    scheduledDate,
    startTime,
  ]);

  // Booking duration is bounded by the BFF DTO at [60, 720] minutes (1h–12h).
  const MAX_DURATION_MINUTES = 720;

  const durationMinutes = useMemo(() => {
    if (!startTime || !endTime) return null;
    const startMin = parseTimeToMinutes(startTime);
    const endMin = parseTimeToMinutes(endTime);
    if (startMin === null || endMin === null) return null;
    const diff = endMin - startMin;
    return diff > 0 ? diff : null;
  }, [startTime, endTime]);

  const durationOutOfBounds = useMemo(() => {
    if (durationMinutes === null) return null;
    if (durationMinutes < MIN_BOOKING_DURATION_MINUTES) return "short";
    if (durationMinutes > MAX_DURATION_MINUTES) return "long";
    return null;
  }, [durationMinutes]);

  const oneHourHoldSubtotal = useMemo(() => {
    if (!selectedOffering) return null;
    return computeOneHourHoldSubtotal(selectedOffering.hourlyRate);
  }, [selectedOffering]);

  const estimatedJobSubtotal = useMemo(() => {
    if (!durationMinutes || !selectedOffering) return null;
    return computeSubtotalFromMinutes(selectedOffering.hourlyRate, durationMinutes);
  }, [durationMinutes, selectedOffering]);

  const profileOkForBooking =
    user?.role !== "customer" ||
    (myProfileLoaded && myCustomerProfile?.profileCompletionStatusLabel === "Complete");

  const canSubmit = useMemo(
    () =>
      !!welperId &&
      !!selectedOffering &&
      !!serviceCategoryId &&
      !!scheduledDate &&
      !!startTime &&
      !!endTime &&
      durationMinutes !== null &&
      durationMinutes >= MIN_BOOKING_DURATION_MINUTES &&
      durationMinutes <= MAX_DURATION_MINUTES &&
      requiredQuestionsAnswered &&
      questionsReady &&
      profileOkForBooking,
    [
      welperId,
      selectedOfferingId,
      selectedOffering,
      serviceCategoryId,
      scheduledDate,
      startTime,
      endTime,
      durationMinutes,
      requiredQuestionsAnswered,
      questionsReady,
      profileOkForBooking,
    ],
  );

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !welperId || !selectedOffering) return;
    setSubmitError(null);

    try {
      const filteredAnswers =
        serviceQuestions && scheduledDate && startTime
          ? buildBookingAnswersPayload(serviceQuestions, answers, {
              scheduledDate,
              startTime,
            })
          : {};

      const result = await bookable.run(() =>
        createBooking.mutateAsync({
          welperId,
          offeringId: selectedOffering.id,
          serviceQuestionCategoryId: serviceCategoryId,
          answers: filteredAnswers,
          scheduledDate,
          scheduledStartTime: startTime,
          scheduledEndTime: endTime,
          durationMinutes: durationMinutes ?? undefined,
          notes: notes.trim() || undefined,
          timezoneOffsetMinutes: -(new Date().getTimezoneOffset()),
        }),
      );
      // bookable.run swallows EmailVerificationRequiredError and surfaces the
      // dialog instead — `result` is undefined in that case so we keep the
      // user on the page until they verify or close the dialog.
      if (result) {
        router.push("/dashboard/bookings");
      }
    } catch (e) {
      if (e instanceof ApiClientError && e.code === "PAYMENT_METHOD_REQUIRED") {
        setSubmitError("Add a saved payment method in Settings before booking.");
        return;
      }
      setSubmitError(
        e instanceof Error ? e.message : "Failed to create booking. Please try again.",
      );
    }
  }, [
    canSubmit,
    welperId,
    selectedOffering,
    serviceCategoryId,
    scheduledDate,
    startTime,
    endTime,
    durationMinutes,
    notes,
    answers,
    serviceQuestions,
    createBooking,
    bookable,
    router,
  ]);

  // ── Page chrome ──────────────────────────────────────────────────────

  const pageChrome = (children: React.ReactNode) => (
    <Container size="3" px={{ initial: "4", sm: "6" }}>
      {children}
    </Container>
  );

  // ── Early returns ────────────────────────────────────────────────────

  // No welper selected
  if (!welperId) {
    return pageChrome(
      <Flex direction="column" gap="6">
        <Heading as="h1" size="7">
          New booking
        </Heading>
        <Card size="3" variant="surface">
          <Flex direction="column" gap="4" align="start">
            <Text size="2" color="gray">
              No welper selected. Pick a welper to get started.
            </Text>
            <Button
              variant="soft"
              size="2"
              onClick={() => router.push("/dashboard/search")}
            >
              Browse welpers
            </Button>
          </Flex>
        </Card>
      </Flex>,
    );
  }

  // Loading profile
  if (profileLoading) {
    return pageChrome(
      <Flex direction="column" gap="6">
        <Heading as="h1" size="7">
          New booking
        </Heading>
        <Card size="3" variant="surface">
          <Flex gap="4" align="center">
            <Skeleton
              width="56px"
              height="56px"
              style={{ borderRadius: "9999px" }}
            />
            <Flex direction="column" gap="2">
              <Skeleton width="140px" height="20px" />
              <Skeleton width="100px" height="16px" />
            </Flex>
          </Flex>
        </Card>
        <Card size="3" variant="surface">
          <Flex direction="column" gap="4">
            <Skeleton width="100%" height="40px" />
            <Skeleton width="100%" height="40px" />
            <Flex gap="4">
              <Skeleton width="100%" height="40px" style={{ flex: 1 }} />
              <Skeleton width="100%" height="40px" style={{ flex: 1 }} />
            </Flex>
            <Skeleton width="100%" height="80px" />
            <Skeleton width="100%" height="44px" />
          </Flex>
        </Card>
      </Flex>,
    );
  }

  // Error loading profile
  if (profileError || !profile) {
    return pageChrome(
      <Flex direction="column" gap="6">
        <Heading as="h1" size="7">
          New booking
        </Heading>
        <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
          <Callout.Text>
            We couldn&rsquo;t load this welper&rsquo;s profile. Try again, or pick
            another welper.
          </Callout.Text>
        </Callout.Root>
        <Button
          variant="soft"
          size="2"
          onClick={() => router.push("/dashboard/search")}
        >
          Back to search
        </Button>
      </Flex>,
    );
  }

  // ── Main render ──────────────────────────────────────────────────────

  const today = new Date().toISOString().split("T")[0];

  const submitLabel = createBooking.isPending
    ? "Confirming…"
    : oneHourHoldSubtotal !== null
      ? "Request booking"
      : "Continue";

  // Summary panel — rendered inline on desktop (right column) and in the
  // sticky mobile footer. Same content, two placements.
  const summaryPanel = (
    <Card size="2" variant="surface" aria-labelledby="booking-summary-heading">
      <Flex direction="column" gap="3">
        <Heading
          as="h2"
          id="booking-summary-heading"
          size="3"
          trim="start"
        >
          Payment hold
        </Heading>
        {selectedOffering ? (
          <Flex direction="column" gap="2">
            <Flex justify="between">
              <Text size="2" color="gray">
                Rate
              </Text>
              <Text size="2">{formatCurrency(selectedOffering.hourlyRate)}/hr</Text>
            </Flex>
            <Flex justify="between" align="center">
              <Text size="2" color="gray">
                Hold (1 hour)
              </Text>
              <Text size="4" weight="bold" color={SEMANTIC_COLOR.primary}>
                {oneHourHoldSubtotal !== null
                  ? `${formatCurrency(oneHourHoldSubtotal)} hold`
                  : "—"}
              </Text>
            </Flex>
            <Text size="1" color="gray" highContrast as="p">
              This is a temporary authorization — you are not charged now. Tax is included when
              the hold is placed after the welper accepts.
            </Text>
            {durationMinutes !== null && estimatedJobSubtotal !== null ? (
              <>
                <Separator size="4" my="1" />
                <Flex justify="between">
                  <Text size="2" color="gray">
                    Estimated job ({formatDuration(durationMinutes)})
                  </Text>
                  <Text size="2" weight="medium">
                    {formatCurrency(estimatedJobSubtotal)} before tax
                  </Text>
                </Flex>
                <Text size="1" color="gray" highContrast as="p">
                  Final charge is based on actual time after the service, up to your selected
                  window.
                </Text>
              </>
            ) : null}
          </Flex>
        ) : (
          <Text size="2" color="gray">
            Pick a service to see the hold amount.
          </Text>
        )}

        {/* Cancellation + payment-timing policy — bible §22.6 trust
            contract. The customer must see what they're agreeing to BEFORE
            they hit "Confirm and pay". Aligned with Wave 3 capture timing
            (auth at accept, capture at receipt-submit). */}
        <Separator size="4" my="1" />
        <Flex direction="column" gap="1">
          <Text size="1" color="gray" weight="medium">
            Before you confirm
          </Text>
          <Text size="1" color="gray" highContrast as="p">
            Each booking is for at least one hour of service. When the welper accepts, we place a
            hold for one hour on your card — not a charge. You are only charged after the job is
            completed. Cancel more than 24 hours before the start time and the hold is released with
            no fee. Cancel within 24 hours of the start time and the one-hour hold may be charged as
            a cancellation fee.
          </Text>
        </Flex>
      </Flex>
    </Card>
  );

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
        {/* Page header */}
        <Box>
          <Heading as="h1" size="7" mb="2">
            New booking
          </Heading>
          <Text as="p" size="2" color="gray">
            Schedule a booking with {displayName}
          </Text>
        </Box>

        {/* Welper info card */}
        <Card size="3" variant="surface">
          <Flex gap="4" align="center">
            <Avatar
              size="4"
              src={profile.profilePhotoUrl ?? undefined}
              fallback={displayName.slice(0, 2).toUpperCase()}
            />
            <Box style={{ minWidth: 0 }}>
              <Text size="4" weight="bold" style={{ display: "block" }}>
                {displayName}
              </Text>
              {profile.bio && (
                <Text as="p" size="2" color="gray" mt="1">
                  {profile.bio.length > 120
                    ? `${profile.bio.slice(0, 120)}…`
                    : profile.bio}
                </Text>
              )}
            </Box>
          </Flex>
        </Card>

        {/* Two-column layout: form + summary on desktop, single column on mobile. */}
        <Grid columns={{ initial: "1", md: "1fr 320px" }} gap="6" align="start">
          {/* Form card */}
          <Card size="3" variant="surface">
            <Flex direction="column" gap={FORM_SPACING.sectionGap}>
              <Heading as="h2" size="5" trim="start">
                Booking details
              </Heading>

              {/* Service selection */}
              <Box>
                <Text
                  as="label"
                  id="booking-service-label"
                  size="2"
                  weight="bold"
                  mb={FORM_SPACING.labelGap}
                  style={{ display: "block" }}
                >
                  Service
                  <RequiredMarker />
                </Text>
                {offeringId && selectedOffering ? (
                  <Card size="1" variant="surface">
                    <Flex align="center" gap="3" wrap="wrap">
                      <Text size="2" weight="medium">
                        {selectedOffering.categoryName}
                        {selectedOffering.parentCategoryName
                          ? ` · ${selectedOffering.parentCategoryName}`
                          : ""}
                      </Text>
                      <Text size="2" color="gray" ml="auto">
                        {formatCurrency(selectedOffering.hourlyRate)}/hr
                      </Text>
                    </Flex>
                  </Card>
                ) : (
                  <Select
                    value={selectedOfferingId || undefined}
                    onValueChange={(value) => {
                      setSelectedOfferingId(value);
                      setSelectedQuestionCategoryId("");
                      setAnswers({});
                      setSubmitError(null);
                    }}
                  >
                    <SelectTrigger
                      aria-labelledby="booking-service-label"
                      aria-required="true"
                      placeholder="Select a service…"
                    />
                    <SelectContent>
                      {profile.serviceOfferings.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.categoryName}
                          {o.parentCategoryName ? ` · ${o.parentCategoryName}` : ""}
                          {" — "}
                          {formatCurrency(o.hourlyRate)}/hr
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </Box>

              {!selectedOffering && (
                <Callout.Root color="gray" variant="surface">
                  <Callout.Text>
                    Choose a service first. The questions for that service will appear here.
                  </Callout.Text>
                </Callout.Root>
              )}

              {selectedOffering && (
                <>
              {showServiceTypeField && (
                <Box>
                  <Text
                    as="label"
                    id="booking-service-type-label"
                    size="2"
                    weight="bold"
                    mb={FORM_SPACING.labelGap}
                    style={{ display: "block" }}
                  >
                    Service type
                    {serviceTypeIsReadOnly ? null : <RequiredMarker />}
                  </Text>
                  {serviceTypeIsReadOnly ? (
                    <Card
                      size="1"
                      variant="surface"
                      aria-labelledby="booking-service-type-label"
                      style={{
                        backgroundColor: "var(--gray-a2)",
                        borderColor: "var(--gray-a6)",
                      }}
                    >
                      <Text size="2" color="gray" highContrast>
                        {questionCategoryOptions[0]!.name}
                      </Text>
                    </Card>
                  ) : (
                    <Select
                      value={selectedQuestionCategoryId || undefined}
                      onValueChange={(value) => {
                        setSelectedQuestionCategoryId(value);
                        setAnswers({});
                        setSubmitError(null);
                      }}
                    >
                      <SelectTrigger
                        aria-labelledby="booking-service-type-label"
                        aria-required="true"
                        placeholder="Select a service type…"
                      />
                      <SelectContent>
                        {questionCategoryOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </Box>
              )}

              {offeringSubcategoryCount > 1 && !serviceCategoryId && (
                <Callout.Root color="gray" variant="surface">
                  <Callout.Text>
                    Choose a service type to load the right questions.
                  </Callout.Text>
                </Callout.Root>
              )}

              {serviceCategoryId && (
                <>
              {/* Service Questions */}
              {serviceCategoryId &&
                (serviceQuestionsLoading ||
                  serviceQuestionsError ||
                  displayQuestions.length > 0) && (
                <Flex direction="column" gap="4">
                  <Heading as="h3" size="5" trim="start">
                    Service questions
                  </Heading>
                  {serviceQuestionsLoading && (
                    <Flex direction="column" gap="3">
                      <Skeleton width="100%" height="40px" />
                      <Skeleton width="100%" height="40px" />
                    </Flex>
                  )}
                  {serviceQuestionsError && (
                    <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
                      <Callout.Text>
                        We couldn&rsquo;t load questions for this service. Check your connection
                        and try again.
                      </Callout.Text>
                      <Button
                        variant="soft"
                        size="2"
                        mt="2"
                        onClick={() => void refetchServiceQuestions()}
                      >
                        Retry
                      </Button>
                    </Callout.Root>
                  )}
                  {!serviceQuestionsLoading &&
                    !serviceQuestionsError &&
                    displayQuestions.map((sq) => (
                      <QuestionField
                        key={sq.id}
                        sq={sq}
                        value={answers[sq.question.id]}
                        onChange={(val) =>
                          setAnswers((prev) => ({ ...prev, [sq.question.id]: val }))
                        }
                      />
                    ))}
                </Flex>
              )}

              <Box>
                <Heading as="h3" size="5" mb="3" trim="start">
                  When
                </Heading>
                <Flex direction="column" gap="4">
                  {/* Date */}
                  <Box>
                    <Text
                      as="label"
                      size="2"
                      weight="bold"
                      htmlFor="booking-date"
                      mb={FORM_SPACING.labelGap}
                      style={{ display: "block" }}
                    >
                      Date
                      <RequiredMarker />
                    </Text>
                    <TextField.Root
                      id="booking-date"
                      type="date"
                      value={scheduledDate}
                      min={today}
                      required
                      aria-required="true"
                      onChange={(e) => {
                        setScheduledDate(e.target.value);
                        setSubmitError(null);
                      }}
                    />
                  </Box>

                  {/* Start / End time */}
                  <Flex gap="4" wrap="wrap">
                    <Box style={{ flex: 1, minWidth: 140 }}>
                      <Text
                        as="label"
                        size="2"
                        weight="bold"
                        htmlFor="booking-start"
                        mb={FORM_SPACING.labelGap}
                        style={{ display: "block" }}
                      >
                        Start time
                        <RequiredMarker />
                      </Text>
                      <TextField.Root
                        id="booking-start"
                        type="time"
                        value={startTime}
                        required
                        aria-required="true"
                        aria-invalid={
                          startTime && endTime && durationMinutes === null
                            ? true
                            : undefined
                        }
                        aria-describedby={
                          startTime && endTime && durationMinutes === null
                            ? "booking-time-error"
                            : undefined
                        }
                        onChange={(e) => {
                          setStartTime(e.target.value);
                          setSubmitError(null);
                        }}
                      />
                    </Box>
                    <Box style={{ flex: 1, minWidth: 140 }}>
                      <Text
                        as="label"
                        size="2"
                        weight="bold"
                        htmlFor="booking-end"
                        mb={FORM_SPACING.labelGap}
                        style={{ display: "block" }}
                      >
                        End time
                        <RequiredMarker />
                      </Text>
                      <TextField.Root
                        id="booking-end"
                        type="time"
                        value={endTime}
                        required
                        aria-required="true"
                        aria-invalid={
                          startTime && endTime && durationMinutes === null
                            ? true
                            : undefined
                        }
                        aria-describedby={
                          startTime && endTime && durationMinutes === null
                            ? "booking-time-error"
                            : undefined
                        }
                        onChange={(e) => {
                          setEndTime(e.target.value);
                          setSubmitError(null);
                        }}
                      />
                    </Box>
                  </Flex>

                  {/* Invalid / out-of-bounds time warning. Bible §17.5:
                      what / why / what-to-do per case. */}
                  {startTime && endTime && durationMinutes === null && (
                    <Text
                      id="booking-time-error"
                      role="alert"
                      size="1"
                      color={SEMANTIC_COLOR.danger}
                    >
                      End time must be after start time.
                    </Text>
                  )}
                  {durationOutOfBounds === "short" && (
                    <Text
                      id="booking-time-error"
                      role="alert"
                      size="1"
                      color={SEMANTIC_COLOR.danger}
                    >
                      Bookings must be at least 1 hour long. Lengthen the time window.
                    </Text>
                  )}
                  {durationOutOfBounds === "long" && (
                    <Text
                      id="booking-time-error"
                      role="alert"
                      size="1"
                      color={SEMANTIC_COLOR.danger}
                    >
                      Bookings can&rsquo;t be longer than 12 hours. Split into two bookings if you need more time.
                    </Text>
                  )}
                </Flex>
              </Box>

              {/* Notes — capped at 2000 chars to mirror BFF DTO. */}
              <Box>
                <Flex justify="between" align="baseline" mb={FORM_SPACING.labelGap}>
                  <Text
                    as="label"
                    size="2"
                    weight="bold"
                    htmlFor="booking-notes"
                    style={{ display: "block" }}
                  >
                    Notes{" "}
                    <Text as="span" color="gray" weight="regular">
                      (optional)
                    </Text>
                  </Text>
                  <Text size="1" color="gray" aria-live="polite">
                    {notes.length} / 2000
                  </Text>
                </Flex>
                <TextArea
                  id="booking-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, 2000))}
                  placeholder="Any special instructions or requests…"
                  rows={3}
                  maxLength={2000}
                />
              </Box>

              {/* Profile-completion gate */}
              {user?.role === "customer" &&
                myProfileLoaded &&
                myCustomerProfile?.profileCompletionStatusLabel !== "Complete" && (
                  <Callout.Root color={SEMANTIC_COLOR.warning} variant="surface">
                    <Flex direction="column" gap="3" align="start">
                      <Callout.Text>
                        Add your profile details and a saved payment method before
                        you can confirm a booking.
                      </Callout.Text>
                      <Button
                        size="2"
                        variant="soft"
                        color={SEMANTIC_COLOR.warning}
                        onClick={() => router.push("/dashboard/settings?tab=payment")}
                      >
                        Payment settings
                      </Button>
                    </Flex>
                  </Callout.Root>
                )}

              {/* Submit error */}
              {submitError && (
                <Callout.Root
                  color={SEMANTIC_COLOR.danger}
                  variant="surface"
                  role="alert"
                >
                  <Callout.Text>{submitError}</Callout.Text>
                </Callout.Root>
              )}

              {/* Inline (desktop) summary lives in the right column.
                  On mobile, the sticky footer provides the CTA, so we hide the
                  inline submit on small screens to avoid duplication. */}
              <Box display={{ initial: "none", md: "block" }}>
                <Button
                  type="submit"
                  size="3"
                  color={SEMANTIC_COLOR.primary}
                  disabled={!canSubmit || createBooking.isPending}
                  onClick={handleSubmit}
                  style={{ width: "100%" }}
                >
                  {submitLabel}
                </Button>
              </Box>
                </>
              )}
                </>
              )}
            </Flex>
          </Card>

          {/* Desktop summary column */}
          <Box display={{ initial: "none", md: "block" }} style={{ position: "sticky", top: "var(--space-5)" }}>
            {summaryPanel}
          </Box>
        </Grid>

        {/* Bottom spacer so the sticky mobile footer doesn't cover content
            when scrolled to the bottom. Footer height ≈ 96–112px (total row +
            44px CTA + py=3 padding); space-9 ≈ 96px gives a safe buffer. */}
        <Box display={{ initial: "block", md: "none" }} style={{ height: "var(--space-9)" }} />
      </Flex>

      {/* Mobile sticky footer — total + Confirm CTA. The negative horizontal
          margins bleed the panel to the container's padding so the blur fills
          the viewport edge-to-edge on small screens. */}
      <Box
        className={styles.mobileFooter}
        display={{ initial: "block", md: "none" }}
        position="sticky"
        bottom="0"
        py="3"
        px="4"
        mx={{ initial: "-4", sm: "-6" }}
        style={{
          zIndex: 20,
          backgroundColor: "var(--color-panel-translucent)",
          borderTop: "1px solid var(--gray-a5)",
        }}
      >
        <Flex direction="column" gap="2">
          <Flex justify="between" align="center">
            <Text size="1" color="gray">
              Card hold (1 hr)
            </Text>
            <Text size="3" weight="bold" color={SEMANTIC_COLOR.primary}>
              {oneHourHoldSubtotal !== null ? formatCurrency(oneHourHoldSubtotal) : "—"}
            </Text>
          </Flex>
          <Button
            type="submit"
            size="3"
            color={SEMANTIC_COLOR.primary}
            disabled={!canSubmit || createBooking.isPending}
            onClick={handleSubmit}
            style={{ width: "100%" }}
          >
            {submitLabel}
          </Button>
        </Flex>
      </Box>
    </Container>
  );
}
