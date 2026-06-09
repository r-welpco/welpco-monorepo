import {
  assertBuildablePayoutFriday,
  assertValidPayoutFriday,
  getUpcomingPayoutFriday,
  isEligibleForPayoutFriday,
  isPayoutFridayReached,
  PAYOUT_HOLD_DAYS,
} from './payout-eligibility';

describe('payout-eligibility', () => {
  it('requires at least seven days between payment release and payout Friday', () => {
    const released = new Date('2026-06-01T15:00:00.000Z');
    const tooSoon = '2026-06-05';
    const eligibleFriday = '2026-06-12';
    expect(isEligibleForPayoutFriday(released, tooSoon)).toBe(false);
    expect(isEligibleForPayoutFriday(released, eligibleFriday)).toBe(true);
    expect(PAYOUT_HOLD_DAYS).toBe(7);
  });

  it('returns an upcoming Friday date string', () => {
    const friday = getUpcomingPayoutFriday(new Date('2026-06-03T12:00:00.000Z'));
    expect(friday).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const day = new Date(`${friday}T12:00:00.000Z`);
    const weekday = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Toronto',
      weekday: 'short',
    }).format(day);
    expect(weekday).toBe('Fri');
  });

  it('rejects non-Friday dates in assertValidPayoutFriday', () => {
    expect(() => assertValidPayoutFriday('2026-06-06')).toThrow(/Friday/);
    expect(() => assertValidPayoutFriday('2026-06-12')).not.toThrow();
  });

  it('isPayoutFridayReached is true on or after payout Friday', () => {
    expect(isPayoutFridayReached('2026-06-12', new Date('2026-06-11T12:00:00.000Z'))).toBe(false);
    expect(isPayoutFridayReached('2026-06-12', new Date('2026-06-12T12:00:00.000Z'))).toBe(true);
    expect(isPayoutFridayReached('2026-06-12', new Date('2026-06-13T12:00:00.000Z'))).toBe(true);
  });

  it('assertBuildablePayoutFriday rejects future Fridays beyond upcoming', () => {
    const now = new Date('2026-06-03T12:00:00.000Z');
    const upcoming = getUpcomingPayoutFriday(now);
    expect(() => assertBuildablePayoutFriday(upcoming, now)).not.toThrow();
    expect(() => assertBuildablePayoutFriday('2026-06-26', now)).toThrow(/upcoming Friday/);
  });
});
