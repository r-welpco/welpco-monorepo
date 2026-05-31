/** Welper hourly payout share: y = WELPER_HOURLY_RATE_SHARE × x (customer charge). */
export const WELPER_HOURLY_RATE_SHARE = 0.75;

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/** x from welper rate y, where y = 0.75x. */
export function customerHourlyChargeFromWelperRate(welperRate: number): number {
  if (!Number.isFinite(welperRate) || welperRate <= 0) return 0;
  return roundMoney(welperRate / WELPER_HOURLY_RATE_SHARE);
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
