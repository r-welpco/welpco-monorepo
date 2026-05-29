import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsObject,
  IsUUID,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  Matches,
  Min,
  Max,
  MaxLength,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { Type } from 'class-transformer';

/** Validates that scheduledEndTime is after scheduledStartTime when both are present. */
function IsAfterStartTime(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAfterStartTime',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(endTime: string, args: ValidationArguments) {
          const dto = args.object as CreateBookingRequestDto;
          if (!dto.scheduledStartTime || !endTime) return true;
          return endTime > dto.scheduledStartTime;
        },
        defaultMessage() {
          return 'scheduledEndTime must be after scheduledStartTime';
        },
      },
    });
  };
}

export class CreateBookingRequestDto {
  @ApiProperty({ description: 'Welper user ID' })
  @IsUUID()
  welperId!: string;

  @ApiProperty({ description: 'Service offering ID' })
  @IsUUID()
  offeringId!: string;

  @ApiPropertyOptional({
    description:
      'Category ID whose service questions were answered. Must be the offering category or one of its subcategories.',
  })
  @IsOptional()
  @IsUUID()
  serviceQuestionCategoryId?: string;

  @ApiProperty({
    description: 'Answers to service questions (questionId -> value)',
    example: { 'question-uuid-1': 'Answer text', 'question-uuid-2': 2 },
  })
  @IsObject()
  answers!: Record<string, string | number | boolean>;

  @ApiProperty({ description: 'Scheduled date (YYYY-MM-DD)', example: '2026-03-15' })
  @IsDateString()
  scheduledDate!: string;

  @ApiProperty({ description: 'Start time (HH:mm)', example: '09:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'scheduledStartTime must be in HH:mm format' })
  scheduledStartTime!: string;

  @ApiProperty({ description: 'End time (HH:mm)', example: '11:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'scheduledEndTime must be in HH:mm format' })
  @IsAfterStartTime()
  scheduledEndTime!: string;

  /**
   * Duration bounds:
   * - Min 15: shorter than 15min isn't a useful service window — payment auth
   *   minimums + welper transit time eat the value.
   * - Max 720 (12 hours): a marketplace booking longer than half a day is
   *   almost certainly a UI mistake (typed extra hour, AM/PM mix-up). The
   *   booking-detail / receipt UI also can't render a multi-day cleanly.
   *   Day 11 audit: was unbounded above — accepted 24h+ bookings.
   */
  @ApiProperty({ description: 'Duration in minutes (15–720)', example: 120 })
  @Type(() => Number)
  @IsNumber()
  @Min(15)
  @Max(720)
  durationMinutes!: number;

  @ApiPropertyOptional({ description: 'Address for the service', example: { streetAddress: '123 Main St', city: 'Montreal', state: 'QC', zipCode: 'H2X 1Y4', country: 'CA' } })
  @IsOptional()
  @IsObject()
  address?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Additional notes for the welper (max 2000 chars)' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  /**
   * Timezone offset in minutes from UTC for cancellation policy calculations.
   * Uses the standard convention: negative values for west of UTC (e.g. -300 for EST/UTC-5),
   * positive values for east of UTC (e.g. +60 for CET/UTC+1).
   * This is the OPPOSITE of JavaScript's Date.getTimezoneOffset().
   */
  @ApiPropertyOptional({ description: 'Timezone offset in minutes from UTC (e.g. -300 for EST, +60 for CET)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  timezoneOffsetMinutes?: number;
}
