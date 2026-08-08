"use client";

import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { TextField } from "@welpco/ui/text-field";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Callout } from "@welpco/ui/callout";
import { Checkbox } from "@welpco/ui/checkbox";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";

/** "HH:mm" string compare works for our slot ranges (always same calendar day). */
function isInvertedSlot(startTime: string, endTime: string): boolean {
  return endTime <= startTime;
}

export interface TimeSlot {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
}

export interface AvailabilitySchedule {
  timeSlots: TimeSlot[];
  recurringPattern: "daily" | "weekly" | "monthly";
  effectiveStartDate?: Date;
  effectiveEndDate?: Date;
}

export type TimeSlotAvailabilityLabels = {
  regularTitle: string;
  regularDescription: string;
  addSlotsTitle: string;
  addSlotsHint: string;
  startTime: string;
  endTime: string;
  addSlotsButton: string;
  currentSlotsTitle: string;
  to: string;
  removeSlotAria: string;
  emptyCallout: string;
  endAfterStart: string;
  /** Index 0 = Sunday … 6 = Saturday */
  dayNames: Record<number, string>;
};

export interface TimeSlotAvailabilityProps {
  defaultSchedule?: AvailabilitySchedule;
  loading?: boolean;
  onChange?: (schedule: AvailabilitySchedule) => void;
  labels?: TimeSlotAvailabilityLabels;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const emptySchedule: AvailabilitySchedule = {
  timeSlots: [],
  recurringPattern: "weekly",
};

export function TimeSlotAvailability({
  defaultSchedule,
  loading,
  onChange,
  labels,
}: TimeSlotAvailabilityProps) {
  const endAfterStartMsg = labels?.endAfterStart ?? "End time must be after start time.";
  const [schedule, setSchedule] = useState<AvailabilitySchedule>(
    defaultSchedule || emptySchedule
  );

  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  // Controlled state for the new-slot Start/End inputs (was DOM lookup via getElementById,
  // which races when the component is remounted or rendered in two places).
  const [newStartTime, setNewStartTime] = useState("09:00");
  const [newEndTime, setNewEndTime] = useState("17:00");
  const [addSlotError, setAddSlotError] = useState<string | null>(null);
  // Track per-slot validation errors so users see why their edit is rejected
  // instead of silently saving an inverted slot that booking matching ignores.
  const [slotErrors, setSlotErrors] = useState<Record<number, string>>({});

  // Sync internal state when defaultSchedule changes (e.g. after load or refetch)
  const defaultSlotsKey = defaultSchedule
    ? JSON.stringify(defaultSchedule.timeSlots?.map((s) => ({ d: s.dayOfWeek, s: s.startTime, e: s.endTime })))
    : "";
  useEffect(() => {
    const next = defaultSchedule || emptySchedule;
    const nextSlots = next.timeSlots ?? [];
    setSchedule((prev) => {
      if (prev.timeSlots.length === nextSlots.length &&
          prev.timeSlots.every((s, i) => nextSlots[i] && s.dayOfWeek === nextSlots[i].dayOfWeek && s.startTime === nextSlots[i].startTime && s.endTime === nextSlots[i].endTime)) {
        return prev;
      }
      return { ...next, timeSlots: [...nextSlots] };
    });
    setSlotErrors({});
  }, [defaultSlotsKey]);

  const handleAddSlots = () => {
    if (selectedDays.length === 0) return;
    if (isInvertedSlot(newStartTime, newEndTime)) {
      setAddSlotError(endAfterStartMsg);
      return;
    }
    setAddSlotError(null);

    const newSlots: TimeSlot[] = selectedDays.map((day) => ({
      dayOfWeek: day,
      startTime: newStartTime,
      endTime: newEndTime,
    }));

    const updatedSchedule: AvailabilitySchedule = {
      ...schedule,
      timeSlots: [...schedule.timeSlots, ...newSlots],
    };

    setSchedule(updatedSchedule);
    onChange?.(updatedSchedule);
    setSelectedDays([]);
    setNewStartTime("09:00");
    setNewEndTime("17:00");
  };

  const handleRemoveTimeSlot = (index: number) => {
    const updatedSlots = schedule.timeSlots.filter((_, i) => i !== index);
    const updatedSchedule: AvailabilitySchedule = {
      ...schedule,
      timeSlots: updatedSlots,
    };
    setSchedule(updatedSchedule);
    onChange?.(updatedSchedule);
    // Re-key the error map after a removal so errors don't carry to the wrong slot.
    setSlotErrors((prev) => {
      const next: Record<number, string> = {};
      for (const [k, v] of Object.entries(prev)) {
        const i = Number(k);
        if (i < index) next[i] = v;
        else if (i > index) next[i - 1] = v;
      }
      return next;
    });
  };

  const handleUpdateTimeSlot = (index: number, field: "startTime" | "endTime", value: string) => {
    const updatedSlots = [...schedule.timeSlots];
    const candidate = { ...updatedSlots[index], [field]: value };

    // Reflect the typed value visually so the input stays usable, but only
    // commit + emit if the slot is valid. Inverted slots never reach the BFF
    // (booking matcher in availability.service.ts:isSlotAvailable compares strings,
    // so end <= start would silently mean "never available").
    updatedSlots[index] = candidate;

    if (isInvertedSlot(candidate.startTime, candidate.endTime)) {
      setSlotErrors((prev) => ({ ...prev, [index]: endAfterStartMsg }));
      // Update local view (so the user sees what they typed) but do NOT emit.
      setSchedule({ ...schedule, timeSlots: updatedSlots });
      return;
    }

    setSlotErrors((prev) => {
      if (!(index in prev)) return prev;
      const next = { ...prev };
      delete next[index];
      return next;
    });

    const updatedSchedule: AvailabilitySchedule = {
      ...schedule,
      timeSlots: updatedSlots,
    };
    setSchedule(updatedSchedule);
    onChange?.(updatedSchedule);
  };

  const toggleDaySelection = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const getDayLabel = (dayOfWeek: number) => {
    return labels?.dayNames[dayOfWeek] ?? DAYS_OF_WEEK.find((d) => d.value === dayOfWeek)?.label ?? "Unknown";
  };

  return (
    <Card
      size={{ initial: "2", sm: "4" }}
      variant="surface"
      style={{ width: "100%", maxWidth: "100%", minWidth: 0 }}
    >
      <Flex direction="column" gap="3" style={{ minWidth: 0 }}>
        <Box>
          <Heading size="4" mb="1">
            {labels?.regularTitle ?? "Regular schedule"}
          </Heading>
          <Text size="2" color="gray" highContrast>
            {labels?.regularDescription ??
              "Define when you're usually available (e.g. weekdays 9–5). This schedule repeats every week."}
          </Text>
        </Box>

        <Box mb="3">
          <Heading as="h3" size="3" mb="3">
            {labels?.addSlotsTitle ?? "Add time slots"}
          </Heading>
          <Flex direction="column" gap="3">
            <Text size="2" color="gray" highContrast>
              {labels?.addSlotsHint ?? "Select which days and times you're available:"}
            </Text>

            <Flex gap="2" wrap="wrap">
              {DAYS_OF_WEEK.map((day) => (
                <Flex key={day.value} align="center" gap="3">
                  <Checkbox
                    checked={selectedDays.includes(day.value)}
                    onCheckedChange={() => toggleDaySelection(day.value)}
                    disabled={loading}
                    id={`day-${day.value}`}
                    size="2"
                  />
                  <Text as="label" size="2" htmlFor={`day-${day.value}`}>
                    {labels?.dayNames[day.value] ?? day.label}
                  </Text>
                </Flex>
              ))}
            </Flex>

            {selectedDays.length > 0 && (
              <>
                <Flex
                  gap="3"
                  align={{ initial: "stretch", sm: "end" }}
                  direction={{ initial: "column", sm: "row" }}
                >
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text as="label" size="2" weight="medium" htmlFor="start-time-input" mb={FORM_SPACING.labelGap}>
                      {labels?.startTime ?? "Start time"}
                    </Text>
                    <TextField.Root
                      type="time"
                      size="2"
                      disabled={loading}
                      value={newStartTime}
                      onChange={(e) => {
                        setNewStartTime(e.target.value);
                        if (addSlotError) setAddSlotError(null);
                      }}
                      id="start-time-input"
                      aria-invalid={addSlotError ? "true" : undefined}
                      aria-describedby={addSlotError ? "add-slot-error" : undefined}
                    />
                  </Box>
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text as="label" size="2" weight="medium" htmlFor="end-time-input" mb={FORM_SPACING.labelGap}>
                      {labels?.endTime ?? "End time"}
                    </Text>
                    <TextField.Root
                      type="time"
                      size="2"
                      disabled={loading}
                      value={newEndTime}
                      onChange={(e) => {
                        setNewEndTime(e.target.value);
                        if (addSlotError) setAddSlotError(null);
                      }}
                      id="end-time-input"
                      aria-invalid={addSlotError ? "true" : undefined}
                      aria-describedby={addSlotError ? "add-slot-error" : undefined}
                    />
                  </Box>
                  <Button
                    type="button"
                    size="2"
                    color={SEMANTIC_COLOR.primary}
                    onClick={handleAddSlots}
                    disabled={loading}
                  >
                    <Flex align="center" gap="2">
                      <Plus style={{ width: "16px", height: "16px" }} />
                      {labels?.addSlotsButton ?? "Add slots"}
                    </Flex>
                  </Button>
                </Flex>
                {addSlotError && (
                  <Text id="add-slot-error" size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                    {addSlotError}
                  </Text>
                )}
              </>
            )}
          </Flex>
        </Box>

        {schedule.timeSlots.length > 0 && (
          <Box mb="3">
            <Heading as="h3" size="3" mb="3">
              {labels?.currentSlotsTitle ?? "Current time slots"}
            </Heading>
            <Flex direction="column" gap="2">
              {schedule.timeSlots.map((slot, index) => {
                const slotErr = slotErrors[index];
                const errId = slotErr ? `slot-${index}-error` : undefined;
                return (
                  <Card key={index} size="2" variant="surface">
                    <Flex direction="column" gap="2">
                      <Flex
                        align={{ initial: "stretch", sm: "center" }}
                        direction={{ initial: "column", sm: "row" }}
                        gap="3"
                        style={{ minWidth: 0 }}
                      >
                        <Text
                          size="2"
                          weight="bold"
                          style={{ minWidth: "100px", flexShrink: 0 }}
                        >
                          {getDayLabel(slot.dayOfWeek)}
                        </Text>
                        <Flex
                          gap="2"
                          align="center"
                          style={{ flex: "1 1 auto", minWidth: 0, width: "100%" }}
                        >
                          <Flex
                            gap="2"
                            align="center"
                            style={{ flex: "1 1 auto", minWidth: 0 }}
                          >
                            <Box style={{ flex: "1 1 120px", minWidth: 0 }}>
                              <TextField.Root
                                type="time"
                                size="2"
                                value={slot.startTime}
                                onChange={(e) =>
                                  handleUpdateTimeSlot(index, "startTime", e.target.value)
                                }
                                disabled={loading}
                                aria-label={`${getDayLabel(slot.dayOfWeek)} start time`}
                                aria-invalid={slotErr ? "true" : undefined}
                                aria-describedby={errId}
                                style={{ width: "100%", minWidth: 0 }}
                              />
                            </Box>
                            <Text size="2" color="gray" highContrast style={{ flexShrink: 0 }}>
                              {labels?.to ?? "to"}
                            </Text>
                            <Box style={{ flex: "1 1 120px", minWidth: 0 }}>
                              <TextField.Root
                                type="time"
                                size="2"
                                value={slot.endTime}
                                onChange={(e) =>
                                  handleUpdateTimeSlot(index, "endTime", e.target.value)
                                }
                                disabled={loading}
                                aria-label={`${getDayLabel(slot.dayOfWeek)} end time`}
                                aria-invalid={slotErr ? "true" : undefined}
                                aria-describedby={errId}
                                style={{ width: "100%", minWidth: 0 }}
                              />
                            </Box>
                          </Flex>
                          <Button
                            type="button"
                            variant="ghost"
                            color={SEMANTIC_COLOR.danger}
                            size="2"
                            onClick={() => handleRemoveTimeSlot(index)}
                            disabled={loading}
                            aria-label={labels?.removeSlotAria ?? "Remove time slot"}
                          >
                            <X aria-hidden="true" style={{ width: "16px", height: "16px" }} />
                          </Button>
                        </Flex>
                      </Flex>
                      {slotErr && (
                        <Text id={errId} size="1" role="alert" color={SEMANTIC_COLOR.danger}>
                          {slotErr}
                        </Text>
                      )}
                    </Flex>
                  </Card>
                );
              })}
            </Flex>
          </Box>
        )}

        {schedule.timeSlots.length === 0 && (
          <Callout.Root color="gray" variant="surface">
            <Callout.Text>
              {labels?.emptyCallout ??
                "No time slots defined. Add time slots to set your availability."}
            </Callout.Text>
          </Callout.Root>
        )}
      </Flex>
    </Card>
  );
}
