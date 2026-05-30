/** Card authorization hold is always one hour of the welper's rate (plus tax). */
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

export function computeTaxAmount(subtotal: number, taxRateBps: number): number {
  if (subtotal <= 0 || taxRateBps <= 0) return 0;
  return roundMoney((subtotal * taxRateBps) / 10000);
}

export function computeTotalWithTax(
  hourlyRate: number,
  durationMinutes: number,
  taxRateBps: number,
): number {
  const subtotal = computeSubtotalFromMinutes(hourlyRate, durationMinutes);
  return roundMoney(subtotal + computeTaxAmount(subtotal, taxRateBps));
}

/** Total dollars for a one-hour authorization hold (subtotal + tax). */
export function computeOneHourHoldTotal(
  hourlyRate: number,
  taxRateBps: number,
): number {
  return computeTotalWithTax(
    hourlyRate,
    BOOKING_HOLD_DURATION_HOURS * 60,
    taxRateBps,
  );
}

export function computeOneHourHoldTotalCents(
  hourlyRate: number,
  taxRateBps: number,
): number {
  return Math.round(computeOneHourHoldTotal(hourlyRate, taxRateBps) * 100);
}
