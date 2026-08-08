"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Box } from "@welpco/ui/box";
import { Container } from "@welpco/ui/container";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Button } from "@welpco/ui/button";
import { Card } from "@welpco/ui/card";
import { TextField } from "@welpco/ui/text-field";
import { Callout } from "@welpco/ui/callout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@welpco/ui/select";
import { SEMANTIC_COLOR, FORM_SPACING } from "@welpco/ui/tokens";
import { useContentCategories, useCategoriesByParent } from "@/lib/hooks/use-content";
import { useServiceQuestions } from "@/lib/hooks/use-bookings";
import { useCreateJobPosting } from "@/lib/hooks/use-job-posting";
import { useCustomerProfile } from "@/lib/hooks/use-profile";
import { useAuthStore } from "@/stores/authStore";
import { QuestionField } from "@/components/features/booking/question-field";
import { useQuestionFieldLabels } from "@/lib/i18n/question-field-labels";
import {
  areRequiredServiceQuestionsAnswered,
  buildBookingAnswersPayload,
  getVisibleServiceQuestions,
  matchesQuestionType,
} from "@/lib/services/service-questions-utils";
import type { ServiceQuestion } from "@/lib/services/booking-service";
import { useBookableAction } from "@/lib/hooks/use-bookable-action";
import { EmailVerificationRequiredDialog } from "@/components/features/dashboard/email-verification-required-dialog";
import { MIN_BOOKING_DURATION_MINUTES } from "@/lib/booking/booking-pricing";
import { useMarketplaceLabels } from "@/lib/i18n/use-dashboard-labels";
import { useCategoryDisplayName } from "@/lib/i18n/category-display-name";
import { useApiErrorMessage } from "@/lib/i18n/use-api-error-message";

type WizardStep = 1 | 2;

function parseTimeToMinutes(time: string): number | null {
  const parts = time.split(":");
  if (parts.length !== 2) return null;
  const h = parseInt(parts[0]!, 10);
  const m = parseInt(parts[1]!, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

/** BFF requires description; derive from text answers since details live in service questions. */
function deriveJobDescription(
  serviceQuestions: ServiceQuestion[] | undefined,
  answers: Record<string, string | number | boolean>,
  fallbackTitle: string,
): string {
  if (!serviceQuestions?.length) return fallbackTitle;

  const textParts = serviceQuestions
    .filter((sq) => matchesQuestionType(sq.question.type, "TEXT"))
    .map((sq) => answers[sq.question.id])
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim());

  return textParts.length > 0 ? textParts.join("\n\n") : fallbackTitle;
}

export default function NewJobPageClient() {
  const router = useRouter();
  const labels = useMarketplaceLabels();
  const questionFieldLabels = useQuestionFieldLabels();
  const categoryDisplayName = useCategoryDisplayName();
  const { user } = useAuthStore();
  const bookable = useBookableAction();
  const createJob = useCreateJobPosting();
  const apiErrorMessage = useApiErrorMessage();

  const [step, setStep] = useState<WizardStep>(1);
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [answers, setAnswers] = useState<Record<string, string | number | boolean>>({});
  const [title, setTitle] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: categories = [] } = useContentCategories(false);
  const parentCategories = categories.filter((c) => c.level === 1);
  const { data: subcategories = [] } = useCategoriesByParent(categoryId || null, !!categoryId);

  const { data: serviceQuestions } = useServiceQuestions(subcategoryId || undefined);
  const { data: customerProfile } = useCustomerProfile(user?.id ?? "", user?.role === "customer");

  const profileComplete =
    customerProfile?.profileCompletionStatusLabel === "Complete";

  const durationMinutes = useMemo(() => {
    const start = parseTimeToMinutes(startTime);
    const end = parseTimeToMinutes(endTime);
    if (start == null || end == null || end <= start) return null;
    return end - start;
  }, [startTime, endTime]);

  /** True when either time error message is showing (drives aria-invalid/aria-describedby). */
  const timeErrorVisible =
    (!!startTime && !!endTime && durationMinutes === null) ||
    (durationMinutes != null && durationMinutes < MIN_BOOKING_DURATION_MINUTES);

  /** Step 2: service questions (schedule collected in the When section below). */
  const visibleQuestions = useMemo(
    () =>
      serviceQuestions
        ? getVisibleServiceQuestions(serviceQuestions, answers, {
            hideScheduleDuplicates: true,
          })
        : [],
    [serviceQuestions, answers],
  );

  const allQuestionsAnswered = useMemo(
    () =>
      serviceQuestions
        ? areRequiredServiceQuestionsAnswered(serviceQuestions, answers, {
            scheduledDate,
            startTime,
          })
        : true,
    [serviceQuestions, answers, scheduledDate, startTime],
  );

  const locationAddress = useMemo(() => {
    const addr = customerProfile?.address;
    if (!addr) return "";
    const parts = [
      addr.streetAddress,
      addr.city,
      addr.stateProvince,
      addr.zipPostalCode,
    ].filter(Boolean);
    return parts.join(", ");
  }, [customerProfile]);

  const canContinueStep1 = !!categoryId && !!subcategoryId;
  const canSubmit =
    !!title.trim() &&
    !!scheduledDate &&
    !!startTime &&
    !!endTime &&
    durationMinutes != null &&
    durationMinutes >= MIN_BOOKING_DURATION_MINUTES &&
    !!locationAddress.trim() &&
    profileComplete &&
    allQuestionsAnswered;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !subcategoryId || durationMinutes == null) return;
    setSubmitError(null);

    try {
      const filteredAnswers = serviceQuestions
        ? buildBookingAnswersPayload(serviceQuestions, answers, { scheduledDate, startTime })
        : {};

      const result = await bookable.run(() =>
        createJob.mutateAsync({
          categoryId,
          subcategoryId,
          answers: filteredAnswers,
          title: title.trim(),
          description: deriveJobDescription(serviceQuestions, answers, title.trim()),
          scheduledDate,
          scheduledStartTime: startTime,
          scheduledEndTime: endTime,
          durationMinutes,
          locationAddress,
        }),
      );

      if (result) {
        router.push(`/dashboard/marketplace/${result.id}`);
      }
    } catch (e) {
      setSubmitError(
        apiErrorMessage(e, "jobPosting", labels.new.submitFailed),
      );
    }
  }, [
    canSubmit,
    subcategoryId,
    durationMinutes,
    serviceQuestions,
    answers,
    scheduledDate,
    startTime,
    bookable,
    createJob,
    categoryId,
    title,
    endTime,
    locationAddress,
    router,
    apiErrorMessage,
    labels.new.submitFailed,
  ]);

  return (
    <Container size="3" py="6">
      <Flex direction="column" gap="5">
        <Box>
          <Heading size="7" mb="1">
            {labels.new.title}
          </Heading>
          <Text size="3" color="gray" highContrast>
            {labels.new.stepOf(
              step,
              step === 1 ? labels.new.stepCategory : labels.new.stepDetails,
            )}
          </Text>
        </Box>

        {!profileComplete && (
          <Callout.Root color="amber" variant="surface">
            <Callout.Text>{labels.new.profileIncomplete}</Callout.Text>
          </Callout.Root>
        )}

        {submitError && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
            <Callout.Text>{submitError}</Callout.Text>
          </Callout.Root>
        )}

        <Card size="4" variant="surface">
          {step === 1 && (
            <Flex direction="column" gap={FORM_SPACING.fieldGap}>
              <Box>
                <Text
                  as="label"
                  id="job-category-label"
                  size="2"
                  weight="medium"
                  mb={FORM_SPACING.labelGap}
                  style={{ display: "block" }}
                >
                  {labels.new.category}
                </Text>
                <Select value={categoryId || undefined} onValueChange={(v) => { setCategoryId(v); setSubcategoryId(""); }}>
                  <SelectTrigger
                    aria-labelledby="job-category-label"
                    placeholder={labels.new.selectCategory}
                  />
                  <SelectContent>
                    {parentCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {categoryDisplayName(c.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Box>
              <Box>
                <Text
                  as="label"
                  id="job-subcategory-label"
                  size="2"
                  weight="medium"
                  mb={FORM_SPACING.labelGap}
                  style={{ display: "block" }}
                >
                  {labels.new.subcategory}
                </Text>
                <Select
                  value={subcategoryId || undefined}
                  onValueChange={setSubcategoryId}
                  disabled={!categoryId}
                >
                  <SelectTrigger
                    aria-labelledby="job-subcategory-label"
                    placeholder={labels.new.selectSubcategory}
                  />
                  <SelectContent>
                    {subcategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {categoryDisplayName(c.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Box>
              <Flex justify="end">
                <Button disabled={!canContinueStep1} onClick={() => setStep(2)}>
                  {labels.new.continue}
                </Button>
              </Flex>
            </Flex>
          )}

          {step === 2 && (
            <Flex direction="column" gap={FORM_SPACING.fieldGap}>
              <Box>
                <Heading as="h2" size="4" mb="3" trim="start">
                  {labels.new.aboutJob}
                </Heading>
                <Box>
                  <Text
                    as="label"
                    htmlFor="job-title"
                    size="2"
                    weight="medium"
                    mb={FORM_SPACING.labelGap}
                    style={{ display: "block" }}
                  >
                    {labels.new.titleLabel}
                  </Text>
                  <TextField.Root id="job-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
                </Box>
              </Box>

              {visibleQuestions.length > 0 && (
                <Box>
                  <Heading as="h2" size="4" mb="3" trim="start">
                    {labels.new.serviceQuestions}
                  </Heading>
                  <Flex direction="column" gap={FORM_SPACING.fieldGap}>
                    {visibleQuestions.map((sq) => (
                      <QuestionField
                        key={sq.id}
                        sq={sq}
                        labels={questionFieldLabels}
                        value={answers[sq.question.id]}
                        onChange={(val) =>
                          setAnswers((prev) => ({ ...prev, [sq.question.id]: val }))
                        }
                      />
                    ))}
                  </Flex>
                </Box>
              )}
              {!serviceQuestions?.length && (
                <Text size="2" color="gray">{labels.new.noServiceQuestions}</Text>
              )}

              <Box>
                <Heading as="h2" size="4" mb="3" trim="start">
                  {labels.new.when}
                </Heading>
                <Flex direction="column" gap={FORM_SPACING.fieldGap}>
                  <Box>
                    <Text
                      as="label"
                      htmlFor="job-date"
                      size="2"
                      weight="medium"
                      mb={FORM_SPACING.labelGap}
                      style={{ display: "block" }}
                    >
                      {labels.new.date}
                    </Text>
                    <TextField.Root id="job-date" type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
                  </Box>
                  {/* Time error renders below the whole row (not inside a column)
                      so an appearing error never shifts the sibling time field. */}
                  <Flex gap="3" wrap="wrap">
                    <Box flexGrow="1">
                      <Text
                        as="label"
                        htmlFor="job-start-time"
                        size="2"
                        weight="medium"
                        mb={FORM_SPACING.labelGap}
                        style={{ display: "block" }}
                      >
                        {labels.new.startTime}
                      </Text>
                      <TextField.Root
                        id="job-start-time"
                        type="time"
                        value={startTime}
                        aria-invalid={timeErrorVisible ? true : undefined}
                        aria-describedby={timeErrorVisible ? "job-time-error" : undefined}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </Box>
                    <Box flexGrow="1">
                      <Text
                        as="label"
                        htmlFor="job-end-time"
                        size="2"
                        weight="medium"
                        mb={FORM_SPACING.labelGap}
                        style={{ display: "block" }}
                      >
                        {labels.new.endTime}
                      </Text>
                      <TextField.Root
                        id="job-end-time"
                        type="time"
                        value={endTime}
                        aria-invalid={timeErrorVisible ? true : undefined}
                        aria-describedby={timeErrorVisible ? "job-time-error" : undefined}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </Box>
                  </Flex>
                  {startTime && endTime && durationMinutes === null && (
                    <Text id="job-time-error" role="alert" size="1" color={SEMANTIC_COLOR.danger}>
                      {labels.new.endAfterStart}
                    </Text>
                  )}
                  {durationMinutes != null && durationMinutes < MIN_BOOKING_DURATION_MINUTES && (
                    <Text id="job-time-error" role="alert" size="1" color={SEMANTIC_COLOR.danger}>
                      {labels.new.minDuration}
                    </Text>
                  )}
                </Flex>
              </Box>

              {locationAddress && (
                <Callout.Root color="gray" variant="surface">
                  <Callout.Text>{labels.new.serviceLocation(locationAddress)}</Callout.Text>
                </Callout.Root>
              )}

              <Flex justify="between">
                <Button variant="soft" onClick={() => setStep(1)}>{labels.new.back}</Button>
                <Button
                  color={SEMANTIC_COLOR.primary}
                  disabled={!canSubmit || createJob.isPending}
                  onClick={handleSubmit}
                >
                  {createJob.isPending ? labels.new.posting : labels.new.postJob}
                </Button>
              </Flex>
            </Flex>
          )}
        </Card>
      </Flex>
      <EmailVerificationRequiredDialog
        open={bookable.dialogOpen}
        onOpenChange={bookable.setDialogOpen}
        email={bookable.email}
        pending={bookable.resendPending}
        onResend={bookable.resend}
      />
    </Container>
  );
}
