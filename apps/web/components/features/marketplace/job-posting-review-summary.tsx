"use client";

import { useMemo } from "react";
import { Box } from "@welpco/ui/box";
import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Separator } from "@welpco/ui/separator";
import { Skeleton } from "@welpco/ui/skeleton";
import { Text } from "@welpco/ui/text";
import { Callout } from "@welpco/ui/callout";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useServiceQuestions } from "@/lib/hooks/use-bookings";
import { buildAnswerDisplayRows } from "@/lib/services/service-questions-utils";

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatScheduleDate(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export interface JobPostingReviewSummaryProps {
  title: string;
  description?: string;
  categoryLabel?: string | null;
  subcategoryLabel?: string | null;
  scheduledDate: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  durationMinutes: number;
  locationCity?: string | null;
  locationRegion?: string | null;
  locationAddress?: string | null;
  showFullAddress?: boolean;
  answers: Record<string, string | number | boolean>;
  serviceQuestionCategoryId: string;
  /** Render without the surrounding Card chrome (e.g. inside a dialog). */
  embedded?: boolean;
}

export function JobPostingReviewSummary({
  title,
  description,
  categoryLabel,
  subcategoryLabel,
  scheduledDate,
  scheduledStartTime,
  scheduledEndTime,
  durationMinutes,
  locationCity,
  locationRegion,
  locationAddress,
  showFullAddress = false,
  answers,
  serviceQuestionCategoryId,
  embedded = false,
}: JobPostingReviewSummaryProps) {
  const {
    data: serviceQuestions,
    isLoading: questionsLoading,
    isError: questionsError,
  } = useServiceQuestions(serviceQuestionCategoryId);

  const answerRows = useMemo(
    () => buildAnswerDisplayRows(serviceQuestions ?? [], answers),
    [answers, serviceQuestions],
  );

  const serviceLabel = subcategoryLabel ?? categoryLabel;
  const locationLine = showFullAddress && locationAddress
    ? locationAddress
    : [locationCity, locationRegion].filter(Boolean).join(", ");

  const content = (
      <Flex direction="column" gap={FORM_SPACING.sectionGap}>
        <Box>
          <Heading size="5" trim="start" mb={FORM_SPACING.titleGap}>
            Job details
          </Heading>
          <Text size="3" weight="bold" style={{ display: "block" }}>
            {title}
          </Text>
          {serviceLabel && (
            <Text size="2" color="gray" highContrast mt="1">
              {serviceLabel}
            </Text>
          )}
          {description && (
            <Text as="p" size="2" mt="2">
              {description}
            </Text>
          )}
        </Box>

        <Separator size="4" />

        <Box>
          <Text size="2" weight="bold" mb={FORM_SPACING.labelGap}>
            Schedule
          </Text>
          <Text size="2" style={{ display: "block" }}>
            {formatScheduleDate(scheduledDate)}
          </Text>
          <Text size="2" color="gray" highContrast>
            {`${scheduledStartTime} – ${scheduledEndTime} (${formatDuration(durationMinutes)})`}
          </Text>
        </Box>

        {locationLine && (
          <Box>
            <Text size="2" weight="bold" mb={FORM_SPACING.labelGap}>
              Location
            </Text>
            <Text size="2">{locationLine}</Text>
          </Box>
        )}

        <Separator size="4" />

        <Box>
          <Heading size="4" trim="start" mb={FORM_SPACING.titleGap}>
            Service questions
          </Heading>
          {questionsLoading && (
            <Flex direction="column" gap="2">
              <Skeleton width="100%" height="20px" />
              <Skeleton width="100%" height="20px" />
            </Flex>
          )}
          {questionsError && (
            <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
              <Callout.Text>Could not load service questions.</Callout.Text>
            </Callout.Root>
          )}
          {!questionsLoading && !questionsError && answerRows.length === 0 && (
            <Text size="2" color="gray">
              No additional service details were provided.
            </Text>
          )}
          {!questionsLoading && !questionsError && answerRows.length > 0 && (
            <Flex direction="column" gap="3">
              {answerRows.map((row) => (
                <Box key={row.key}>
                  <Text size="2" weight="bold" mb="1">
                    {row.label}
                  </Text>
                  <Text size="2" color="gray" highContrast>
                    {row.displayValue}
                  </Text>
                </Box>
              ))}
            </Flex>
          )}
        </Box>
      </Flex>
  );

  if (embedded) return content;

  return (
    <Card size="3" variant="surface">
      {content}
    </Card>
  );
}
