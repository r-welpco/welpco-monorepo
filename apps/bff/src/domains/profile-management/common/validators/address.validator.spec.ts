import { IsValidAddressConstraint } from './address.validator';
import { Address } from '../../../../common/types';

describe('IsValidAddressConstraint', () => {
  let constraint: IsValidAddressConstraint;

  beforeEach(() => {
    constraint = new IsValidAddressConstraint();
  });

  describe('validate', () => {
    it('should return true for valid address', () => {
      const address: Address = {
        streetAddress: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
      };

      expect(constraint.validate(address, null as any)).toBe(true);
    });

    it('should return true for valid address with country', () => {
      const address: Address = {
        streetAddress: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
      };

      expect(constraint.validate(address, null as any)).toBe(true);
    });

    it('should return true for valid address with coordinates', () => {
      const address: Address = {
        streetAddress: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        coordinates: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      };

      expect(constraint.validate(address, null as any)).toBe(true);
    });

    it('should return true for valid ZIP+4 format', () => {
      const address: Address = {
        streetAddress: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001-1234',
      };

      expect(constraint.validate(address, null as any)).toBe(true);
    });

    it('should return false for missing streetAddress', () => {
      const address = {
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
      };

      expect(constraint.validate(address, null as any)).toBe(false);
    });

    it('should return false for missing city', () => {
      const address = {
        streetAddress: '123 Main St',
        state: 'NY',
        zipCode: '10001',
      };

      expect(constraint.validate(address, null as any)).toBe(false);
    });

    it('should return false for missing state', () => {
      const address = {
        streetAddress: '123 Main St',
        city: 'New York',
        zipCode: '10001',
      };

      expect(constraint.validate(address, null as any)).toBe(false);
    });

    it('should return false for invalid zipCode format', () => {
      const address = {
        streetAddress: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '123',
      };

      expect(constraint.validate(address, null as any)).toBe(false);
    });

    it('should return false for invalid zipCode with letters', () => {
      const address = {
        streetAddress: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: 'ABCDE',
      };

      expect(constraint.validate(address, null as any)).toBe(false);
    });

    it('should return false for invalid country field type', () => {
      const address = {
        streetAddress: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 123,
      };

      expect(constraint.validate(address, null as any)).toBe(false);
    });

    it('should return false for invalid coordinates - missing latitude', () => {
      const address = {
        streetAddress: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        coordinates: {
          longitude: -74.0060,
        },
      };

      expect(constraint.validate(address, null as any)).toBe(false);
    });

    it('should return false for invalid coordinates - latitude out of range', () => {
      const address = {
        streetAddress: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        coordinates: {
          latitude: 91,
          longitude: -74.0060,
        },
      };

      expect(constraint.validate(address, null as any)).toBe(false);
    });

    it('should return false for invalid coordinates - longitude out of range', () => {
      const address = {
        streetAddress: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        coordinates: {
          latitude: 40.7128,
          longitude: 181,
        },
      };

      expect(constraint.validate(address, null as any)).toBe(false);
    });

    it('should return false for null value', () => {
      expect(constraint.validate(null, null as any)).toBe(false);
    });

    it('should return false for non-object value', () => {
      expect(constraint.validate('123 Main St', null as any)).toBe(false);
    });
  });

  describe('defaultMessage', () => {
    it('should return error message', () => {
      const message = constraint.defaultMessage(null as any);
      expect(message).toContain('Address must be a valid object');
    });
  });
});

