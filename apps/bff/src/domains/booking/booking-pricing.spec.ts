import {
  BOOKING_HOLD_DURATION_HOURS,
  MIN_BOOKING_DURATION_MINUTES,
  computeOneHourHoldTotal,
  computeOneHourHoldTotalCents,
  computeTotalWithTax,
} from './booking-pricing';

describe('booking-pricing', () => {
  it('uses one hour for hold duration constant', () => {
    expect(BOOKING_HOLD_DURATION_HOURS).toBe(1);
    expect(MIN_BOOKING_DURATION_MINUTES).toBe(60);
  });

  it('computes one-hour hold with tax', () => {
    expect(computeOneHourHoldTotal(50, 500)).toBe(52.5);
    expect(computeOneHourHoldTotalCents(50, 500)).toBe(5250);
  });

  it('computes full job total from duration', () => {
    expect(computeTotalWithTax(40, 120, 0)).toBe(80);
  });
});
