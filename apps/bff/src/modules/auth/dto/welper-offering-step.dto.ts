import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

/**
 * One service offering in the welper signup wizard (subcategory + details).
 */
export class WelperOfferingItemDto {
  @ApiProperty({
    description: 'Level-2 service category UUID (subcategory).',
  })
  @IsUUID('4', { message: 'subcategoryId must be a valid UUID' })
  subcategoryId!: string;

  @ApiProperty({
    description: 'Offering title (8–120 characters).',
    example: 'Lawn mowing and yard cleanup',
    minLength: 8,
    maxLength: 120,
  })
  @IsString()
  @MinLength(8, { message: 'title must be at least 8 characters' })
  @MaxLength(120, { message: 'title must be at most 120 characters' })
  title!: string;

  @ApiProperty({ description: 'Hourly rate (5–500).', example: 35 })
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'hourlyRate must be a number with up to 2 decimal places' },
  )
  @Min(5, { message: 'hourlyRate must be at least 5' })
  @Max(500, { message: 'hourlyRate must be at most 500' })
  hourlyRate!: number;

  @ApiProperty({
    description: 'Offering description (80–1000 characters).',
    minLength: 80,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(80, { message: 'description must be at least 80 characters' })
  @MaxLength(1000, { message: 'description must be at most 1000 characters' })
  description!: string;
}

/**
 * Welper-only signup step: one or more service offerings.
 */
export class WelperOfferingStepDto {
  @ApiProperty({ type: [WelperOfferingItemDto], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1, { message: 'offerings must include at least one service' })
  @ArrayMaxSize(3, { message: 'offerings must include at most 3 services' })
  @ValidateNested({ each: true })
  @Type(() => WelperOfferingItemDto)
  offerings!: WelperOfferingItemDto[];
}
