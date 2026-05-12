"use client";

import { Card } from "@welpco/ui/card";
import { IconButton } from "@welpco/ui/icon-button";
import { Flex } from "@welpco/ui/flex";
import { Grid } from "@welpco/ui/grid";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Box } from "@welpco/ui/box";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BookingStatus, BookingStatusBadge } from "./booking-status-badge";

export interface BookingCalendarEvent {
  date: Date;
  status: BookingStatus;
  label: string;
}

export interface BookingCalendarProps {
  month?: Date;
  events?: BookingCalendarEvent[];
  onSelectDate?: (date: Date) => void;
  onMonthChange?: (month: Date) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/**
 * Month-view booking calendar. Each cell is a real button (keyboard
 * accessible), with the date's booking count announced for screen readers.
 * Badges show on tablet+; mobile collapses to a single status dot to keep
 * the 7-column grid readable.
 */
export function BookingCalendar({
  month = new Date(),
  events = [],
  onSelectDate,
  onMonthChange,
}: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(month);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const eventsByDay = useMemo(() => {
    return events.reduce<Record<string, BookingCalendarEvent[]>>((acc, event) => {
      const key = format(event.date, "yyyy-MM-dd");
      acc[key] = acc[key] ? [...acc[key], event] : [event];
      return acc;
    }, {});
  }, [events]);

  const changeMonth = (delta: number) => {
    const next = addMonths(currentMonth, delta);
    setCurrentMonth(next);
    onMonthChange?.(next);
  };

  return (
    <Card size="3" variant="surface" style={{ width: "100%", maxWidth: "840px" }}>
      <Flex direction="column" gap="3">
        {/* Header: month nav */}
        <Flex justify="between" align="center" gap="3">
          <Heading size="4" mb="0" trim="start">
            {format(currentMonth, "MMMM yyyy")}
          </Heading>
          <Flex gap="1">
            <IconButton
              variant="ghost"
              color="gray"
              size="2"
              onClick={() => changeMonth(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </IconButton>
            <IconButton
              variant="ghost"
              color="gray"
              size="2"
              onClick={() => changeMonth(1)}
              aria-label="Next month"
            >
              <ChevronRight size={16} aria-hidden="true" />
            </IconButton>
          </Flex>
        </Flex>

        {/* Weekday header row */}
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
        <Grid columns="7" gap="1" role="grid" aria-label={`Bookings for ${format(currentMonth, "MMMM yyyy")}`}>
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const eventsForDay = eventsByDay[key] || [];
            const inMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);
            const count = eventsForDay.length;
            const ariaLabel = `${format(day, "EEEE, MMMM d, yyyy")}${
              count > 0 ? `, ${count} booking${count > 1 ? "s" : ""}` : ""
            }${today ? ", today" : ""}`;

            return (
              <Box
                key={key}
                asChild
                minHeight="72px"
                p="2"
                style={{
                  borderRadius: "var(--radius-2)",
                  border: today
                    ? "1px solid var(--accent-9)"
                    : "1px solid var(--gray-5)",
                  backgroundColor: today ? "var(--accent-3)" : "transparent",
                  opacity: inMonth ? 1 : 0.45,
                  textAlign: "left",
                }}
              >
                <button
                  type="button"
                  disabled={!inMonth}
                  onClick={() => inMonth && onSelectDate?.(day)}
                  aria-label={ariaLabel}
                  aria-current={today ? "date" : undefined}
                >
                  <Flex direction="column" gap="1" height="100%">
                    <Text size="2" weight={today ? "bold" : "regular"}>
                      {format(day, "d")}
                    </Text>

                    {/* Desktop: up to 2 badges + overflow count */}
                    <Box display={{ initial: "none", sm: "block" }}>
                      <Flex direction="column" gap="1">
                        {eventsForDay.slice(0, 2).map((event, index) => (
                          <BookingStatusBadge
                            key={`${key}-${index}`}
                            status={event.status}
                          />
                        ))}
                        {count > 2 && (
                          <Text size="1" color="gray" highContrast>
                            +{count - 2} more
                          </Text>
                        )}
                      </Flex>
                    </Box>

                    {/* Mobile: single status dot to indicate events exist */}
                    {count > 0 && (
                      <Box display={{ initial: "block", sm: "none" }}>
                        <Box
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "9999px",
                            backgroundColor: "var(--accent-9)",
                          }}
                        />
                      </Box>
                    )}
                  </Flex>
                </button>
              </Box>
            );
          })}
        </Grid>
      </Flex>
    </Card>
  );
}

BookingCalendar.displayName = "BookingCalendar";
