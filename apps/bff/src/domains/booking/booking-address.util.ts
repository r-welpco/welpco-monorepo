import type { Address } from '../../common/types';
import { CANADA_COUNTRY_CODE, normalizeCanadianProvinceCode } from '../../common/constants/canadian-provinces';

/** Snapshot customer profile address onto a booking (home services at customer address). */
export function customerProfileAddressToBookingRecord(
  address: Address,
): Record<string, string> {
  return {
    street: address.streetAddress.trim(),
    city: address.city.trim(),
    region: normalizeCanadianProvinceCode(address.state) || address.state.trim(),
    postalCode: address.zipCode.trim().toUpperCase(),
    country: CANADA_COUNTRY_CODE,
  };
}
