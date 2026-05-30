import { IsValidAddressConstraint } from './address.validator';
import { Address } from '../../../../common/types';

describe('IsValidAddressConstraint', () => {
  let constraint: IsValidAddressConstraint;

  const validCanadianAddress: Address = {
    streetAddress: '123 Main St',
    city: 'Montreal',
    state: 'QC',
    zipCode: 'H2X 1Y4',
    country: 'CA',
  };

  beforeEach(() => {
    constraint = new IsValidAddressConstraint();
  });

  describe('validate', () => {
    it('should return true for valid Canadian address', () => {
      expect(constraint.validate(validCanadianAddress, null as any)).toBe(true);
    });

    it('should return true for valid address with coordinates', () => {
      const address: Address = {
        ...validCanadianAddress,
        coordinates: {
          latitude: 45.5017,
          longitude: -73.5673,
        },
      };

      expect(constraint.validate(address, null as any)).toBe(true);
    });

    it('should return false for missing streetAddress', () => {
      const address = {
        city: 'Montreal',
        state: 'QC',
        zipCode: 'H2X 1Y4',
      };

      expect(constraint.validate(address, null as any)).toBe(false);
    });

    it('should return false for missing city', () => {
      const address = {
        streetAddress: '123 Main St',
        state: 'QC',
        zipCode: 'H2X 1Y4',
      };

      expect(constraint.validate(address, null as any)).toBe(false);
    });

    it('should return false for invalid province', () => {
      const address = {
        streetAddress: '123 Main St',
        city: 'Montreal',
        state: 'ZZ',
        zipCode: 'H2X 1Y4',
      };

      expect(constraint.validate(address, null as any)).toBe(false);
    });

    it('should return false for invalid postal code format', () => {
      const address = {
        streetAddress: '123 Main St',
        city: 'Montreal',
        state: 'QC',
        zipCode: '123',
      };

      expect(constraint.validate(address, null as any)).toBe(false);
    });

    it('should return false for non-Canada country', () => {
      const address = {
        ...validCanadianAddress,
        country: 'US',
      };

      expect(constraint.validate(address, null as any)).toBe(false);
    });

    it('should return false for invalid coordinates - latitude out of range', () => {
      const address = {
        ...validCanadianAddress,
        coordinates: {
          latitude: 91,
          longitude: -73.5673,
        },
      };

      expect(constraint.validate(address, null as any)).toBe(false);
    });

    it('should return false for null value', () => {
      expect(constraint.validate(null, null as any)).toBe(false);
    });
  });

  describe('defaultMessage', () => {
    it('should return error message', () => {
      const message = constraint.defaultMessage(null as any);
      expect(message).toContain('Canadian province');
    });
  });
});
