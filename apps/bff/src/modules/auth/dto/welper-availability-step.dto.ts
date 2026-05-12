import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DayOfWeek } from '../../../domains/profile-management/entities/day-of-week.enum';

/**
 * Day 15 — Phase 1 of the signup ↔ onboarding merge.
 *
 * Welper-only step. Two acceptance modes:
 *  1. `weeklySlots: TimeSlot[]` — at least one weekly recurring slot.
 *  2. `acceptsAdHocOnly: true` — explicit toggle for welpers who only book
 *     by request (no published recurring availability). Surfaced honestly
 *     to customers (booking flow shows "by request only").
 *
 * Exactly one of the two must be present. Class-level constraint enforces
 * the OR; the orchestrator persists `weeklySlots` into `availability_calendars`
 * rows or sets a flag (Phase 1 just stores; Phase 3 wires the booking gate).
 */
export class WeeklyTimeSlotDto {
  @ApiProperty({ description: 'Day of the week.', enum: DayOfWeek })
  @IsEnum(DayOfWeek)
  dayOfWeek!: DayOfWeek;

  @ApiProperty({
    description: 'Start time (HH:mm), 24-hour clock.',
    example: '09:00',
  })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'startTime must be in HH:mm format',
  })
  startTime!: string;

  @ApiProperty({
    description: 'End time (HH:mm), 24-hour clock. Must be after startTime.',
    example: '17:00',
  })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'endTime must be in HH:mm format',
  })
  endTime!: string;
}

@ValidatorConstraint({ name: 'hasOneAvailabilityMode', async: false })
class HasOneAvailabilityModeConstraint
  implements ValidatorConstraintInterface
{
  validate(_value: unknown, args: ValidationArguments): boolean {
    const dto = args.object as WelperAvailabilityStepDto;
    const hasSlots =
      Array.isArray(dto.weeklySlots) && dto.weeklySlots.length > 0;
    const hasAdHoc = dto.acceptsAdHocOnly === true;
    // Exactly one mode must be active.
    return (hasSlots && !hasAdHoc) || (!hasSlots && hasAdHoc);
  }

  defaultMessage(): string {
    return (
      'Provide either weeklySlots (at least one recurring time slot) or ' +
      'acceptsAdHocOnly: true — not both.'
    );
  }
}

export class WelperAvailabilityStepDto {
  @ApiPropertyOptional({
    description: 'Weekly recurring time slots. At least one entry required when present.',
    type: [WeeklyTimeSlotDto],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'weeklySlots must have at least one entry' })
  @ArrayMaxSize(50, { message: 'weeklySlots must have at most 50 entries' })
  @ValidateNested({ each: true })
  @Type(() => WeeklyTimeSlotDto)
  weeklySlots?: WeeklyTimeSlotDto[];

  @ApiPropertyOptional({
    description:
      'When true, the welper opts out of recurring availability and only ' +
      'accepts ad-hoc booking requests. Customers see "by request only" in ' +
      'the booking flow.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  acceptsAdHocOnly?: boolean;

  // Class-level: exactly one of weeklySlots / acceptsAdHocOnly must be set.
  // Attached to a no-op string property so class-validator runs the
  // constraint at the DTO level (the conventional "marker field" pattern).
  @Validate(HasOneAvailabilityModeConstraint)
  // The marker is intentionally undefined-typed; the validator inspects
  // the rest of the DTO via `args.object`.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __availabilityModeMarker?: any;
}
