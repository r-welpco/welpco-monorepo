/** Card authorization hold is always one hour of the welper's rate (plus tax). */
export const BOOKING_HOLD_DURATION_HOURS = 1;

/** Minimum billable service duration on a receipt. */
export const MIN_BOOKING_DURATION_MINUTES = BOOKING_HOLD_DURATION_HOURS * 60;

/** Receipt time pickers snap to this grid (minutes). */
export const RECEIPT_BILLING_STEP_MINUTES = 15;

/** Check-out may ceil up to this many minutes ahead of now (matches minimum bill). */
export const RECEIPT_CHECKOUT_FUTURE_GRACE_MINUTES = MIN_BOOKING_DURATION_MINUTES;

/** Welper hourly payout share: y = WELPER_HOURLY_RATE_SHARE × x (customer charge). */
export const WELPER_HOURLY_RATE_SHARE = 0.75;

/** x from welper rate y, where y = 0.75x. */
export function customerHourlyChargeFromWelperRate(welperRate: number): number {
  if (!Number.isFinite(welperRate) || welperRate <= 0) return 0;
  return roundMoney(welperRate / WELPER_HOURLY_RATE_SHARE);
}

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/** Round billing check-in down to the previous step (local time). */
export function floorToReceiptBillingStep(date: Date): Date {
  const d = new Date(date.getTime());
  const mins = d.getMinutes();
  const remainder = mins % RECEIPT_BILLING_STEP_MINUTES;
  if (remainder === 0 && d.getSeconds() === 0 && d.getMilliseconds() === 0) {
    return d;
  }
  d.setMinutes(mins - remainder, 0, 0);
  return d;
}

/** Round billing check-out up to the next step (local time). */
export function ceilToReceiptBillingStep(date: Date): Date {
  const d = new Date(date.getTime());
  const mins = d.getMinutes();
  const remainder = mins % RECEIPT_BILLING_STEP_MINUTES;
  if (remainder === 0 && d.getSeconds() === 0 && d.getMilliseconds() === 0) {
    return d;
  }
  d.setMinutes(mins + (RECEIPT_BILLING_STEP_MINUTES - remainder), 0, 0);
  return d;
}

/** Snap to the billing grid and enforce the one-hour minimum duration. */
export function snapReceiptBillingWindow(
  checkIn: Date,
  checkOut: Date,
): { checkIn: Date; checkOut: Date } {
  const inAt = floorToReceiptBillingStep(checkIn);
  let outAt = ceilToReceiptBillingStep(checkOut);
  const minMs = MIN_BOOKING_DURATION_MINUTES * 60 * 1000;
  if (outAt.getTime() - inAt.getTime() < minMs) {
    outAt = new Date(inAt.getTime() + minMs);
  }
  return { checkIn: inAt, checkOut: outAt };
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
