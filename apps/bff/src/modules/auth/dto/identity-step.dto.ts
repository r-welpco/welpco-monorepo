import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  IsDateString,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

/**
 * Day 15 — Phase 1 of the signup ↔ onboarding merge.
 *
 * Closes ONBOARDING-002 (`libphonenumber-js`-validated phone) and
 * ONBOARDING-004 (silent profile-save failures: per-step server-side
 * validation surfaces structured errors instead of swallowing them).
 *
 * The phone is accepted as a free-form string (E.164 ideal but national
 * format with country hint also accepted) and validated via
 * `parsePhoneNumberFromString().isValid()`. The orchestrator parses again
 * and persists the structured `PhoneNumber` shape. Age rules (14+ welper,
 * 18+ customer) are enforced in the signup orchestrator based on role.
 */
@ValidatorConstraint({ name: 'isValidPhoneE164', async: false })
class IsValidPhoneE164Constraint implements ValidatorConstraintInterface {
  validate(phone: unknown): boolean {
    if (typeof phone !== 'string' || !phone.trim()) return false;
    const parsed = parsePhoneNumberFromString(phone.trim());
    return Boolean(parsed?.isValid());
  }

  defaultMessage(): string {
    return 'Phone number is not a valid international phone number';
  }
}

export class IdentityStepDto {
  @ApiProperty({
    description: 'First name (1–80 characters).',
    example: 'Jordan',
    minLength: 1,
    maxLength: 80,
  })
  @IsString()
  @MinLength(1, { message: 'firstName is required' })
  @MaxLength(80, { message: 'firstName must be at most 80 characters' })
  firstName!: string;

  @ApiProperty({
    description: 'Last name (1–80 characters).',
    example: 'Lee',
    minLength: 1,
    maxLength: 80,
  })
  @IsString()
  @MinLength(1, { message: 'lastName is required' })
  @MaxLength(80, { message: 'lastName must be at most 80 characters' })
  lastName!: string;

  @ApiProperty({
    description:
      'Phone number — international format preferred (E.164). National format ' +
      'is also accepted when the country can be inferred. Validated via ' +
      'libphonenumber-js. Stored as a structured PhoneNumber shape.',
    example: '+14165551234',
  })
  @IsString()
  @Validate(IsValidPhoneE164Constraint)
  phone!: string;

  @ApiProperty({
    description:
      'Date of birth (ISO 8601 date). Customers must be 18+; welpers may be 14–17 with guardian approval.',
    example: '1995-06-12',
  })
  @IsDateString({}, { message: 'dateOfBirth must be an ISO date string' })
  dateOfBirth!: string;

  @ApiProperty({
    description: 'ISO datetime when the user accepted the Terms of Service.',
    example: '2026-04-29T15:04:05.000Z',
  })
  @IsDateString(
    {},
    { message: 'tosAcceptedAt must be an ISO datetime string' },
  )
  tosAcceptedAt!: string;

  @ApiProperty({
    description: 'ISO datetime when the user accepted the Privacy Policy.',
    example: '2026-04-29T15:04:05.000Z',
  })
  @IsDateString(
    {},
    { message: 'privacyAcceptedAt must be an ISO datetime string' },
  )
  privacyAcceptedAt!: string;
}
