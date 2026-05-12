import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  IsDateString,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
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
 * and persists the structured `PhoneNumber` shape. dateOfBirth gates a
 * minimum age of 13 (COPPA-aligned); the guardian flow lives elsewhere
 * and is out of scope for Phase 1.
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

@ValidatorConstraint({ name: 'isAtLeast13YearsAgo', async: false })
class IsAtLeast13YearsAgoConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    const dob = new Date(value);
    if (Number.isNaN(dob.getTime())) return false;
    // Compute age in years (rounded down). The wizard's COPPA gate is 13;
    // a minor + guardian-account flow already exists separately and is not
    // in scope for the wizard's identity step.
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
    return age >= 13;
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'You must be at least 13 years old to sign up';
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
    description: 'Date of birth (ISO 8601 date). Must be at least 13 years ago.',
    example: '1995-06-12',
  })
  @IsDateString({}, { message: 'dateOfBirth must be an ISO date string' })
  @Validate(IsAtLeast13YearsAgoConstraint)
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
