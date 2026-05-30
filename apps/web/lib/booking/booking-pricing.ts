/** Mirrors BFF hold policy: authorization is always one hour at the welper rate. */
export const BOOKING_HOLD_DURATION_HOURS = 1;

/** Minimum billable service duration on a receipt. */
export const MIN_BOOKING_DURATION_MINUTES = BOOKING_HOLD_DURATION_HOURS * 60;

/** Receipt time pickers snap to this grid (minutes). */
export const RECEIPT_BILLING_STEP_MINUTES = 15;

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

export function receiptBillingDurationMinutes(checkIn: Date, checkOut: Date): number {
  return (checkOut.getTime() - checkIn.getTime()) / (60 * 1000);
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
