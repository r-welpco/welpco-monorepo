import { resolveServiceTaxAddress } from './booking-tax-address.util';

describe('resolveServiceTaxAddress', () => {
  it('prefers booking address over customer profile', () => {
    const result = resolveServiceTaxAddress(
      {
        street: '10 King St',
        city: 'Toronto',
        region: 'ON',
        postalCode: 'M5H 1A1',
        country: 'CA',
      },
      {
        streetAddress: '99 Other',
        city: 'Montreal',
        state: 'QC',
        zipCode: 'H2X 1Y4',
        country: 'CA',
      },
    );
    expect(result).toEqual({
      line1: '10 King St',
      city: 'Toronto',
      state: 'ON',
      postalCode: 'M5H 1A1',
      country: 'CA',
    });
  });

  it('falls back to customer profile address', () => {
    const result = resolveServiceTaxAddress(null, {
      streetAddress: '123 Main St',
      city: 'Montreal',
      stateProvince: 'QC',
      zipPostalCode: 'h2x 1y4',
      country: 'Canada',
    });
    expect(result).toEqual({
      line1: '123 Main St',
      city: 'Montreal',
      state: 'QC',
      postalCode: 'H2X 1Y4',
      country: 'CA',
    });
  });

  it('returns null when province or postal code is missing', () => {
    expect(
      resolveServiceTaxAddress(
        { street: '1 A', city: 'Toronto', country: 'CA' },
        null,
      ),
    ).toBeNull();
  });
});
