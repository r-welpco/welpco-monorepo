import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsBoolean,
  IsOptional,
  IsDateString,
  Matches,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { DayOfWeek } from '../../entities/day-of-week.enum';
import { RecurringPattern } from '../../entities/recurring-pattern.enum';

/**
 * Cross-field check: endTime must be strictly after startTime.
 * Same-day slots only — overnight slots aren't a product concept yet.
 *
 * Without this, the booking matcher (`AvailabilityService.isSlotAvailable`)
 * compares HH:mm strings; an inverted slot ("18:00" → "09:00") matches no
 * incoming request, so the welper looks "always unavailable" with no clue why.
 */
@ValidatorConstraint({ name: 'endAfterStart', async: false })
export class EndAfterStartConstraint implements ValidatorConstraintInterface {
  validate(endTime: string, args: ValidationArguments): boolean {
    if (typeof endTime !== 'string') return false;
    const obj = args.object as { startTime?: unknown };
    const startTime = obj.startTime;
    if (typeof startTime !== 'string') return false;
    // String compare works because format is HH:mm[:ss] (zero-padded, lexical = chronological)
    return endTime > startTime;
  }
  defaultMessage(): string {
    return 'endTime must be after startTime';
  }
}

export class CreateAvailabilityDto {
  @ApiProperty({
    description: 'Day of week',
    enum: DayOfWeek,
  })
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @ApiProperty({
    description: 'Start time (HH:mm format)',
    example: '09:00',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
    message: 'startTime must be in HH:mm or HH:mm:ss format',
  })
  startTime: string;

  @ApiProperty({
    description: 'End time (HH:mm format, must be after startTime)',
    example: '17:00',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
    message: 'endTime must be in HH:mm or HH:mm:ss format',
  })
  @Validate(EndAfterStartConstraint)
  endTime: string;

  @ApiProperty({
    description: 'Recurring pattern',
    enum: RecurringPattern,
  })
  @IsEnum(RecurringPattern)
  recurringPattern: RecurringPattern;

  @ApiProperty({
    description: 'Available status',
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  available?: boolean;

  @ApiProperty({
    description: 'Effective date start (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  effectiveDateStart?: string;

  @ApiProperty({
    description: 'Effective date end (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  effectiveDateEnd?: string;
}

