import { getPreviousSaturdayDates } from './seed-payout-test-bookings';

describe('getPreviousSaturdayDates', () => {
  it('returns the last N Saturdays before today (Toronto), oldest first', () => {
    const dates = getPreviousSaturdayDates(5, new Date('2026-06-07T15:00:00.000Z'));
    expect(dates).toHaveLength(5);
    expect(dates).toEqual([
      '2026-05-09',
      '2026-05-16',
      '2026-05-23',
      '2026-05-30',
      '2026-06-06',
    ]);
    for (const iso of dates) {
      const day = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Toronto',
        weekday: 'short',
      }).format(new Date(`${iso}T12:00:00.000Z`));
      expect(day).toBe('Sat');
    }
  });
});
