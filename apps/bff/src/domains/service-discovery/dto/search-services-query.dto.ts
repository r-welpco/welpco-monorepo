import { IsOptional, IsString, IsInt, IsNumber, IsBoolean, Min, Max, IsIn, MaxLength } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { parseQueryBoolean } from '../../../common/dto/parse-query-boolean';

function optionalNumberTransform({ value }: { value: unknown }) {
  if (value === '' || value === null || value === undefined) return undefined;
  return value;
}

export class SearchServicesQueryDto {
  @ApiPropertyOptional({ description: 'Text search (name, bio, service description)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by service category ID' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Country code for postal disambiguation only (e.g. CA). Not used for filtering.' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  countryCode?: string;

  @ApiPropertyOptional({ description: 'Postal/ZIP code to search near (resolved to lat/lng via geocode)' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Search center latitude for radius filter (-90 to 90)' })
  @IsOptional()
  @Transform(optionalNumberTransform)
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Search center longitude for radius filter (-180 to 180)' })
  @IsOptional()
  @Transform(optionalNumberTransform)
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Deprecated: Matching uses welper service area (welper radius). Ignored when postalCode or lat/lng provided.' })
  @IsOptional()
  @Transform(optionalNumberTransform)
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500)
  radiusKm?: number;

  @ApiPropertyOptional({ description: 'Minimum hourly rate filter' })
  @IsOptional()
  @Transform(optionalNumberTransform)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum hourly rate filter' })
  @IsOptional()
  @Transform(optionalNumberTransform)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Minimum rating filter (0-5)' })
  @IsOptional()
  @Transform(optionalNumberTransform)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({
    description: 'When true, return only Welpers whose background check status is Passed.',
  })
  @IsOptional()
  @Transform(({ value }) => parseQueryBoolean(value))
  @IsBoolean()
  verifiedOnly?: boolean;

  @ApiPropertyOptional({ description: 'Page number (1-based)', default: 1 })
  @IsOptional()
  @Transform(optionalNumberTransform)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Transform(optionalNumberTransform)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['relevance', 'price', 'distance'] })
  @IsOptional()
  @IsIn(['relevance', 'price', 'distance'])
  sort?: 'relevance' | 'price' | 'distance' = 'relevance';
}
