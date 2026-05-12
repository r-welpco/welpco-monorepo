import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayMaxSize,
  IsArray,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Day 15 — Phase 1 of the signup ↔ onboarding merge.
 *
 * Welper-only step. Mirrors Wave 1's `ServiceAreaInfo` shape (city + province +
 * country + postalCodes[]) so the public profile hero renders consistently.
 *
 * `province` is the ISO 3166-2 subdivision code (e.g. "ON"). `country` is the
 * ISO 3166-1 alpha-2 code (e.g. "CA"). Validation is loose-by-design here —
 * we only check shape; the orchestrator persists into `welper_profiles.serviceAreaCity`,
 * `welper_profiles.provinceCode`, `welper_profiles.countryCode`, and
 * `welper_profiles.serviceAreaPostalCodes` (a `string[]` JSONB column added in
 * Wave 1's `AddWelperProfileServiceAreaPostalCodes` migration).
 */
const POSTAL_PREFIX_REGEX = /^[A-Za-z0-9]{1,10}$/;

export class WelperServiceAreaStepDto {
  @ApiProperty({
    description: 'Free-form city name (e.g. "Toronto").',
    example: 'Toronto',
    minLength: 1,
    maxLength: 120,
  })
  @IsString()
  @MinLength(1, { message: 'city is required' })
  @MaxLength(120, { message: 'city must be at most 120 characters' })
  city!: string;

  @ApiProperty({
    description: 'ISO 3166-2 subdivision code (e.g. "ON"). 2–10 characters.',
    example: 'ON',
  })
  @IsString()
  @MinLength(2, { message: 'province must be at least 2 characters' })
  @MaxLength(10, { message: 'province must be at most 10 characters' })
  province!: string;

  @ApiProperty({
    description: 'ISO 3166-1 alpha-2 country code (e.g. "CA").',
    example: 'CA',
  })
  @IsString()
  @MinLength(2, { message: 'country must be 2 characters' })
  @MaxLength(2, { message: 'country must be 2 characters' })
  country!: string;

  @ApiProperty({
    description:
      'Postal-code prefixes the welper serves (e.g. ["M5V","M5W"]). Min 1 entry. ' +
      'Each entry is alphanumeric, 1–10 characters. Empty array is rejected — ' +
      'the wizard requires at least one prefix; "all of city" is communicated ' +
      'by repeating the city-wide FSA / ZIP root.',
    example: ['M5V', 'M5W', 'M6G'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'postalCodes must have at least one entry' })
  @ArrayMaxSize(50, { message: 'postalCodes must have at most 50 entries' })
  @IsString({ each: true })
  @Matches(POSTAL_PREFIX_REGEX, {
    each: true,
    message:
      'each postal code must be 1–10 alphanumeric characters (no spaces or punctuation)',
  })
  postalCodes!: string[];
}
