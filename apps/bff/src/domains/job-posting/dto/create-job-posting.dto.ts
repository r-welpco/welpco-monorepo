import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsObject,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  Max,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsMarketplaceDescriptionAllowed } from '../../../common/validators/marketplace-description.validator';

export class CreateJobPostingDto {
  @ApiProperty({ description: 'Parent category ID (level-1)' })
  @IsUUID()
  categoryId!: string;

  @ApiProperty({ description: 'Subcategory ID (level-2, required)' })
  @IsUUID()
  subcategoryId!: string;

  @ApiProperty({
    description: 'Answers to service questions (questionId -> value)',
  })
  @IsObject()
  @IsMarketplaceDescriptionAllowed()
  answers!: Record<string, string | number | boolean>;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  @IsMarketplaceDescriptionAllowed()
  title!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(5000)
  @IsMarketplaceDescriptionAllowed()
  description!: string;

  @ApiProperty({ example: '2026-06-15' })
  @IsDateString()
  scheduledDate!: string;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  scheduledStartTime!: string;

  @ApiProperty({ example: '11:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  scheduledEndTime!: string;

  @ApiProperty({ description: 'Duration in minutes (60–720)' })
  @Type(() => Number)
  @IsNumber()
  @Min(60)
  @Max(720)
  durationMinutes!: number;

  @ApiProperty({ description: 'Full service address string' })
  @IsString()
  @MaxLength(500)
  locationAddress!: string;
}
