import type { ServiceTaxAddress } from './booking-tax.types';

function pickString(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function normalizeCountry(raw: string | null): string {
  if (!raw) return 'CA';
  const upper = raw.trim().toUpperCase();
  if (upper === 'CANADA' || upper === 'CA') return 'CA';
  return upper.length === 2 ? upper : 'CA';
}

function normalizePostalCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, ' ');
}

function normalizeProvince(raw: string): string {
  return raw.trim().toUpperCase();
}

function parseAddressRecord(
  record: Record<string, unknown> | null | undefined,
): ServiceTaxAddress | null {
  if (!record) return null;

  const line1 = pickString(record, ['streetAddress', 'street', 'line1', 'line_1']);
  const city = pickString(record, ['city']);
  const state = pickString(record, ['state', 'stateProvince', 'region', 'province']);
  const postalCode = pickString(record, ['zipCode', 'zipPostalCode', 'postalCode', 'postal_code']);
  const country = normalizeCountry(pickString(record, ['country']));

  if (!line1 || !city || !state || !postalCode) {
    return null;
  }

  return {
    line1,
    city,
    state: normalizeProvince(state),
    postalCode: normalizePostalCode(postalCode),
    country,
  };
}

/** Service location for tax: booking address first, then customer profile address. */
export function resolveServiceTaxAddress(
  bookingAddress: Record<string, string> | null | undefined,
  customerAddress: Record<string, unknown> | null | undefined,
): ServiceTaxAddress | null {
  return (
    parseAddressRecord(bookingAddress as Record<string, unknown> | undefined) ??
    parseAddressRecord(customerAddress)
  );
}
