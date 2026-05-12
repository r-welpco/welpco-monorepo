"use client";

import { Card } from "@welpco/ui/card";
import { IconButton } from "@welpco/ui/icon-button";
import { Flex } from "@welpco/ui/flex";
import { Grid } from "@welpco/ui/grid";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Box } from "@welpco/ui/box";
import { Tooltip } from "@welpco/ui/tooltip";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import type { AvailabilityException } from "./availability-exceptions";
import type { AvailabilityStatus } from "./availability-status-manager";

export interface DateAvailability {
  date: Date;
  status: AvailabilityStatus;
  hasTimeSlots?: boolean;
  isException?: boolean;
  exceptionReason?: string;
}

export interface AvailabilityCalendarProps {
  month?: Date;
  selectedDates?: Date[];
  dateAvailabilities?: DateAvailability[];
  exceptions?: AvailabilityException[];
  onMonthChange?: (next: Date) => void;
  onToggleDate?: (date: Date) => void;
  onDateClick?: (date: Date) => void;
  showTimeSlots?: boolean;
  effectiveDateRange?: {
    start?: Date;
    end?: Date;
  };
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const STATUS_LABELS: Record<AvailabilityStatus, string> = {
  available: "Available",
  busy: "Busy",
  unavailable: "Unavailable",
};

const STATUS_VAR: Record<AvailabilityStatus, string> = {
  available: "var(--green-9)",
  busy: "var(--gray-9)",
  unavailable: "var(--red-9)",
};

/**
 * Welper availability calendar. Click a date to toggle it; exceptions are
 * shown with a yellow ring and their reason is accessible via tooltip.
 * Cells are semantic buttons with descriptive aria-labels; mobile collapses
 * badges into a status dot to keep the 7-column grid readable.
 */
export function AvailabilityCalendar({
  month = new Date(),
  selectedDates = [],
  dateAvailabilities = [],
  exceptions = [],
  onMonthChange,
  onToggleDate,
  onDateClick,
  showTimeSlots = false,
  effectiveDateRange,
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(month);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const handleMonthChange = (delta: number) => {
    const next = addMonths(currentMonth, delta);
    setCurrentMonth(next);
    onMonthChange?.(next);
  };

  const isSelected = (day: Date) =>
    selectedDates.some((selected) => isSameDay(selected, day));

  const getDateAvailability = (day: Date): DateAvailability | undefined =>
    dateAvailabilities.find((da) => isSameDay(da.date, day));

  const getException = (day: Date): AvailabilityException | undefined =>
    exceptions.find((ex) => isSameDay(ex.date, day));

  const isInEffectiveRange = (day: Date): boolean => {
    if (!effectiveDateRange) return true;
    const { start, end } = effectiveDateRange;
    if (start && day < start) return false;
    if (end && day > end) return false;
    return true;
  };

  const getDateStatus = (day: Date): {
    status: AvailabilityStatus;
    isException: boolean;
    hasTimeSlots: boolean;
  } => {
    const exception = getException(day);
    if (exception) {
      return {
        status: exception.available ? "available" : "unavailable",
        isException: true,
        hasTimeSlots: false,
      };
    }
    const availability = getDateAvailability(day);
    if (availability) {
      return {
        status: availability.status,
        isException: availability.isException ?? false,
        hasTimeSlots: availability.hasTimeSlots ?? false,
      };
    }
    return { status: "unavailable", isException: false, hasTimeSlots: false };
  };

  const handleDateClick = (day: Date) => {
    if (onDateClick) onDateClick(day);
    else if (onToggleDate) onToggleDate(day);
  };

  const hasAnyException = exceptions.length > 0;

  return (
    <Card
      size="3"
      variant="surface"
      style={{ width: "100%", maxWidth: "800px", minWidth: 0 }}
    >
      <Flex direction="column" gap="3">
        {/* Header: month + nav */}
        <Flex justify="between" align="center" gap="3">
          <Heading size="4" trim="start" mb="0">
            {format(currentMonth, "MMMM yyyy")}
          </Heading>
          <Flex gap="1">
            <IconButton
              variant="ghost"
              color="gray"
              size="2"
              onClick={() => handleMonthChange(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </IconButton>
            <IconButton
              variant="ghost"
              color="gray"
              size="2"
              onClick={() => handleMonthChange(1)}
              aria-label="Next month"
            >
              <ChevronRight size={16} aria-hidden="true" />
            </IconButton>
          </Flex>
        </Flex>

        {effectiveDateRange && (
          <Text size="1" color="gray" highContrast>
            Effective range:{" "}
            {effectiveDateRange.start && format(effectiveDateRange.start, "MMM d, yyyy")}
            {effectiveDateRange.start && effectiveDateRange.end && " – "}
            {effectiveDateRange.end && format(effectiveDateRange.end, "MMM d, yyyy")}
          </Text>
        )}

        {/* Weekday header */}
        <Grid columns="7" gap="1" role="row">
          {WEEKDAYS.map((day) => (
            <Text
              key={day}
              size="1"
              color="gray"
              highContrast
              weight="medium"
              align="center"
              role="columnheader"
            >
              {day}
            </Text>
          ))}
        </Grid>

        {/* Day cells */}
        <Grid
          columns="7"
          gap="1"
          role="grid"
          aria-label={`Availability for ${format(currentMonth, "MMMM yyyy")}`}
        >
          {days.map((day: Date) => {
            const inMonth = isSameMonth(day, currentMonth);
            const inRange = isInEffectiveRange(day);
            const selected = isSelected(day);
            const today = isToday(day);
            const { status, isException, hasTimeSlots } = getDateStatus(day);
            const exception = getException(day);
            const isDisabled = !inMonth || !inRange;

            const ariaLabel = [
              format(day, "EEEE, MMMM d, yyyy"),
              today ? "today" : null,
              STATUS_LABELS[status].toLowerCase(),
              isException ? "exception" : null,
              hasTimeSlots ? "has time slots" : null,
              exception?.reason ? `reason: ${exception.reason}` : null,
              selected ? "selected" : null,
            ]
              .filter(Boolean)
              .join(", ");

            const backgroundColor = selected
              ? STATUS_VAR[status]
              : "transparent";
            const borderColor = isException
              ? "var(--yellow-9)"
              : today
                ? "var(--accent-9)"
                : "var(--gray-5)";
            const textColor = selected ? "var(--color-panel-solid)" : "inherit";

            const cellButton = (
              <Box
                asChild
                minHeight="64px"
                p="2"
                style={{
                  borderRadius: "var(--radius-2)",
                  border: `${isException ? "2px" : "1px"} solid ${borderColor}`,
                  backgroundColor,
                  color: textColor,
                  opacity: inMonth ? 1 : 0.4,
                  textAlign: "center",
                }}
              >
                <button
                  type="button"
                  onClick={() => !isDisabled && handleDateClick(day)}
                  disabled={isDisabled}
                  aria-label={ariaLabel}
                  aria-pressed={selected}
                  aria-current={today ? "date" : undefined}
                >
                  <Flex direction="column" align="center" gap="1" height="100%">
                    <Text size="2" weight={selected || today ? "bold" : "regular"}>
                      {format(day, "d")}
                    </Text>

                    {/* Mobile: single colored dot */}
                    <Box display={{ initial: "block", sm: "none" }}>
                      <Box
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "9999px",
                          backgroundColor: STATUS_VAR[status],
                        }}
                      />
                    </Box>

                    {/* Desktop: status icon */}
                    <Box display={{ initial: "none", sm: "block" }}>
                      {status === "available" && (
                        <CheckCircle2
                          size={14}
                          aria-hidden="true"
                          style={{ color: STATUS_VAR.available }}
                        />
                      )}
                      {status === "busy" && (
                        <Clock
                          size={14}
                          aria-hidden="true"
                          style={{ color: STATUS_VAR.busy }}
                        />
                      )}
                      {status === "unavailable" && (
                        <AlertCircle
                          size={14}
                          aria-hidden="true"
                          style={{ color: STATUS_VAR.unavailable }}
                        />
                      )}
                    </Box>

                    {/* Slots indicator — a small dot only, desktop-only */}
                    {showTimeSlots && hasTimeSlots && (
                      <Box display={{ initial: "none", sm: "block" }}>
                        <Box
                          style={{
                            width: "4px",
                            height: "4px",
                            borderRadius: "9999px",
                            backgroundColor: "var(--blue-9)",
                          }}
                        />
                      </Box>
                    )}
                  </Flex>
                </button>
              </Box>
            );

            // Wrap in Tooltip when there's an exception reason — hover/focus
            // surfaces the reason without breaking the grid layout.
            return exception?.reason ? (
              <Tooltip key={day.toISOString()} content={exception.reason}>
                {cellButton}
              </Tooltip>
            ) : (
              <Box key={day.toISOString()}>{cellButton}</Box>
            );
          })}
        </Grid>

        {/* Legend */}
        <Flex gap="4" wrap="wrap" align="center">
          <Flex align="center" gap="2">
            <CheckCircle2
              size={14}
              aria-hidden="true"
              style={{ color: STATUS_VAR.available }}
            />
            <Text size="1" color="gray" highContrast>
              Available
            </Text>
          </Flex>
          <Flex align="center" gap="2">
            <Clock
              size={14}
              aria-hidden="true"
              style={{ color: STATUS_VAR.busy }}
            />
            <Text size="1" color="gray" highContrast>
              Busy
            </Text>
          </Flex>
          <Flex align="center" gap="2">
            <AlertCircle
              size={14}
              aria-hidden="true"
              style={{ color: STATUS_VAR.unavailable }}
            />
            <Text size="1" color="gray" highContrast>
              Unavailable
            </Text>
          </Flex>
          {hasAnyException && (
            <Flex align="center" gap="2">
              <Box
                style={{
                  width: "14px",
                  height: "14px",
                  border: "2px solid var(--yellow-9)",
                  borderRadius: "var(--radius-1)",
                }}
                aria-hidden="true"
              />
              <Text size="1" color="gray" highContrast>
                Exception
              </Text>
            </Flex>
          )}
          {showTimeSlots && (
            <Flex align="center" gap="2">
              <Box
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "9999px",
                  backgroundColor: "var(--blue-9)",
                }}
                aria-hidden="true"
              />
              <Text size="1" color="gray" highContrast>
                Has time slots
              </Text>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Card>
  );
}

AvailabilityCalendar.displayName = "AvailabilityCalendar";
