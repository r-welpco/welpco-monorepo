import {
  assertBuildablePayoutDate,
  assertValidPayoutDate,
  getUpcomingPayoutDate,
  isEligibleForPayout,
  isPayoutDateReached,
  PAYOUT_HOLD_HOURS,
} from './payout-eligibility';

describe('payout-eligibility', () => {
  it('requires 48 complete elapsed hours after payment release', () => {
    const released = new Date('2026-06-06T15:00:00.000Z');
    expect(isEligibleForPayout(released, new Date('2026-06-08T14:59:59.999Z'))).toBe(false);
    expect(isEligibleForPayout(released, new Date('2026-06-08T15:00:00.000Z'))).toBe(true);
    expect(PAYOUT_HOLD_HOURS).toBe(48);
  });

  it('does not treat two calendar dates as 48 elapsed hours', () => {
    const releasedLateSaturday = new Date('2026-06-07T03:30:00.000Z');
    const mondayMorningToronto = new Date('2026-06-08T13:00:00.000Z');
    expect(isEligibleForPayout(releasedLateSaturday, mondayMorningToronto)).toBe(false);
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
