"use client";

import { useState, useMemo, useCallback } from "react";
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
import { Checkbox } from "@welpco/ui/checkbox";
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
import type { ServiceQuestion } from "@/lib/services/booking-service";

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

  // ── Queries & mutations ──────────────────────────────────────────────
  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
  } = usePublicWelperProfile(welperId);

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

  // Fetch service questions for the selected offering's category
  const { data: serviceQuestions } = useServiceQuestions(
    selectedOffering?.serviceCategoryId,
  );

  // Filter questions by conditional logic (showIf)
  const visibleQuestions = useMemo(() => {
    if (!serviceQuestions) return [];
    return serviceQuestions
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .filter((sq) => {
        if (!sq.conditionalLogic?.showIf) return true;
        const { questionId, value } = sq.conditionalLogic.showIf;
        return answers[questionId] === value;
      });
  }, [serviceQuestions, answers]);

  // Check if all required questions are answered
  const requiredQuestionsAnswered = useMemo(() => {
    return visibleQuestions.every((sq) => {
      if (!sq.isRequired) return true;
      const val = answers[sq.question.id];
      if (val === undefined || val === "") return false;
      return true;
    });
  }, [visibleQuestions, answers]);

  // Booking duration is bounded by the BFF DTO at [15, 720] minutes (12h).
  // Mirror those bounds here so the user gets a clear inline error before
  // the BFF rejects the submit. Day 11 audit.
  const MIN_DURATION_MINUTES = 15;
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
    if (durationMinutes < MIN_DURATION_MINUTES) return "short";
    if (durationMinutes > MAX_DURATION_MINUTES) return "long";
    return null;
  }, [durationMinutes]);

  const totalPrice = useMemo(() => {
    if (!durationMinutes || !selectedOffering) return null;
    const hours = durationMinutes / 60;
    return Math.round(selectedOffering.hourlyRate * hours * 100) / 100;
  }, [durationMinutes, selectedOffering]);

  const profileOkForBooking =
    user?.role !== "customer" ||
    (myProfileLoaded && myCustomerProfile?.profileCompletionStatusLabel === "Complete");

  const canSubmit = useMemo(
    () =>
      !!welperId &&
      !!selectedOfferingId &&
      !!scheduledDate &&
      !!startTime &&
      !!endTime &&
      durationMinutes !== null &&
      durationMinutes >= MIN_DURATION_MINUTES &&
      durationMinutes <= MAX_DURATION_MINUTES &&
      requiredQuestionsAnswered &&
      profileOkForBooking,
    [
      welperId,
      selectedOfferingId,
      scheduledDate,
      startTime,
      endTime,
      durationMinutes,
      requiredQuestionsAnswered,
      profileOkForBooking,
    ],
  );

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !welperId) return;
    setSubmitError(null);

    try {
      // Only send answers for visible questions that have values
      const filteredAnswers: Record<string, string | number | boolean> = {};
      for (const sq of visibleQuestions) {
        const val = answers[sq.question.id];
        if (val !== undefined && val !== "") {
          filteredAnswers[sq.question.id] = val;
        }
      }

      const result = await bookable.run(() =>
        createBooking.mutateAsync({
          welperId,
          offeringId: selectedOfferingId,
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
    selectedOfferingId,
    scheduledDate,
    startTime,
    endTime,
    durationMinutes,
    notes,
    answers,
    visibleQuestions,
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
    : totalPrice !== null
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
          Estimated subtotal
        </Heading>
        {durationMinutes !== null && selectedOffering ? (
          <Flex direction="column" gap="2">
            <Flex justify="between">
              <Text size="2" color="gray">
                Duration
              </Text>
              <Text size="2" weight="medium">
                {formatDuration(durationMinutes)}
              </Text>
            </Flex>
            <Flex justify="between">
              <Text size="2" color="gray">
                Rate
              </Text>
              <Text size="2">{formatCurrency(selectedOffering.hourlyRate)}/hr</Text>
            </Flex>
            <Separator size="4" my="1" />
            <Flex justify="between" align="center">
              <Text size="2" weight="bold">
                Subtotal
              </Text>
              <Text size="4" weight="bold" color={SEMANTIC_COLOR.primary}>
                {totalPrice !== null ? `${formatCurrency(totalPrice)} before tax` : "—"}
              </Text>
            </Flex>
          </Flex>
        ) : (
          <Text size="2" color="gray">
            Pick a service and time to see your subtotal.
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
            Your card is held — not charged — when the welper accepts. You&rsquo;re only charged after the service is completed. Free cancellation any time before the service starts.
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

              {/* Service Questions */}
              {visibleQuestions.length > 0 && (
                <Flex direction="column" gap="4">
                  <Heading as="h3" size="5" trim="start">
                    Service questions
                  </Heading>
                  {visibleQuestions.map((sq) => (
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
                      Bookings must be at least 15 minutes long. Lengthen the time window.
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
              Estimated subtotal
            </Text>
            <Text size="3" weight="bold" color={SEMANTIC_COLOR.primary}>
              {totalPrice !== null ? `${formatCurrency(totalPrice)} before tax` : "—"}
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

// ─── Question Field Component ───────────────────────────────────────────

function QuestionField({
  sq,
  value,
  onChange,
}: {
  sq: ServiceQuestion;
  value: string | number | boolean | undefined;
  onChange: (val: string | number | boolean) => void;
}) {
  const { question, isRequired } = sq;
  const fieldId = `q-${question.id}`;
  const labelId = `${fieldId}-label`;
  const helpId = question.helpText ? `${fieldId}-help` : undefined;
  const strVal = value !== undefined && value !== null ? String(value) : "";

  return (
    <Box>
      {question.type === "CHOICE" ? (
        // Select uses a labelled span, not htmlFor (its trigger is a button).
        <Text
          as="label"
          id={labelId}
          size="2"
          weight="medium"
          mb={FORM_SPACING.labelGap}
          style={{ display: "block" }}
        >
          {question.label}
          {isRequired && <RequiredMarker />}
        </Text>
      ) : question.type === "BOOLEAN" ? (
        // Boolean uses Checkbox + adjacent label; the Box-level label sits
        // above it for grouping.
        <Text
          as="span"
          size="2"
          weight="medium"
          mb={FORM_SPACING.labelGap}
          style={{ display: "block" }}
          id={labelId}
        >
          {question.label}
          {isRequired && <RequiredMarker />}
        </Text>
      ) : (
        <Text
          as="label"
          htmlFor={fieldId}
          size="2"
          weight="medium"
          mb={FORM_SPACING.labelGap}
          style={{ display: "block" }}
        >
          {question.label}
          {isRequired && <RequiredMarker />}
        </Text>
      )}

      {question.helpText && (
        <Text as="p" id={helpId} size="1" color="gray" mb={FORM_SPACING.labelGap}>
          {question.helpText}
        </Text>
      )}

      {/* TEXT */}
      {question.type === "TEXT" && (
        <TextField.Root
          id={fieldId}
          type="text"
          value={strVal}
          placeholder={question.placeholder ?? undefined}
          required={isRequired}
          aria-required={isRequired || undefined}
          aria-describedby={helpId}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {/* NUMBER */}
      {question.type === "NUMBER" && (
        <TextField.Root
          id={fieldId}
          type="number"
          value={strVal}
          placeholder={question.placeholder ?? undefined}
          min={question.validationRules?.min}
          max={question.validationRules?.max}
          required={isRequired}
          aria-required={isRequired || undefined}
          aria-describedby={helpId}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === "" ? "" : Number(v));
          }}
        />
      )}

      {/* DATE */}
      {question.type === "DATE" && (
        <TextField.Root
          id={fieldId}
          type="date"
          value={strVal}
          required={isRequired}
          aria-required={isRequired || undefined}
          aria-describedby={helpId}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {/* TIME */}
      {question.type === "TIME" && (
        <TextField.Root
          id={fieldId}
          type="time"
          value={strVal}
          required={isRequired}
          aria-required={isRequired || undefined}
          aria-describedby={helpId}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {/* CHOICE */}
      {question.type === "CHOICE" && (
        <Select
          value={strVal || undefined}
          onValueChange={(v) => onChange(v)}
        >
          <SelectTrigger
            id={fieldId}
            aria-labelledby={labelId}
            aria-required={isRequired || undefined}
            aria-describedby={helpId}
            placeholder="Select…"
          />
          <SelectContent>
            {question.options?.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* BOOLEAN */}
      {question.type === "BOOLEAN" && (
        <Flex align="center" gap="2">
          <Checkbox
            id={fieldId}
            checked={value === true}
            aria-labelledby={labelId}
            aria-describedby={helpId}
            onCheckedChange={(checked) => onChange(checked === true)}
          />
          <Text as="label" htmlFor={fieldId} size="2">
            Yes
          </Text>
        </Flex>
      )}

      {/* ENTITY_REFERENCE — fallback text input */}
      {question.type === "ENTITY_REFERENCE" && (
        <TextField.Root
          id={fieldId}
          type="text"
          value={strVal}
          placeholder={
            question.placeholder ??
            `Enter ${question.entityType?.toLowerCase() ?? "reference"}…`
          }
          required={isRequired}
          aria-required={isRequired || undefined}
          aria-describedby={helpId}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Box>
  );
}
