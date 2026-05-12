import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Day 15 — Phase 1 of the signup ↔ onboarding merge.
 *
 * Welper-only step. Required: at least one service offering exists when the
 * wizard finishes.
 *
 * Hourly-rate bounds: 5 floor (a $0/hr offering is data entry mistake;
 * Day 11 booking audit caught the same), 500 ceiling (the wizard is a
 * "sane defaults" entry path; premium concierge welpers can push higher
 * later via the dashboard's offering editor which uses the broader 1–1000
 * window). title 8–120 mirrors the existing offering form's sizing
 * convention; description 80–1000 enforces a useful minimum while staying
 * shorter than bio (offering description is a sub-card primitive).
 */
export class WelperOfferingStepDto {
  @ApiProperty({
    description: 'Service category UUID (from Content Management).',
    example: '6b2f2ed6-0f7c-4f09-9f70-2a9b4aaa6f7d',
  })
  @IsUUID('4', { message: 'categoryId must be a valid UUID' })
  categoryId!: string;

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

  @ApiProperty({
    description: 'Hourly rate (5–500).',
    example: 35,
    minimum: 5,
    maximum: 500,
  })
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
    example:
      'I bring my own mower and trimmer. Standard yard takes 60–90 minutes. ' +
      'Bagging, edging, and curbside disposal included.',
    minLength: 80,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(80, { message: 'description must be at least 80 characters' })
  @MaxLength(1000, { message: 'description must be at most 1000 characters' })
  description!: string;
}
