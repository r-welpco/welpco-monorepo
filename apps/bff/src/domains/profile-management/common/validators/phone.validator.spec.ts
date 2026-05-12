import { IsValidPhoneNumberConstraint } from './phone.validator';
import { PhoneNumber } from '../../../../common/types';

describe('IsValidPhoneNumberConstraint', () => {
  let constraint: IsValidPhoneNumberConstraint;

  beforeEach(() => {
    constraint = new IsValidPhoneNumberConstraint();
  });

  describe('validate', () => {
    it('should return true for valid phone number', () => {
      const phone: PhoneNumber = {
        countryCode: '+1',
        number: '234567890',
        formatted: '+1 (234) 567-890',
      };

      expect(constraint.validate(phone, null as any)).toBe(true);
    });

    it('should return true for valid phone number without formatted field', () => {
      const phone: PhoneNumber = {
        countryCode: '+1',
        number: '234567890',
      };

      expect(constraint.validate(phone, null as any)).toBe(true);
    });

    it('should return false for missing countryCode', () => {
      const phone = {
        number: '234567890',
      };

      expect(constraint.validate(phone, null as any)).toBe(false);
    });

    it('should return false for countryCode without +', () => {
      const phone = {
        countryCode: '1',
        number: '234567890',
      };

      expect(constraint.validate(phone, null as any)).toBe(false);
    });

    it('should return false for missing number', () => {
      const phone = {
        countryCode: '+1',
      };

      expect(constraint.validate(phone, null as any)).toBe(false);
    });

    it('should return false for number with less than 7 digits', () => {
      const phone = {
        countryCode: '+1',
        number: '123456',
      };

      expect(constraint.validate(phone, null as any)).toBe(false);
    });

    it('should return false for number with more than 15 digits', () => {
      const phone = {
        countryCode: '+1',
        number: '1234567890123456',
      };

      expect(constraint.validate(phone, null as any)).toBe(false);
    });

    it('should return false for number with non-digit characters', () => {
      const phone = {
        countryCode: '+1',
        number: '234-567-890',
      };

      expect(constraint.validate(phone, null as any)).toBe(false);
    });

    it('should return false for invalid formatted field type', () => {
      const phone = {
        countryCode: '+1',
        number: '234567890',
        formatted: 123,
      };

      expect(constraint.validate(phone, null as any)).toBe(false);
    });

    it('should return false for null value', () => {
      expect(constraint.validate(null, null as any)).toBe(false);
    });

    it('should return false for non-object value', () => {
      expect(constraint.validate('+1234567890', null as any)).toBe(false);
    });
  });

  describe('defaultMessage', () => {
    it('should return error message', () => {
      const message = constraint.defaultMessage(null as any);
      expect(message).toContain('Phone number must be a valid object');
    });
  });
});

