/** Customer hourly charge = welper rate × this multiplier. */
export const CUSTOMER_CHARGE_MULTIPLIER = 1.25;

/** Welper hourly payout share: y = WELPER_HOURLY_RATE_SHARE × x (customer charge). */
export const WELPER_HOURLY_RATE_SHARE = 1 / CUSTOMER_CHARGE_MULTIPLIER;

/** Platform service fee included in the customer hourly charge (1 − welper share). */
export const PLATFORM_SERVICE_FEE_PERCENT = Math.round(
  (1 - WELPER_HOURLY_RATE_SHARE) * 100,
);

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/** Customer hourly charge x from welper rate y, where x = y × 1.25. */
export function customerHourlyChargeFromWelperRate(welperRate: number): number {
  if (!Number.isFinite(welperRate) || welperRate <= 0) return 0;
  return roundMoney(welperRate * CUSTOMER_CHARGE_MULTIPLIER);
}

export function formatHourlyRateCurrency(
  amount: number,
  locale = "en-CA",
  currency = "CAD",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
