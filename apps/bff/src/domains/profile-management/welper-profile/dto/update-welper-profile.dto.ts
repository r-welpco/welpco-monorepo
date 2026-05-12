import { PartialType } from '@nestjs/mapped-types';
import { CreateWelperProfileDto } from './create-welper-profile.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  ValidateNested,
  MinLength,
  MaxLength,
  IsArray,
  ArrayMaxSize,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProfileVisibility } from '../../entities/profile-visibility.enum';
import { ServiceArea } from '../../../../common/types';
import { IsValidGeoJSON } from '../../common/validators/geojson.validator';
import { PhoneNumberDto } from '../../common/dto/phone-number.dto';
import { IsValidPhoneNumber } from '../../common/validators/phone.validator';

const POSTAL_PREFIX_REGEX = /^[A-Za-z0-9]{1,10}$/;

export class UpdateWelperProfileDto extends PartialType(CreateWelperProfileDto) {
  @ApiProperty({
    description: 'First name',
    example: 'John',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
    required: false,
  })
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
  @IsValidPhoneNumber()
  phoneNumber?: PhoneNumberDto;

  @ApiProperty({
    description: 'Bio/description (50–2000 chars when provided)',
    example: 'Experienced service provider',
    required: false,
  })
  // bio: same band the FE form enforces. The hard FE cap is 600 today, but
  // the BFF holds at 2000 to accommodate a richer-text bio variant later
  // without a migration. Min 50 mirrors the FE schema so the API stops the
  // same nonsense the form prevents.
  @IsOptional()
  @IsString()
  @MinLength(50, { message: 'bio must be at least 50 characters' })
  @MaxLength(2000, { message: 'bio must be at most 2000 characters' })
  bio?: string;

  @ApiProperty({
    description: 'Profile photo URL',
    example: 'https://example.com/photo.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  profilePhotoUrl?: string;

  @ApiProperty({
    description: 'Service area (GeoJSON Point or Polygon)',
    example: {
      type: 'Polygon',
      coordinates: [[[-122.4, 37.8], [-122.3, 37.8], [-122.3, 37.9], [-122.4, 37.9], [-122.4, 37.8]]],
    },
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  @IsValidGeoJSON()
  serviceArea?: ServiceArea;

  @ApiProperty({
    description: 'Profile visibility',
    enum: ProfileVisibility,
    required: false,
  })
  @IsOptional()
  @IsEnum(ProfileVisibility)
  profileVisibility?: ProfileVisibility;

  @ApiProperty({ description: 'Country code (e.g. CA). Used for location filter.', required: false })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiProperty({ description: 'Province/state code (e.g. QC). Used for location filter.', required: false })
  @IsOptional()
  @IsString()
  provinceCode?: string;

  @ApiPropertyOptional({
    description: 'Wave 1 structured service area: city name (e.g. "Toronto").',
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
    example: ['M5V', 'M5W', 'M6G'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @Matches(POSTAL_PREFIX_REGEX, { each: true })
  serviceAreaPostalCodes?: string[];
}
