import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsBoolean,
  ValidateNested,
  IsArray,
  IsUUID,
  ArrayMinSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ServiceArea } from '../../../../common/types';
import { IsValidGeoJSON } from '../../common/validators/geojson.validator';
import { IsMarketplaceDescriptionAllowed } from '../../../../common/validators/marketplace-description.validator';

export class CreateServiceOfferingDto {
  @ApiProperty({
    description: 'Service category ID (from Content Management)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  serviceCategoryId: string;

  @ApiProperty({
    description: 'Service description',
    example: 'Professional lawn mowing and yard maintenance services',
  })
  @IsString()
  @IsMarketplaceDescriptionAllowed()
  serviceDescription: string;

  @ApiProperty({
    description: 'Hourly rate in USD (required per offering)',
    example: 30.0,
    minimum: 1,
    maximum: 1000,
  })
  // hourlyRate: floor 1 (a $0/hr offering is a data-entry mistake, not a free tier),
  // ceiling 1000 (defends against typo'd 99999 entries that would distort search filters
  // and percentile sort. Real welper rates are in the $20–$200/hr band — a 5× headroom
  // covers premium concierge while keeping garbage out).
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'hourlyRate must be a number with up to 2 decimal places' },
  )
  @Min(1, { message: 'hourlyRate must be at least 1' })
  @Max(1000, { message: 'hourlyRate must be at most 1000' })
  hourlyRate: number;

  @ApiProperty({
    description: 'Experience in years for this specific service',
    example: 5,
    minimum: 0,
    maximum: 50,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  experienceYears?: number;

  @ApiProperty({
    description:
      'Service area (GeoJSON Point or Polygon, overrides default if set)',
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
    description: 'Array of subcategory IDs (from Content Management)',
    example: [
      '123e4567-e89b-12d3-a456-426614174001',
      '123e4567-e89b-12d3-a456-426614174002',
    ],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, {
    message: 'subcategoryIds must include at least one subcategory',
  })
  @IsUUID(4, { each: true })
  subcategoryIds: string[];

  @ApiProperty({
    description: 'Active status',
    default: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    // Simple transformation: convert string booleans to actual booleans
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  active?: boolean;
}
