import {
  assertBuildablePayoutDate,
  assertValidPayoutDate,
  getUpcomingPayoutDate,
  isEligibleForPayoutDate,
  isPayoutDateReached,
  PAYOUT_HOLD_DAYS,
} from './payout-eligibility';

describe('payout-eligibility', () => {
  it('requires at least seven days between payment release and payout Monday', () => {
    const released = new Date('2026-06-01T15:00:00.000Z');
    const tooSoon = '2026-06-01';
    const eligibleMonday = '2026-06-08';
    expect(isEligibleForPayoutDate(released, tooSoon)).toBe(false);
    expect(isEligibleForPayoutDate(released, eligibleMonday)).toBe(true);
    expect(PAYOUT_HOLD_DAYS).toBe(7);
  });

  it('returns an upcoming Monday date string', () => {
    const monday = getUpcomingPayoutDate(new Date('2026-06-03T12:00:00.000Z'));
    expect(monday).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const day = new Date(`${monday}T12:00:00.000Z`);
    const weekday = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Toronto',
      weekday: 'short',
    }).format(day);
    expect(weekday).toBe('Mon');
  });

  it('rejects non-Monday dates in assertValidPayoutDate', () => {
    expect(() => assertValidPayoutDate('2026-06-06')).toThrow(/Monday/);
    expect(() => assertValidPayoutDate('2026-06-08')).not.toThrow();
  });

  it('isPayoutDateReached is true on or after payout Monday', () => {
    expect(isPayoutDateReached('2026-06-08', new Date('2026-06-07T12:00:00.000Z'))).toBe(false);
    expect(isPayoutDateReached('2026-06-08', new Date('2026-06-08T12:00:00.000Z'))).toBe(true);
    expect(isPayoutDateReached('2026-06-08', new Date('2026-06-09T12:00:00.000Z'))).toBe(true);
  });

  it('allows a historical Friday batch to execute after its stored date', () => {
    expect(isPayoutDateReached('2026-06-12', new Date('2026-06-13T12:00:00.000Z'))).toBe(true);
  });

  it('assertBuildablePayoutDate rejects future Mondays beyond upcoming', () => {
    const now = new Date('2026-06-03T12:00:00.000Z');
    const upcoming = getUpcomingPayoutDate(now);
    expect(() => assertBuildablePayoutDate(upcoming, now)).not.toThrow();
    expect(() => assertBuildablePayoutDate('2026-06-22', now)).toThrow(/upcoming Monday/);
  });
});
