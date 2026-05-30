import {
  BOOKING_HOLD_DURATION_HOURS,
  MIN_BOOKING_DURATION_MINUTES,
  RECEIPT_BILLING_STEP_MINUTES,
  ceilToReceiptBillingStep,
  computeOneHourHoldTotal,
  computeOneHourHoldTotalCents,
  computeTotalWithTax,
  floorToReceiptBillingStep,
  snapReceiptBillingWindow,
} from './booking-pricing';

describe('booking-pricing', () => {
  it('uses one hour for hold duration constant', () => {
    expect(BOOKING_HOLD_DURATION_HOURS).toBe(1);
    expect(MIN_BOOKING_DURATION_MINUTES).toBe(60);
    expect(RECEIPT_BILLING_STEP_MINUTES).toBe(15);
  });

  it('computes one-hour hold with tax', () => {
    expect(computeOneHourHoldTotal(50, 500)).toBe(52.5);
    expect(computeOneHourHoldTotalCents(50, 500)).toBe(5250);
  });

  it('computes full job total from duration', () => {
    expect(computeTotalWithTax(40, 120, 0)).toBe(80);
  });

  it('rounds receipt billing check-out up to the next 15-minute mark', () => {
    const at = new Date(2026, 5, 15, 9, 1, 0);
    expect(ceilToReceiptBillingStep(at).getHours()).toBe(9);
    expect(ceilToReceiptBillingStep(at).getMinutes()).toBe(15);
  });

  it('rounds receipt billing check-in down to the previous 15-minute mark', () => {
    const at = new Date(2026, 5, 15, 9, 14, 59);
    expect(floorToReceiptBillingStep(at).getMinutes()).toBe(0);
  });

  it('enforces a one-hour minimum when snapping receipt billing times', () => {
    const checkIn = new Date(2026, 5, 15, 9, 1, 0);
    const checkOut = new Date(2026, 5, 15, 9, 20, 0);
    const snapped = snapReceiptBillingWindow(checkIn, checkOut);
    expect(snapped.checkIn.getMinutes()).toBe(0);
    expect(snapped.checkOut.getHours()).toBe(10);
    expect(snapped.checkOut.getMinutes()).toBe(0);
  });
});
