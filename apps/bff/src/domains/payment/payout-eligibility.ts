/** Payout scheduling uses America/Toronto (Welpco primary market). */
export const PAYOUT_TIMEZONE = 'America/Toronto';

export const PAYOUT_HOLD_DAYS = 7;

/** Format a Date as YYYY-MM-DD in the payout timezone. */
export function formatDateInPayoutTz(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: PAYOUT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Parse YYYY-MM-DD as noon UTC anchor for stable comparisons. */
export function parsePayoutFridayDate(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00.000Z`);
}

/** Day-of-week in payout TZ: 0 = Sunday, 5 = Friday. */
export function dayOfWeekInPayoutTz(date: Date): number {
  const wd = new Intl.DateTimeFormat('en-US', {
    timeZone: PAYOUT_TIMEZONE,
    weekday: 'short',
  }).format(date);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[wd] ?? 0;
}

/** Next Friday on or after `from` (in payout TZ). Returns YYYY-MM-DD. */
export function getUpcomingPayoutFriday(from: Date = new Date()): string {
  const start = parsePayoutFridayDate(formatDateInPayoutTz(from));
  let cursor = start;
  for (let i = 0; i < 8; i++) {
    if (dayOfWeekInPayoutTz(cursor) === 5) {
      return formatDateInPayoutTz(cursor);
    }
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }
  return formatDateInPayoutTz(from);
}

/**
 * Ledger row is eligible for payout on Friday F when payment was released at
 * least PAYOUT_HOLD_DAYS before that Friday (Toronto calendar day).
 */
export function isEligibleForPayoutFriday(
  paymentReleasedAt: Date,
  payoutFridayIso: string,
): boolean {
  const releasedDay = parsePayoutFridayDate(formatDateInPayoutTz(paymentReleasedAt));
  const payoutDay = parsePayoutFridayDate(payoutFridayIso);
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysBetween = Math.floor((payoutDay.getTime() - releasedDay.getTime()) / msPerDay);
  return daysBetween >= PAYOUT_HOLD_DAYS;
}

/** Payout Friday must be a Friday in America/Toronto. */
export function assertValidPayoutFriday(iso: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    throw new Error('Payout Friday must be YYYY-MM-DD');
  }
  const day = parsePayoutFridayDate(iso);
  if (dayOfWeekInPayoutTz(day) !== 5) {
    throw new Error('Payout Friday must fall on a Friday (America/Toronto)');
  }
}

/** Transfers may execute on or after the batch payout Friday (Toronto calendar day). */
export function isPayoutFridayReached(payoutFridayIso: string, now: Date = new Date()): boolean {
  assertValidPayoutFriday(payoutFridayIso);
  const today = parsePayoutFridayDate(formatDateInPayoutTz(now));
  const payoutDay = parsePayoutFridayDate(payoutFridayIso);
  return today.getTime() >= payoutDay.getTime();
}

/**
 * Batch build allowed for the upcoming Friday or any past Friday — not future Fridays
 * beyond the upcoming payout date.
 */
export function assertBuildablePayoutFriday(iso: string, now: Date = new Date()): void {
  assertValidPayoutFriday(iso);
  const upcoming = getUpcomingPayoutFriday(now);
  const requested = parsePayoutFridayDate(iso);
  const upcomingDay = parsePayoutFridayDate(upcoming);
  if (requested.getTime() > upcomingDay.getTime()) {
    throw new Error(
      `Cannot build a batch for ${iso}; only the upcoming Friday (${upcoming}) or earlier is allowed`,
    );
  }
}
