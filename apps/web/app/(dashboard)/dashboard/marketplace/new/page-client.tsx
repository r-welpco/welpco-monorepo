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
import {
  areRequiredServiceQuestionsAnswered,
  buildBookingAnswersPayload,
  getVisibleServiceQuestions,
  matchesQuestionType,
} from "@/lib/services/service-questions-utils";
import type { ServiceQuestion } from "@/lib/services/booking-service";
import { useBookableAction } from "@/lib/hooks/use-bookable-action";
import { EmailVerificationRequiredDialog } from "@/components/features/dashboard/email-verification-required-dialog";
import { ApiClientError } from "@/lib/api/client";
import { MIN_BOOKING_DURATION_MINUTES } from "@/lib/booking/booking-pricing";

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
  const { user } = useAuthStore();
  const bookable = useBookableAction();
  const createJob = useCreateJobPosting();

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
        e instanceof ApiClientError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Failed to post job.",
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
  ]);

  return (
    <Container size="3" py="6">
      <Flex direction="column" gap="5">
        <Box>
          <Heading size="7" mb="1">
            Post a job
          </Heading>
          <Text size="3" color="gray" highContrast>
            Step {step} of 2 — {step === 1 ? "Category" : "Job details"}
          </Text>
        </Box>

        {!profileComplete && (
          <Callout.Root color="amber" variant="surface">
            <Callout.Text>
              Complete your profile in Settings before posting a job.
            </Callout.Text>
          </Callout.Root>
        )}

        {submitError && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
            <Callout.Text>{submitError}</Callout.Text>
          </Callout.Root>
        )}

        <Card size="4" variant="surface">
          {step === 1 && (
            <Flex direction="column" gap="4">
              <Box>
                <Text size="2" weight="bold" mb={FORM_SPACING.labelGap}>
                  Category
                </Text>
                <Select value={categoryId || undefined} onValueChange={(v) => { setCategoryId(v); setSubcategoryId(""); }}>
                  <SelectTrigger placeholder="Select category" />
                  <SelectContent>
                    {parentCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Box>
              <Box>
                <Text size="2" weight="bold" mb={FORM_SPACING.labelGap}>
                  Subcategory
                </Text>
                <Select
                  value={subcategoryId || undefined}
                  onValueChange={setSubcategoryId}
                  disabled={!categoryId}
                >
                  <SelectTrigger placeholder="Select subcategory" />
                  <SelectContent>
                    {subcategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Box>
              <Flex justify="end">
                <Button disabled={!canContinueStep1} onClick={() => setStep(2)}>
                  Continue
                </Button>
              </Flex>
            </Flex>
          )}

          {step === 2 && (
            <Flex direction="column" gap="4">
              <Box>
                <Heading as="h2" size="4" mb="3" trim="start">
                  About this job
                </Heading>
                <Box>
                  <Text size="2" weight="bold" mb={FORM_SPACING.labelGap}>Title</Text>
                  <TextField.Root value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
                </Box>
              </Box>

              {visibleQuestions.length > 0 && (
                <Box>
                  <Heading as="h2" size="4" mb="3" trim="start">
                    Service questions
                  </Heading>
                  <Flex direction="column" gap="4">
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
                </Box>
              )}
              {!serviceQuestions?.length && (
                <Text size="2" color="gray">No additional questions for this service.</Text>
              )}

              <Box>
                <Heading as="h2" size="4" mb="3" trim="start">
                  When
                </Heading>
                <Flex direction="column" gap="4">
                  <Box>
                    <Text size="2" weight="bold" mb={FORM_SPACING.labelGap}>Date</Text>
                    <TextField.Root type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
                  </Box>
                  <Flex gap="3" wrap="wrap">
                    <Box flexGrow="1">
                      <Text size="2" weight="bold" mb={FORM_SPACING.labelGap}>Start time</Text>
                      <TextField.Root type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                    </Box>
                    <Box flexGrow="1">
                      <Text size="2" weight="bold" mb={FORM_SPACING.labelGap}>End time</Text>
                      <TextField.Root type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                    </Box>
                  </Flex>
                  {startTime && endTime && durationMinutes === null && (
                    <Text size="1" color={SEMANTIC_COLOR.danger}>
                      End time must be after start time.
                    </Text>
                  )}
                  {durationMinutes != null && durationMinutes < MIN_BOOKING_DURATION_MINUTES && (
                    <Text size="1" color={SEMANTIC_COLOR.danger}>
                      Jobs must be at least 1 hour long.
                    </Text>
                  )}
                </Flex>
              </Box>

              {locationAddress && (
                <Callout.Root color="gray" variant="surface">
                  <Callout.Text>Service location: {locationAddress}</Callout.Text>
                </Callout.Root>
              )}

              <Flex justify="between">
                <Button variant="soft" onClick={() => setStep(1)}>Back</Button>
                <Button
                  color={SEMANTIC_COLOR.primary}
                  disabled={!canSubmit || createJob.isPending}
                  onClick={handleSubmit}
                >
                  {createJob.isPending ? "Posting…" : "Post job"}
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
