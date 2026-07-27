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
export function parsePayoutDate(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00.000Z`);
}

/** Day-of-week in payout TZ: 0 = Sunday, 1 = Monday. */
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

/** Next Monday on or after `from` (in payout TZ). Returns YYYY-MM-DD. */
export function getUpcomingPayoutDate(from: Date = new Date()): string {
  const start = parsePayoutDate(formatDateInPayoutTz(from));
  let cursor = start;
  for (let i = 0; i < 8; i++) {
    if (dayOfWeekInPayoutTz(cursor) === 1) {
      return formatDateInPayoutTz(cursor);
    }
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }
  return formatDateInPayoutTz(from);
}

/**
 * Ledger row is eligible on payout date D when payment was released at least
 * PAYOUT_HOLD_DAYS before D (Toronto calendar day).
 */
export function isEligibleForPayoutDate(
  paymentReleasedAt: Date,
  payoutDateIso: string,
): boolean {
  const releasedDay = parsePayoutDate(formatDateInPayoutTz(paymentReleasedAt));
  const payoutDay = parsePayoutDate(payoutDateIso);
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysBetween = Math.floor((payoutDay.getTime() - releasedDay.getTime()) / msPerDay);
  return daysBetween >= PAYOUT_HOLD_DAYS;
}

function assertValidPayoutDateFormat(iso: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    throw new Error('Payout date must be YYYY-MM-DD');
  }
  const day = parsePayoutDate(iso);
  if (Number.isNaN(day.getTime()) || formatDateInPayoutTz(day) !== iso) {
    throw new Error('Payout date must be a valid calendar date');
  }
}

/** New payout batches must use Monday in America/Toronto. */
export function assertValidPayoutDate(iso: string): void {
  assertValidPayoutDateFormat(iso);
  const day = parsePayoutDate(iso);
  if (dayOfWeekInPayoutTz(day) !== 1) {
    throw new Error('Payout date must fall on a Monday (America/Toronto)');
  }
}

/**
 * Transfers may execute on or after the stored payout date. This deliberately
 * accepts historical Friday batches created before the Monday transition.
 */
export function isPayoutDateReached(payoutDateIso: string, now: Date = new Date()): boolean {
  assertValidPayoutDateFormat(payoutDateIso);
  const today = parsePayoutDate(formatDateInPayoutTz(now));
  const payoutDay = parsePayoutDate(payoutDateIso);
  return today.getTime() >= payoutDay.getTime();
}

/**
 * Batch build is allowed for the upcoming Monday or any past Monday, but not a
 * future Monday beyond the upcoming payout date.
 */
export function assertBuildablePayoutDate(iso: string, now: Date = new Date()): void {
  assertValidPayoutDate(iso);
  const upcoming = getUpcomingPayoutDate(now);
  const requested = parsePayoutDate(iso);
  const upcomingDay = parsePayoutDate(upcoming);
  if (requested.getTime() > upcomingDay.getTime()) {
    throw new Error(
      `Cannot build a batch for ${iso}; only the upcoming Monday (${upcoming}) or earlier is allowed`,
    );
  }
}
