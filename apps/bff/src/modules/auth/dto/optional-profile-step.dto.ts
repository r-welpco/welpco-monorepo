import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Day 15 — Phase 1 of the signup ↔ onboarding merge.
 *
 * Both-roles final step. Both fields are optional — the wizard may finish
 * without either. The orchestrator persists what is provided; nothing else.
 * Address is the customer's delivery / location-for-search; welpers can also
 * set it but the welper's primary location is the service-area step.
 */
export class OptionalAddressDto {
  @ApiPropertyOptional({ description: 'Street address.', example: '123 Main St' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  streetAddress?: string;

  @ApiPropertyOptional({ description: 'City.', example: 'Toronto' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @ApiPropertyOptional({
    description: 'ISO 3166-2 subdivision code.',
    example: 'ON',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  state?: string;

  @ApiPropertyOptional({ description: 'Postal / ZIP code.', example: 'M5V 2T6' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  zipCode?: string;

  @ApiPropertyOptional({
    description: 'ISO 3166-1 alpha-2 country code.',
    example: 'CA',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;
}

export class OptionalProfileStepDto {
  @ApiPropertyOptional({
    description:
      'Profile photo URL. Validated as URL when present. Photo upload itself ' +
      'happens via the existing presigned-S3 path (Wave 2 pattern); the wizard ' +
      'persists the resulting URL here.',
    example: 'https://cdn.welpco.app/profile/u-123.jpg',
  })
  @IsOptional()
  @IsString()
  @IsUrl({ require_protocol: true }, { message: 'photoUrl must be a valid URL' })
  @MaxLength(2048)
  photoUrl?: string;

  @ApiPropertyOptional({
    description: 'Postal address (delivery / search location). All inner fields optional.',
    type: OptionalAddressDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => OptionalAddressDto)
  address?: OptionalAddressDto;

  @ApiPropertyOptional({
    description:
      'When true, the user explicitly skipped this step without photo or address.',
  })
  @IsOptional()
  @IsBoolean()
  skipped?: boolean;
}
