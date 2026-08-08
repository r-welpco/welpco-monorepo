import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  ValidateNested,
  IsObject,
  IsIn,
  IsArray,
  ArrayMaxSize,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PhoneNumberDto } from '../../../domains/profile-management/common/dto/phone-number.dto';
import { AddressDto } from '../../../domains/profile-management/common/dto/address.dto';
import { IsMarketplaceDescriptionAllowed } from '../../../common/validators/marketplace-description.validator';

const POSTAL_PREFIX_REGEX = /^[A-Za-z0-9]{1,10}$/;

/**
 * DTO for PUT /api/profiles/me.
 * Customer: firstName, lastName, phoneNumber, address, profilePhotoUrl.
 * Welper: same plus bio, profilePhotoUrl, serviceArea, profileVisibility.
 */
export class UpdateMyProfileDto {
  @ApiProperty({ description: 'First name', example: 'John', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @ApiProperty({ description: 'Last name', example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  lastName?: string;

  @ApiProperty({
    description: 'Phone number',
    example: { countryCode: '+1', number: '234567890', formatted: '+1 (234) 567-890' },
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PhoneNumberDto)
  phoneNumber?: PhoneNumberDto;

  @ApiProperty({
    description: 'Address (customer)',
    example: { streetAddress: '123 Main St', city: 'City', state: 'CA', zipCode: '94102', country: 'USA' },
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiProperty({ description: 'Bio (welper)', required: false })
  @IsOptional()
  @IsString()
  @IsMarketplaceDescriptionAllowed()
  bio?: string;

  @ApiProperty({ description: 'Profile photo URL (customer and welper)', required: false })
  @IsOptional()
  @IsString()
  profilePhotoUrl?: string;

  @ApiProperty({ description: 'Service area (welper)', required: false })
  @IsOptional()
  @IsObject()
  serviceArea?: Record<string, unknown>;

  @ApiProperty({ description: 'Profile visibility (welper). Matches DB enum: Public, Private.', enum: ['Public', 'Private'], required: false })
  @IsOptional()
  @IsString()
  @IsIn(['Public', 'Private'])
  profileVisibility?: string;

  @ApiPropertyOptional({
    description: 'Wave 1 structured service area: city name (welper).',
    example: 'Toronto',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  serviceAreaCity?: string;

  @ApiPropertyOptional({
    description:
      'Wave 1 structured service area: postal-code prefixes the welper serves ' +
      '(e.g. ["M5V","M5W"]). Empty array means "all of city". Max 50 entries.',
    type: [String],
    example: ['M5V', 'M5W'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @Matches(POSTAL_PREFIX_REGEX, { each: true })
  serviceAreaPostalCodes?: string[];
}
