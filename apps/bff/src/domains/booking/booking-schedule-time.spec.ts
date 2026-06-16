import { scheduledTimeToUtcMs } from './booking-schedule-time';

describe('scheduledTimeToUtcMs', () => {
  it('converts a negative UTC offset to the correct UTC instant', () => {
    expect(scheduledTimeToUtcMs('2026-06-20', '09:30', -240)).toBe(
      Date.parse('2026-06-20T13:30:00.000Z'),
    );
  });

  it('converts a positive UTC offset to the correct UTC instant', () => {
    expect(scheduledTimeToUtcMs('2026-06-20', '09:30', 60)).toBe(
      Date.parse('2026-06-20T08:30:00.000Z'),
    );
  });
});
