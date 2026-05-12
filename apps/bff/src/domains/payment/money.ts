/**
 * Convert major currency units (e.g. 12.34 CAD) to integer cents without binary float drift.
 * Uses fixed two-decimal string form so 10.03 → 1003 reliably.
 */
export function majorCurrencyUnitsToCents(value: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error('INVALID_AMOUNT');
  }
  if (value < 0.01) {
    throw new Error('AMOUNT_TOO_SMALL');
  }
  const s = (Math.round(value * 100) / 100).toFixed(2);
  const [whole, frac = '00'] = s.split('.');
  const negative = whole.startsWith('-');
  const w = negative ? whole.slice(1) : whole;
  const centsPart = (frac + '00').slice(0, 2);
  const n = parseInt(w, 10) * 100 + parseInt(centsPart, 10);
  return negative ? -n : n;
}
