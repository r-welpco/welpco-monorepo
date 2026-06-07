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
function dayOfWeekInPayoutTz(date: Date): number {
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
