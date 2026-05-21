"use client";

import { Card } from "@welpco/ui/card";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import type { TimeSlot } from "./time-slot-availability";
import { CalendarDays, Clock } from "lucide-react";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Minimal exception shape for stats: date/range and whether that day is available. */
export interface AvailabilityExceptionForStats {
  date: Date | string;
  endDate?: Date | null;
  available: boolean;
}

function parseTimeHHMM(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function hoursBetween(start: string, end: string): number {
  const startMin = parseTimeHHMM(start);
  const endMin = parseTimeHHMM(end);
  return Math.max(0, (endMin - startMin) / 60);
}

function toDateOnly(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Sunday of the current week (local), at start of day. */
function getThisWeekSunday(): Date {
  const now = new Date();
  const day = now.getDay();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - day);
  sunday.setHours(0, 0, 0, 0);
  return sunday;
}

/** Date for weekday (0=Sun .. 6=Sat) in the current week. */
function getDateOfWeekday(weekStart: Date, dayOfWeek: number): Date {
  const d = new Date(weekStart);
  d.setDate(weekStart.getDate() + dayOfWeek);
  return d;
}

function dateInExceptionRange(
  dateOnly: string,
  ex: AvailabilityExceptionForStats
): boolean {
  const start = toDateOnly(ex.date);
  const end = ex.endDate ? toDateOnly(ex.endDate) : start;
  return dateOnly >= start && dateOnly <= end;
}

function computeStats(
  timeSlots: TimeSlot[],
  exceptions?: AvailabilityExceptionForStats[]
) {
  const hoursByDay = [0, 0, 0, 0, 0, 0, 0];
  let totalHours = 0;
  const daysSet = new Set<number>();

  for (const slot of timeSlots) {
    const day = slot.dayOfWeek;
    const hours = hoursBetween(slot.startTime, slot.endTime);
    hoursByDay[day] = (hoursByDay[day] ?? 0) + hours;
    totalHours += hours;
    daysSet.add(day);
  }

  let effectiveHoursByDay = [...hoursByDay];
  let effectiveTotal = totalHours;
  let effectiveDaysCount = daysSet.size;

  if (exceptions && exceptions.length > 0) {
    const weekStart = getThisWeekSunday();
    effectiveHoursByDay = hoursByDay.map((baseHours, dayOfWeek) => {
      const date = getDateOfWeekday(weekStart, dayOfWeek);
      const dateStr = toDateOnly(date);
      const hasUnavailable = exceptions.some(
        (ex) => !ex.available && dateInExceptionRange(dateStr, ex)
      );
      if (hasUnavailable && baseHours > 0) return 0;
      return baseHours;
    });
    effectiveTotal = effectiveHoursByDay.reduce((a, b) => a + b, 0);
    effectiveDaysCount = effectiveHoursByDay.filter((h) => h > 0).length;
  } else {
    effectiveHoursByDay = hoursByDay;
  }

  const maxHours = Math.max(...effectiveHoursByDay, 1);
  return {
    hoursByDay: effectiveHoursByDay,
    totalHours: effectiveTotal,
    daysCount: effectiveDaysCount,
    maxHours,
  };
}

export type AvailabilityScheduleStatsLabels = {
  title?: string;
  withExceptions: string;
  regularOnly: string;
  dayShort?: string[];
};

export interface AvailabilityScheduleStatsProps {
  timeSlots: TimeSlot[];
  /** When provided, "This week" stats reflect exceptions (e.g. unavailable days). */
  availabilityExceptions?: AvailabilityExceptionForStats[];
  labels?: AvailabilityScheduleStatsLabels;
}

export function AvailabilityScheduleStats({
  timeSlots,
  availabilityExceptions,
  labels,
}: AvailabilityScheduleStatsProps) {
  const dayLabels = labels?.dayShort ?? DAY_LABELS;
  const { hoursByDay, totalHours, daysCount, maxHours } = computeStats(
    timeSlots,
    availabilityExceptions
  );

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "100%", minWidth: 0 }}
    >
      <Flex direction="column" gap="3" style={{ minWidth: 0 }}>
        <Box>
          <Heading size="4" mb="1">
            {labels?.title ?? "This week"}
          </Heading>
          <Text size="2" color="gray" highContrast>
            {availabilityExceptions?.length
              ? (labels?.withExceptions ?? "This week's availability including exceptions.")
              : (labels?.regularOnly ?? "Summary of your regular schedule.")}
          </Text>
        </Box>

        <Flex direction="column" gap="4">
          <Flex align="start" gap="3">
            <Flex
              align="center"
              justify="center"
              style={{
                width: "40px",
                height: "40px",
                flexShrink: 0,
                borderRadius: "var(--radius-2)",
                backgroundColor: "var(--green-3)",
                color: "var(--green-11)",
              }}
            >
              <CalendarDays style={{ width: "20px", height: "20px" }} aria-hidden />
            </Flex>
            <Flex direction="column" gap="1" style={{ minWidth: 0 }}>
              <Text size="2" color="gray" highContrast as="p" mb="0">
                Available days
              </Text>
              <Text size="6" weight="bold" as="p" mb="0" style={{ lineHeight: 1.2 }}>
                {daysCount}
              </Text>
            </Flex>
          </Flex>
          <Flex align="start" gap="3">
            <Flex
              align="center"
              justify="center"
              style={{
                width: "40px",
                height: "40px",
                flexShrink: 0,
                borderRadius: "var(--radius-2)",
                backgroundColor: "var(--blue-3)",
                color: "var(--blue-11)",
              }}
            >
              <Clock style={{ width: "20px", height: "20px" }} aria-hidden />
            </Flex>
            <Flex direction="column" gap="1" style={{ minWidth: 0 }}>
              <Text size="2" color="gray" highContrast as="p" mb="0">
                Hours / week
              </Text>
              <Text size="6" weight="bold" as="p" mb="0" style={{ lineHeight: 1.2 }}>
                {totalHours.toFixed(1)}
              </Text>
            </Flex>
          </Flex>
        </Flex>

        {timeSlots.length > 0 && (
          <Box>
            <Heading as="h3" size="3" mb="3">
              Hours by day
            </Heading>
            <Flex gap="1" align="end" style={{ height: "88px" }}>
              {dayLabels.map((label, i) => {
                const h = hoursByDay[i] ?? 0;
                const barHeight = maxHours > 0 ? Math.round((h / maxHours) * 56) : 0;
                return (
                  <Flex
                    key={i}
                    direction="column"
                    align="center"
                    gap="1"
                    style={{ flex: 1, minWidth: 0 }}
                  >
                    <Box
                      style={{
                        width: "100%",
                        height: `${Math.max(barHeight, 2)}px`,
                        borderRadius: "var(--radius-1)",
                        backgroundColor: h > 0 ? "var(--green-9)" : "var(--gray-5)",
                      }}
                      title={`${label}: ${h.toFixed(1)}h`}
                    />
                    <Text size="1" color="gray" trim="end" highContrast>
                      {label}
                    </Text>
                  </Flex>
                );
              })}
            </Flex>
          </Box>
        )}

        {timeSlots.length === 0 && (
          <Text size="2" color="gray" highContrast>
            Add time slots to see your weekly summary.
          </Text>
        )}
      </Flex>
    </Card>
  );
}
