"use client";

import { useState, type CSSProperties } from "react";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Separator } from "@welpco/ui/separator";
import { Text } from "@welpco/ui/text";
import { Popover, PopoverContent, PopoverTrigger } from "@welpco/ui/popover";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import {
  formatAvailabilitySlotRange,
  hasInteractiveSchedule,
  type WeeklyAvailabilityDisplayLabels,
  type WeeklyAvailabilitySummary,
} from "./weekly-availability-utils";

export type {
  WeeklyAvailabilitySummary,
  WeeklyAvailabilityDisplayLabels,
  WeeklyAvailabilityStripLabels,
} from "./weekly-availability-utils";

export interface WeeklyAvailabilityStripProps {
  availability?: WeeklyAvailabilitySummary | null;
  labels: WeeklyAvailabilityDisplayLabels;
  /** Profile cards: divider, label, and slightly smaller day pills. */
  section?: boolean;
  /** @deprecated Prefer `section` on profile cards. Hides the label only. */
  compact?: boolean;
  /** BCP 47 locale for time formatting in popovers. */
  locale?: string;
  /** When false, day pills are not clickable even if schedule exists. */
  interactive?: boolean;
}

function buildAriaSummary(
  availability: WeeklyAvailabilitySummary,
  labels: WeeklyAvailabilityDisplayLabels,
): string {
  if (availability.adHocOnly) {
    return labels.adHocOnly;
  }
  const parts = availability.days.map((active, index) =>
    active ? labels.dayNames[index] : null,
  ).filter(Boolean);
  if (parts.length === 0) {
    return `${labels.label}: none`;
  }
  return `${labels.label}: ${parts.join(", ")}`;
}

const DAY_PILL_SIZE_DEFAULT = "2rem";
const DAY_PILL_SIZE_SECTION = "1.75rem";

function dayPillStyle(
  active: boolean,
  canOpen: boolean,
  size: "default" | "section",
): CSSProperties {
  const pillSize = size === "section" ? DAY_PILL_SIZE_SECTION : DAY_PILL_SIZE_DEFAULT;
  return {
    width: pillSize,
    height: pillSize,
    minWidth: pillSize,
    minHeight: pillSize,
    boxSizing: "border-box",
    borderRadius: "var(--radius-2)",
    flexShrink: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: active ? `var(--${SEMANTIC_COLOR.primary}-9)` : "var(--gray-a3)",
    color: active ? "white" : "var(--gray-9)",
    border: "none",
    padding: 0,
    cursor: canOpen ? "pointer" : "default",
    lineHeight: 1,
    fontSize: size === "section" ? "var(--font-size-1)" : "var(--font-size-2)",
    fontWeight: 500,
    userSelect: "none",
  };
}

function DayPill({
  active,
  letter,
  dayName,
  slots,
  labels,
  locale,
  interactive,
  pillSize,
}: {
  active: boolean;
  letter: string;
  dayName: string;
  slots: { startTime: string; endTime: string }[];
  labels: WeeklyAvailabilityDisplayLabels;
  locale: string;
  interactive: boolean;
  pillSize: "default" | "section";
}) {
  const [open, setOpen] = useState(false);
  const canOpen = interactive && active && slots.length > 0;
  const pillStyle = dayPillStyle(active, canOpen, pillSize);

  if (!canOpen) {
    return (
      <span role="listitem" aria-hidden="true" style={pillStyle}>
        {letter}
      </span>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={labels.viewTimesAria(dayName)}
        aria-expanded={open}
        style={pillStyle}
      >
        <span aria-hidden="true">{letter}</span>
      </PopoverTrigger>
      <PopoverContent side="top" align="center" style={{ minWidth: "10rem", maxWidth: "16rem" }}>
        <Flex direction="column" gap="2">
          <Text size="2" weight="bold">
            {dayName}
          </Text>
          <Flex direction="column" gap="1">
            <Box asChild pl="4">
              <ul style={{ margin: 0 }}>
                {slots.map((slot) => (
                  <li key={`${slot.startTime}-${slot.endTime}`}>
                    <Text size="2" color="gray" highContrast>
                      {formatAvailabilitySlotRange(slot, locale)}
                    </Text>
                  </li>
                ))}
              </ul>
            </Box>
          </Flex>
        </Flex>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Horizontal Mon–Sun strip for customer-facing welper cards and booking UI.
 * Active days with slots open a popover showing available hours.
 */
export function WeeklyAvailabilityStrip({
  availability,
  labels,
  section = false,
  compact = false,
  locale = "en",
  interactive = true,
}: WeeklyAvailabilityStripProps) {
  if (!availability) {
    return null;
  }

  const ariaSummary = buildAriaSummary(availability, labels);
  const schedule = availability.schedule ?? [];
  const isInteractive = interactive && hasInteractiveSchedule(availability);
  const pillSize = section || compact ? "section" : "default";
  const showLabel = section || !compact;
  const dayGap = section ? "1" : "2";

  const dayStrip = (
    <Flex gap={dayGap} wrap="nowrap" role="list">
      {availability.days.map((active, index) => (
        <DayPill
          key={labels.dayNames[index]}
          active={active}
          letter={labels.dayLetters[index]}
          dayName={labels.dayNames[index]}
          slots={schedule[index]?.slots ?? []}
          labels={labels}
          locale={locale}
          interactive={isInteractive}
          pillSize={pillSize}
        />
      ))}
    </Flex>
  );

  if (availability.adHocOnly) {
    const adHocContent = (
      <Text size="2" color="gray" highContrast aria-label={ariaSummary}>
        {labels.adHocOnly}
      </Text>
    );

    if (section) {
      return (
        <Flex direction="column" gap="2" style={{ width: "100%" }}>
          <Separator size="4" />
          <Text size="2" weight="medium" highContrast>
            {labels.label}
          </Text>
          {adHocContent}
        </Flex>
      );
    }

    return (
      <Flex direction="column" gap="1">
        {showLabel && (
          <Text size="1" weight="medium" color="gray" highContrast>
            {labels.label}
          </Text>
        )}
        {adHocContent}
      </Flex>
    );
  }

  if (section) {
    return (
      <Flex direction="column" gap="2" style={{ width: "100%" }} aria-label={ariaSummary}>
        <Separator size="4" />
        <Text size="2" weight="medium" highContrast>
          {labels.label}
        </Text>
        {dayStrip}
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="1" aria-label={ariaSummary}>
      {showLabel && (
        <Text size="1" weight="medium" color="gray" highContrast>
          {labels.label}
        </Text>
      )}
      {dayStrip}
    </Flex>
  );
}

WeeklyAvailabilityStrip.displayName = "WeeklyAvailabilityStrip";
