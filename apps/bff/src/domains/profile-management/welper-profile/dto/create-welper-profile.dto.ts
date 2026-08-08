import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  ValidateNested,
  MinLength,
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
import { IsMarketplaceDescriptionAllowed } from '../../../../common/validators/marketplace-description.validator';

const POSTAL_PREFIX_REGEX = /^[A-Za-z0-9]{1,10}$/;

export class CreateWelperProfileDto {
  @ApiProperty({
    description: 'Welper ID (from User Management)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  welperId: string;

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
    example: {
      countryCode: '+1',
      number: '234567890',
      formatted: '+1 (234) 567-890',
    },
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PhoneNumberDto)
  @IsValidPhoneNumber()
  phoneNumber?: PhoneNumberDto;

  @ApiProperty({
    description: 'Bio/description',
    example: 'Experienced service provider with 5+ years of experience',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsMarketplaceDescriptionAllowed()
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
      coordinates: [
        [
          [-122.4, 37.8],
          [-122.3, 37.8],
          [-122.3, 37.9],
          [-122.4, 37.9],
          [-122.4, 37.8],
        ],
      ],
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
    default: ProfileVisibility.PUBLIC,
    required: false,
  })
  @IsOptional()
  @IsEnum(ProfileVisibility)
  profileVisibility?: ProfileVisibility;

  @ApiProperty({
    description:
      'Country code (e.g. CA). Used for location filter when service_area is Point.',
    required: false,
  })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiProperty({
    description:
      'Province/state code (e.g. QC). Used for location filter when service_area is Point.',
    required: false,
  })
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
