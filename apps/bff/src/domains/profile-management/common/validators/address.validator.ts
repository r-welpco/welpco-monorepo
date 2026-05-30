import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Address } from '../../../../common/types';
import {
  CANADA_COUNTRY_CODE,
  CANADIAN_POSTAL_CODE_PATTERN,
  CANADIAN_PROVINCE_CODES,
  normalizeCanadianProvinceCode,
} from '../../../../common/constants/canadian-provinces';

/**
 * Validates Canadian address structure for customer profiles and service areas.
 */
@ValidatorConstraint({ name: 'isValidAddress', async: false })
export class IsValidAddressConstraint
  implements ValidatorConstraintInterface
{
  validate(address: any, args: ValidationArguments): boolean {
    if (!address || typeof address !== 'object') {
      return false;
    }

    const addr = address as Address;

    if (!addr.streetAddress || typeof addr.streetAddress !== 'string') {
      return false;
    }

    if (!addr.city || typeof addr.city !== 'string') {
      return false;
    }

    if (!addr.state || typeof addr.state !== 'string') {
      return false;
    }

    const provinceCode = normalizeCanadianProvinceCode(addr.state);
    if (!CANADIAN_PROVINCE_CODES.has(provinceCode)) {
      return false;
    }

    if (!addr.zipCode || !CANADIAN_POSTAL_CODE_PATTERN.test(addr.zipCode.trim())) {
      return false;
    }

    if (addr.country !== undefined && typeof addr.country !== 'string') {
      return false;
    }

    if (addr.country && addr.country.trim().toUpperCase() !== CANADA_COUNTRY_CODE) {
      return false;
    }

    if (addr.coordinates) {
      if (
        typeof addr.coordinates.latitude !== 'number' ||
        typeof addr.coordinates.longitude !== 'number'
      ) {
        return false;
      }

      if (
        addr.coordinates.latitude < -90 ||
        addr.coordinates.latitude > 90
      ) {
        return false;
      }

      if (
        addr.coordinates.longitude < -180 ||
        addr.coordinates.longitude > 180
      ) {
        return false;
      }
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Address must include street, city, a valid Canadian province, and postal code (A1A 1A1)';
  }
}

export function IsValidAddress(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidAddressConstraint,
    });
  };
}
