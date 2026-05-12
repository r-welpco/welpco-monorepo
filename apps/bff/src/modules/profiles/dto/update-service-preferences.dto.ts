import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateServicePreferencesDto {
  @ApiPropertyOptional({ description: 'Preferred service category IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredCategories?: string[];

  @ApiPropertyOptional({ description: 'Minimum hourly rate filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum hourly rate filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Preferred service area (client shape)' })
  @IsOptional()
  @IsObject()
  preferredServiceArea?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyNewWelpers?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyPriceChanges?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyAvailability?: boolean;
}
