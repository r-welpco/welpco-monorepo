"use client";

import { Button } from "@welpco/ui/button";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { TextField } from "@welpco/ui/text-field";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@welpco/ui/select";
import { Skeleton } from "@welpco/ui/skeleton";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import type { WelperProfileDialogOffering } from "./welper-profile-dialog";
import type { BookingWizardQuestion } from "./booking-wizard";

function serviceLabel(o: WelperProfileDialogOffering): string {
  return o.parentCategoryName ? `${o.categoryName} · ${o.parentCategoryName}` : o.categoryName;
}

// --- QuestionInput ---

export function QuestionInput({
  question,
  value,
  onChange,
  id,
}: {
  question: BookingWizardQuestion["question"];
  value: string | number | boolean | undefined;
  onChange: (value: string | number | boolean | undefined) => void;
  id: string;
}) {
  const type = question.type.toLowerCase();
  const strVal = value !== undefined && value !== null ? String(value) : "";

  if (type === "text" || type === "date" || type === "time") {
    return (
      <TextField.Root
        id={id}
        type={type}
        placeholder={type === "text" ? (question.placeholder ?? undefined) : undefined}
        value={strVal}
        onChange={(e) => onChange(e.target.value)}
        size="2"
      />
    );
  }

  if (type === "number") {
    return (
      <TextField.Root
        id={id}
        type="number"
        placeholder={question.placeholder ?? undefined}
        value={strVal}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? (undefined as unknown as number) : Number(v));
        }}
        size="2"
      />
    );
  }

  if (type === "boolean") {
    return (
      <Select
        value={
          value === true ? "true" : value === false ? "false" : undefined
        }
        onValueChange={(v) => onChange(v === "true")}
      >
        <SelectTrigger id={id} aria-label={question.label} placeholder="Select…" />
        <SelectContent>
          <SelectItem value="true">Yes</SelectItem>
          <SelectItem value="false">No</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  if (type === "choice" && question.options && question.options.length > 0) {
    return (
      <Select value={strVal || undefined} onValueChange={(v) => onChange(v)}>
        <SelectTrigger id={id} aria-label={question.label} />
        <SelectContent>
          {question.options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Fallback
  return (
    <TextField.Root
      id={id}
      type="text"
      placeholder={question.placeholder ?? undefined}
      value={strVal}
      onChange={(e) => onChange(e.target.value)}
      size="2"
    />
  );
}

// --- Step: Select Offering ---

export function SelectOfferingStep({
  offerings,
  hasMultiple,
  onSelect,
}: {
  offerings: WelperProfileDialogOffering[];
  hasMultiple: boolean;
  onSelect: (offering: WelperProfileDialogOffering) => void;
}) {
  if (hasMultiple) {
    return (
      <Flex direction="column" gap="3">
        <Text size="2" color="gray" highContrast mb="2">
          Choose a service to book:
        </Text>
        {offerings.map((offering) => (
          <Flex
            key={offering.id}
            gap="4"
            align="center"
            justify="between"
            wrap="wrap"
            style={{
              padding: "var(--space-3)",
              borderRadius: "var(--radius-3)",
              backgroundColor: "var(--gray-2)",
            }}
          >
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text size="3" weight="bold">
                {serviceLabel(offering)}
              </Text>
              <Text size="2" color="gray" highContrast mt="1">
                ${offering.hourlyRate}/hr
              </Text>
            </Box>
            <Button size="2" color={SEMANTIC_COLOR.primary} onClick={() => onSelect(offering)}>
              Select
            </Button>
          </Flex>
        ))}
      </Flex>
    );
  }

  if (offerings.length === 1) {
    return (
      <Flex direction="column" gap="3">
        <Text size="2" color="gray" highContrast>
          {serviceLabel(offerings[0])} — ${offerings[0].hourlyRate}/hr
        </Text>
        <Button size="2" color={SEMANTIC_COLOR.primary} onClick={() => onSelect(offerings[0])}>
          Continue
        </Button>
      </Flex>
    );
  }

  return null;
}

// --- Step: Schedule ---

export function ScheduleStep({
  scheduledDate,
  scheduledStartTime,
  scheduledEndTime,
  durationMinutes,
  onDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onBack,
  onNext,
}: {
  scheduledDate: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  durationMinutes: number | null;
  onDateChange: (v: string) => void;
  onStartTimeChange: (v: string) => void;
  onEndTimeChange: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const nextDisabled =
    !scheduledDate || !scheduledStartTime || !scheduledEndTime || (durationMinutes ?? 0) <= 0;

  return (
    <Box>
      <Heading as="h3" size="3" mb="3">
        When do you need the service?
      </Heading>
      <Flex direction="column" gap="4">
        <Box>
          <Text as="label" size="2" weight="bold" htmlFor="wizard-date" mb="2" style={{ display: "block" }}>
            Date
          </Text>
          <TextField.Root
            id="wizard-date"
            type="date"
            value={scheduledDate}
            onChange={(e) => onDateChange(e.target.value)}
            size="2"
            style={{ width: "100%" }}
          />
        </Box>
        <Flex gap="3" wrap="wrap">
          <Box style={{ flex: 1, minWidth: 120 }}>
            <Text as="label" size="2" weight="bold" htmlFor="wizard-start" mb="2" style={{ display: "block" }}>
              Start time
            </Text>
            <TextField.Root
              id="wizard-start"
              type="time"
              value={scheduledStartTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
              size="2"
              style={{ width: "100%" }}
            />
          </Box>
          <Box style={{ flex: 1, minWidth: 120 }}>
            <Text as="label" size="2" weight="bold" htmlFor="wizard-end" mb="2" style={{ display: "block" }}>
              End time
            </Text>
            <TextField.Root
              id="wizard-end"
              type="time"
              value={scheduledEndTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
              size="2"
              style={{ width: "100%" }}
            />
          </Box>
        </Flex>
        {scheduledStartTime && scheduledEndTime && durationMinutes !== null && durationMinutes <= 0 && (
          <Text size="2" color={SEMANTIC_COLOR.danger}>
            End time must be after start time.
          </Text>
        )}
      </Flex>
      <Flex gap="3" mt="5" justify="between">
        <Button variant="soft" color="gray" size="2" onClick={onBack}>
          Back
        </Button>
        <Button size="2" color={SEMANTIC_COLOR.primary} onClick={onNext} disabled={nextDisabled}>
          Next
        </Button>
      </Flex>
    </Box>
  );
}

// --- Step: Questions ---

export function QuestionsStep({
  currentQuestion,
  questionsLoading,
  answers,
  onAnswerChange,
  isLastQuestion,
  onBack,
  onNext,
}: {
  currentQuestion: BookingWizardQuestion | undefined;
  questionsLoading: boolean;
  answers: Record<string, string | number | boolean>;
  onAnswerChange: (questionId: string, value: string | number | boolean | undefined) => void;
  isLastQuestion: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <Box>
      {questionsLoading ? (
        <Skeleton width="100%" height="120px" />
      ) : currentQuestion ? (
        <Box>
          <Box mb="3">
            <Text as="label" size="2" weight="bold" htmlFor={`wizard-q-${currentQuestion.questionId}`} mb="1">
              {currentQuestion.question.label}
              {currentQuestion.isRequired && (
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1">
                  *
                </Text>
              )}
            </Text>
            {currentQuestion.question.helpText && (
              <Text size="1" color="gray" highContrast mt="1">
                {currentQuestion.question.helpText}
              </Text>
            )}
          </Box>
          <QuestionInput
            question={currentQuestion.question}
            value={answers[currentQuestion.questionId]}
            onChange={(value) => onAnswerChange(currentQuestion.questionId, value)}
            id={`wizard-q-${currentQuestion.questionId}`}
          />
        </Box>
      ) : null}
      <Flex gap="3" mt="4" justify="between">
        <Button variant="soft" color="gray" size="2" onClick={onBack}>
          Back
        </Button>
        <Button size="2" color={SEMANTIC_COLOR.primary} onClick={onNext}>
          {isLastQuestion ? "Review" : "Next"}
        </Button>
      </Flex>
    </Box>
  );
}

// --- Step: Summary ---

export function SummaryStep({
  offering,
  collectSchedule,
  scheduledDate,
  scheduledStartTime,
  scheduledEndTime,
  durationMinutes,
  orderedQuestions,
  answers,
  submitLoading,
  scheduleValid,
  onBack,
  onSubmit,
}: {
  offering: WelperProfileDialogOffering;
  collectSchedule: boolean;
  scheduledDate: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  durationMinutes: number | null;
  orderedQuestions: BookingWizardQuestion[];
  answers: Record<string, string | number | boolean>;
  submitLoading: boolean;
  scheduleValid: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <Box>
      <Heading as="h3" size="3" mb="3">
        Summary
      </Heading>
      <Flex direction="column" gap="4">
        <Box>
          <Text size="1" color="gray" highContrast>Service</Text>
          <Text size="3" weight="bold">{serviceLabel(offering)}</Text>
          <Text size="2" color="gray" highContrast>${offering.hourlyRate}/hr</Text>
        </Box>
        {collectSchedule && scheduledDate && scheduledStartTime && scheduledEndTime && (
          <Box>
            <Text size="1" color="gray" highContrast mb="2">Schedule</Text>
            <Text size="2">
              {scheduledDate} · {scheduledStartTime.slice(0, 5)} – {scheduledEndTime.slice(0, 5)}
              {durationMinutes != null && durationMinutes > 0 && ` (${durationMinutes} min)`}
            </Text>
          </Box>
        )}
        {orderedQuestions.length > 0 && (
          <Box>
            <Text size="1" color="gray" highContrast mb="2">Your answers</Text>
            <Flex direction="column" gap="2">
              {orderedQuestions.map((sq) => {
                const val = answers[sq.questionId];
                const display =
                  val === undefined || val === null
                    ? "—"
                    : typeof val === "boolean"
                      ? val ? "Yes" : "No"
                      : String(val);
                return (
                  <Flex key={sq.id} justify="between" gap="2">
                    <Text size="2" color="gray" highContrast>{sq.question.label}</Text>
                    <Text size="2">{display}</Text>
                  </Flex>
                );
              })}
            </Flex>
          </Box>
        )}
      </Flex>
      <Flex gap="3" mt="5" justify="between">
        <Button variant="soft" color="gray" size="2" onClick={onBack}>Back</Button>
        <Button
          size="2"
          color={SEMANTIC_COLOR.primary}
          onClick={onSubmit}
          disabled={submitLoading || (collectSchedule && !scheduleValid)}
        >
          {submitLoading ? "Sending…" : "Confirm and send request"}
        </Button>
      </Flex>
    </Box>
  );
}
