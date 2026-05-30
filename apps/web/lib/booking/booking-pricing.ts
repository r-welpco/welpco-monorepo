/** Mirrors BFF hold policy: authorization is always one hour at the welper rate. */
export const BOOKING_HOLD_DURATION_HOURS = 1;

/** Minimum booked service window (matches hold duration). */
export const MIN_BOOKING_DURATION_MINUTES = BOOKING_HOLD_DURATION_HOURS * 60;

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function computeSubtotalFromMinutes(
  hourlyRate: number,
  durationMinutes: number,
): number {
  if (hourlyRate <= 0 || durationMinutes <= 0) return 0;
  return roundMoney(hourlyRate * (durationMinutes / 60));
}

/** Subtotal for the card hold shown at booking request (1 hour, before tax). */
export function computeOneHourHoldSubtotal(hourlyRate: number): number {
  return roundMoney(hourlyRate * BOOKING_HOLD_DURATION_HOURS);
}
