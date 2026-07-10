"use client";

import { useMemo, useState } from "react";
import { Box } from "@welpco/ui/box";
import { Button } from "@welpco/ui/button";
import { Callout } from "@welpco/ui/callout";
import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@welpco/ui/select";
import { Spinner } from "@welpco/ui/spinner";
import { Text } from "@welpco/ui/text";
import { TextField } from "@welpco/ui/text-field";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import {
  DEFAULT_WELPER_AVAILABILITY_LABELS,
  type WelperAvailabilityStepLabels,
} from "./labels";
import { SIGNUP_STEP_CARD_STYLE, signupStepNavButtonStyle, type SignupStateLite } from "./types";

/**
 * Welper-only signup step: weekly availability slots (at least one required).
 */

const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export interface WelperAvailabilityWeeklySlot {
  dayOfWeek: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

export interface WelperAvailabilityStepValues {
  weeklySlots: WelperAvailabilityWeeklySlot[];
}

export interface WelperAvailabilityStepProps {
  state: SignupStateLite;
  loading?: boolean;
  error?: string | null;
  labels?: WelperAvailabilityStepLabels;
  onSubmit: (values: WelperAvailabilityStepValues) => void | Promise<void>;
  onBack?: () => void;
}

export function WelperAvailabilityStep({
  state,
  loading,
  error,
  labels: labelsProp,
  onSubmit,
  onBack,
}: WelperAvailabilityStepProps) {
  const labels = labelsProp ?? DEFAULT_WELPER_AVAILABILITY_LABELS;

  const daysOfWeek = useMemo(
    () =>
      DAY_KEYS.map((key) => ({
        value: DEFAULT_WELPER_AVAILABILITY_LABELS.days[key],
        label: labels.days[key],
      })),
    [labels],
  );

  const filled = state.filledData.welperAvailability as
    | Partial<WelperAvailabilityStepValues & { acceptsAdHocOnly?: boolean }>
    | undefined;

  const [slots, setSlots] = useState<WelperAvailabilityWeeklySlot[]>(
    filled?.weeklySlots ?? [],
  );
  const [draftDay, setDraftDay] = useState<string>(
    DEFAULT_WELPER_AVAILABILITY_LABELS.days.monday,
  );
  const [draftStart, setDraftStart] = useState("09:00");
  const [draftEnd, setDraftEnd] = useState("17:00");
  const [submitted, setSubmitted] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);

  const addSlot = () => {
    if (draftEnd <= draftStart) {
      setSlotError(labels.validation.endAfterStart);
      return;
    }
    if (slots.length >= 50) {
      setSlotError(labels.validation.maxSlots);
      return;
    }
    const dup = slots.some(
      (s) =>
        s.dayOfWeek === draftDay &&
        s.startTime === draftStart &&
        s.endTime === draftEnd,
    );
    if (dup) {
      setSlotError(labels.validation.duplicateSlot);
      return;
    }
    setSlots([
      ...slots,
      { dayOfWeek: draftDay, startTime: draftStart, endTime: draftEnd },
    ]);
    setSlotError(null);
  };

  const removeSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (slots.length === 0) {
      setSlotError(labels.validation.addAtLeastOne);
      return;
    }
    await onSubmit({ weeklySlots: slots });
  };

  const navButtonStyle = signupStepNavButtonStyle(Boolean(onBack));

  return (
    <Card
      size="4"
      variant="surface"
      style={SIGNUP_STEP_CARD_STYLE}
    >
      <Flex direction="column" gap="5" style={{ minWidth: 0 }}>
        <Box>
          <Heading as="h1" size="6" trim="start" mb={FORM_SPACING.titleGap}>
            {labels.title}
          </Heading>
          <Text size="2" color="gray">
            {labels.description}
          </Text>
        </Box>

        {error && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Box mb={FORM_SPACING.fieldGap}>
            <Text
              as="label"
              id="availability-add-slot-label"
              size="2"
              weight="medium"
              mb={FORM_SPACING.labelGap}
             style={{ display: "block" }}>
              {labels.addSlotLabel}
            </Text>
            <Flex direction={{ initial: "column", sm: "row" }} gap="2">
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Select
                  size="2"
                  value={draftDay}
                  disabled={loading}
                  onValueChange={setDraftDay}
                >
                  <SelectTrigger
                    aria-labelledby="availability-add-slot-label"
                    placeholder={labels.dayPlaceholder}
                    style={{ width: "100%" }}
                  />
                  <SelectContent>
                    {daysOfWeek.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Box>
              <Box style={{ flex: 1, minWidth: 0 }}>
                <TextField.Root
                  type="time"
                  size="2"
                  aria-label="Start time"
                  aria-invalid={slotError ? true : undefined}
                  aria-describedby={slotError ? "availability-slot-error" : undefined}
                  disabled={loading}
                  value={draftStart}
                  onChange={(e) => setDraftStart(e.target.value)}
                />
              </Box>
              <Box style={{ flex: 1, minWidth: 0 }}>
                <TextField.Root
                  type="time"
                  size="2"
                  aria-label="End time"
                  aria-invalid={slotError ? true : undefined}
                  aria-describedby={slotError ? "availability-slot-error" : undefined}
                  disabled={loading}
                  value={draftEnd}
                  onChange={(e) => setDraftEnd(e.target.value)}
                />
              </Box>
              <Button
                type="button"
                size="2"
                variant="soft"
                color={SEMANTIC_COLOR.primary}
                disabled={loading}
                onClick={addSlot}
              >
                {labels.addSlotButton}
              </Button>
            </Flex>
            {slotError && (
              <Text
                id="availability-slot-error"
                role="alert"
                size="1"
                color={SEMANTIC_COLOR.danger}
                mt={FORM_SPACING.helperGap}
              >
                {slotError}
              </Text>
            )}
          </Box>

          {slots.length > 0 && (
            <Box mb={FORM_SPACING.fieldGap}>
              <Text size="2" weight="medium" mb={FORM_SPACING.labelGap}>
                {labels.yourWeeklyHours}
              </Text>
              <Flex direction="column" gap="2">
                {slots.map((slot, index) => {
                  const dayLabel =
                    daysOfWeek.find((d) => d.value === slot.dayOfWeek)?.label ??
                    slot.dayOfWeek;
                  return (
                    <Card
                      key={`${slot.dayOfWeek}-${slot.startTime}-${slot.endTime}-${index}`}
                      size="1"
                      variant="surface"
                    >
                      <Flex justify="between" align="center" gap="3">
                        <Text size="2">
                          {dayLabel} · {slot.startTime}–{slot.endTime}
                        </Text>
                        <Button
                          type="button"
                          variant="ghost"
                          color="gray"
                          size="1"
                          onClick={() => removeSlot(index)}
                          disabled={loading}
                        >
                          {labels.remove}
                        </Button>
                      </Flex>
                    </Card>
                  );
                })}
              </Flex>
            </Box>
          )}

          {submitted && slots.length === 0 && (
            <Text
              role="alert"
              size="1"
              color={SEMANTIC_COLOR.danger}
              mb={FORM_SPACING.fieldGap}
            >
              {labels.validation.addAtLeastOne}
            </Text>
          )}

          <Flex
            direction={{ initial: "column", sm: "row-reverse" }}
            gap="3"
            mt={FORM_SPACING.submitGap}
            style={{ width: "100%" }}
          >
            <Button
              type="submit"
              size="3"
              color={SEMANTIC_COLOR.primary}
              disabled={loading}
              style={navButtonStyle}
            >
              {loading ? <Spinner /> : labels.continue}
            </Button>
            {onBack && (
              <Button
                type="button"
                size="3"
                variant="soft"
                color="gray"
                disabled={loading}
                onClick={onBack}
                style={navButtonStyle}
              >
                {labels.back}
              </Button>
            )}
          </Flex>
        </form>
      </Flex>
    </Card>
  );
}
