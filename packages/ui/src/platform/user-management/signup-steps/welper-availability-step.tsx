"use client";

import { useState } from "react";
import { Box } from "@welpco/ui/box";
import { Button } from "@welpco/ui/button";
import { Callout } from "@welpco/ui/callout";
import { Card } from "@welpco/ui/card";
import { Checkbox } from "@welpco/ui/checkbox";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@welpco/ui/select";
import { Text } from "@welpco/ui/text";
import { TextField } from "@welpco/ui/text-field";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import type { SignupStateLite } from "./types";

/**
 * Day 15 — Phase 2 Dispatch B. Welper-only step 6 of the unified signup wizard.
 *
 * Two paths (XOR — the BFF DTO enforces this server-side too):
 *  1. weekly slots: at least one DayOfWeek + start/end window.
 *  2. ad-hoc-only toggle: the welper takes booking requests but doesn't
 *     publish recurring hours. Customers see "by request only" in search.
 *
 * The platform's `<TimeSlotAvailability>` primitive uses numeric weekday
 * values (0–6); this step needs string DayOfWeek enum values to match the BFF
 * DTO. Building the simpler add/remove UI inline keeps the wire shape clean
 * and avoids a numeric-to-string remap that hides off-by-ones.
 */

// Wire values match the BFF `DayOfWeek` enum's STRING VALUES (Pascal case),
// not the enum KEYS (which are uppercase). See
// `apps/bff/src/domains/profile-management/entities/day-of-week.enum.ts`.
const DAYS_OF_WEEK: ReadonlyArray<{ value: string; label: string }> = [
  { value: "Monday", label: "Monday" },
  { value: "Tuesday", label: "Tuesday" },
  { value: "Wednesday", label: "Wednesday" },
  { value: "Thursday", label: "Thursday" },
  { value: "Friday", label: "Friday" },
  { value: "Saturday", label: "Saturday" },
  { value: "Sunday", label: "Sunday" },
] as const;

export interface WelperAvailabilityWeeklySlot {
  dayOfWeek: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

export interface WelperAvailabilityStepValues {
  weeklySlots: WelperAvailabilityWeeklySlot[];
  acceptsAdHocOnly: boolean;
}

export interface WelperAvailabilityStepProps {
  state: SignupStateLite;
  loading?: boolean;
  error?: string | null;
  onSubmit: (values: WelperAvailabilityStepValues) => void | Promise<void>;
  onBack?: () => void;
}

export function WelperAvailabilityStep({
  state,
  loading,
  error,
  onSubmit,
  onBack,
}: WelperAvailabilityStepProps) {
  const filled = state.filledData.welperAvailability as
    | Partial<WelperAvailabilityStepValues>
    | undefined;

  const [adHocOnly, setAdHocOnly] = useState(
    Boolean(filled?.acceptsAdHocOnly),
  );
  const [slots, setSlots] = useState<WelperAvailabilityWeeklySlot[]>(
    filled?.weeklySlots ?? [],
  );
  const [draftDay, setDraftDay] = useState<string>("Monday");
  const [draftStart, setDraftStart] = useState("09:00");
  const [draftEnd, setDraftEnd] = useState("17:00");
  const [submitted, setSubmitted] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);

  const addSlot = () => {
    if (draftEnd <= draftStart) {
      setSlotError("End time must be after start time");
      return;
    }
    if (slots.length >= 50) {
      setSlotError("That's the cap — 50 slots max");
      return;
    }
    const dup = slots.some(
      (s) =>
        s.dayOfWeek === draftDay &&
        s.startTime === draftStart &&
        s.endTime === draftEnd,
    );
    if (dup) {
      setSlotError("That slot is already in your list");
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
    if (!adHocOnly && slots.length === 0) {
      setSlotError("Add at least one time slot, or pick ad-hoc only below");
      return;
    }
    if (adHocOnly) {
      await onSubmit({ weeklySlots: [], acceptsAdHocOnly: true });
    } else {
      await onSubmit({ weeklySlots: slots, acceptsAdHocOnly: false });
    }
  };

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "640px", minWidth: 0 }}
    >
      <Flex direction="column" gap="5" style={{ minWidth: 0 }}>
        <Box>
          <Heading as="h1" size="6" trim="start" mb={FORM_SPACING.titleGap}>
            When are you available?
          </Heading>
          <Text size="2" color="gray">
            Add the times you can normally take work. Customers see these
            ranges in search and at booking time. You can change them anytime.
          </Text>
        </Box>

        {error && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Box mb={FORM_SPACING.fieldGap} aria-disabled={adHocOnly}>
            <Text
              as="label"
              size="2"
              weight="bold"
              mb={FORM_SPACING.labelGap}
            >
              Add a weekly slot
            </Text>
            <Flex direction={{ initial: "column", sm: "row" }} gap="2">
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Select
                  size="2"
                  value={draftDay}
                  disabled={loading || adHocOnly}
                  onValueChange={setDraftDay}
                >
                  <SelectTrigger
                    aria-label="Day"
                    placeholder="Day"
                    style={{ width: "100%" }}
                  />
                  <SelectContent>
                    {DAYS_OF_WEEK.map((d) => (
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
                  disabled={loading || adHocOnly}
                  value={draftStart}
                  onChange={(e) => setDraftStart(e.target.value)}
                />
              </Box>
              <Box style={{ flex: 1, minWidth: 0 }}>
                <TextField.Root
                  type="time"
                  size="2"
                  aria-label="End time"
                  disabled={loading || adHocOnly}
                  value={draftEnd}
                  onChange={(e) => setDraftEnd(e.target.value)}
                />
              </Box>
              <Button
                type="button"
                size="2"
                variant="soft"
                color={SEMANTIC_COLOR.primary}
                disabled={loading || adHocOnly}
                onClick={addSlot}
              >
                Add slot
              </Button>
            </Flex>
            {slotError && (
              <Text
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
              <Text size="2" weight="bold" mb={FORM_SPACING.labelGap}>
                Your weekly hours
              </Text>
              <Flex direction="column" gap="2">
                {slots.map((slot, index) => {
                  const dayLabel =
                    DAYS_OF_WEEK.find((d) => d.value === slot.dayOfWeek)?.label ??
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
                          Remove
                        </Button>
                      </Flex>
                    </Card>
                  );
                })}
              </Flex>
            </Box>
          )}

          <Box mb={FORM_SPACING.fieldGap}>
            <Flex align="start" gap="3">
              <Checkbox
                id="signup-availability-adhoc"
                checked={adHocOnly}
                onCheckedChange={(c) => setAdHocOnly(Boolean(c))}
                disabled={loading}
                size="2"
              />
              <Box>
                <Text as="label" size="2" weight="bold" htmlFor="signup-availability-adhoc">
                  I take bookings by request only
                </Text>
                <Text size="1" color="gray">
                  Customers won&apos;t see recurring hours — they&apos;ll send
                  you a request and you can accept or decline each one. Pick
                  this if your schedule changes week to week.
                </Text>
              </Box>
            </Flex>
          </Box>

          {submitted && !adHocOnly && slots.length === 0 && (
            <Text
              role="alert"
              size="1"
              color={SEMANTIC_COLOR.danger}
              mt={FORM_SPACING.helperGap}
            >
              Add at least one slot, or check the ad-hoc-only box.
            </Text>
          )}

          <Flex
            direction={{ initial: "column", sm: "row-reverse" }}
            gap="3"
            mt={FORM_SPACING.submitGap}
          >
            <Button
              type="submit"
              size="3"
              color={SEMANTIC_COLOR.primary}
              disabled={loading}
              style={{ width: "100%" }}
            >
              {loading ? "Saving..." : "Continue"}
            </Button>
            {onBack && (
              <Button
                type="button"
                size="3"
                variant="soft"
                color="gray"
                disabled={loading}
                onClick={onBack}
                style={{ width: "100%" }}
              >
                Back
              </Button>
            )}
          </Flex>
        </form>
      </Flex>
    </Card>
  );
}
