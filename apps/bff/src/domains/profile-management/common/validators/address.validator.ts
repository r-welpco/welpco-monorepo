import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Address } from '../../../../common/types';

/**
 * Validates address structure
 * Validates required fields and optional coordinate validation
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

    // Validate required fields
    if (!addr.streetAddress || typeof addr.streetAddress !== 'string') {
      return false;
    }

    if (!addr.city || typeof addr.city !== 'string') {
      return false;
    }

    if (!addr.state || typeof addr.state !== 'string') {
      return false;
    }

    // Validate zip code (US: 5 digits or ZIP+4 format)
    if (!addr.zipCode || !/^\d{5}(-\d{4})?$/.test(addr.zipCode)) {
      return false;
    }

    // Optional country field
    if (addr.country && typeof addr.country !== 'string') {
      return false;
    }

    // Optional coordinates validation
    if (addr.coordinates) {
      if (
        typeof addr.coordinates.latitude !== 'number' ||
        typeof addr.coordinates.longitude !== 'number'
      ) {
        return false;
      }

      // Validate latitude range (-90 to 90)
      if (
        addr.coordinates.latitude < -90 ||
        addr.coordinates.latitude > 90
      ) {
        return false;
      }

      // Validate longitude range (-180 to 180)
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
    return 'Address must be a valid object with streetAddress, city, state, and zipCode (5 digits or ZIP+4 format)';
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

