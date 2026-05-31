export interface WeeklyAvailabilityTimeSlot {
  startTime: string;
  endTime: string;
}

export interface WeeklyAvailabilityDaySchedule {
  slots: WeeklyAvailabilityTimeSlot[];
}

/** Seven booleans, Monday through Sunday. */
export interface WeeklyAvailabilitySummary {
  days: boolean[];
  adHocOnly?: boolean;
  schedule?: WeeklyAvailabilityDaySchedule[];
}

export interface WeeklyAvailabilityDisplayLabels {
  label: string;
  adHocOnly: string;
  dayLetters: [string, string, string, string, string, string, string];
  dayNames: [string, string, string, string, string, string, string];
  unavailable: string;
  noSlots: string;
  dayColumn: string;
  hoursColumn: string;
  viewTimesAria: (day: string) => string;
}

/** @deprecated Use WeeklyAvailabilityDisplayLabels */
export type WeeklyAvailabilityStripLabels = WeeklyAvailabilityDisplayLabels;

export function formatAvailabilityTime(hhmm: string, locale = "en"): string {
  const [hourPart, minutePart] = hhmm.slice(0, 5).split(":");
  const hour = Number(hourPart);
  const minute = Number(minutePart);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return hhmm.slice(0, 5);
  }
  const date = new Date(2000, 0, 1, hour, minute);
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatAvailabilitySlotRange(
  slot: WeeklyAvailabilityTimeSlot,
  locale = "en",
): string {
  return `${formatAvailabilityTime(slot.startTime, locale)} – ${formatAvailabilityTime(slot.endTime, locale)}`;
}

export function formatDaySlots(
  slots: WeeklyAvailabilityTimeSlot[],
  locale = "en",
): string {
  return slots.map((slot) => formatAvailabilitySlotRange(slot, locale)).join(", ");
}

export function hasInteractiveSchedule(
  availability: WeeklyAvailabilitySummary | null | undefined,
): boolean {
  return (
    !!availability &&
    !availability.adHocOnly &&
    Array.isArray(availability.schedule) &&
    availability.schedule.some((day) => day.slots.length > 0)
  );
}
