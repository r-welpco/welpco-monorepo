import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { PhoneNumber } from '../../../../common/types';

/**
 * Validates phone number format (E.164 or national format)
 * Supports international formats with country code
 */
@ValidatorConstraint({ name: 'isValidPhoneNumber', async: false })
export class IsValidPhoneNumberConstraint
  implements ValidatorConstraintInterface
{
  validate(phoneNumber: any, args: ValidationArguments): boolean {
    if (!phoneNumber || typeof phoneNumber !== 'object') {
      return false;
    }

    const phone = phoneNumber as PhoneNumber;

    // Validate country code (should start with +)
    if (!phone.countryCode || !phone.countryCode.startsWith('+')) {
      return false;
    }

    // Validate number (should be digits only, 7-15 digits)
    if (!phone.number || !/^\d{7,15}$/.test(phone.number)) {
      return false;
    }

    // Optional formatted field should be a string if provided
    if (phone.formatted && typeof phone.formatted !== 'string') {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Phone number must be a valid object with countryCode (starting with +) and number (7-15 digits)';
  }
}

export function IsValidPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidPhoneNumberConstraint,
    });
  };
}

