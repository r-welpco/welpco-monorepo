import { ApiProperty } from '@nestjs/swagger';

export class WeeklyAvailabilityTimeSlotDto {
  @ApiProperty({ example: '09:00', description: 'Start time (HH:mm)' })
  startTime!: string;

  @ApiProperty({ example: '17:00', description: 'End time (HH:mm)' })
  endTime!: string;
}

export class WeeklyAvailabilityDayScheduleDto {
  @ApiProperty({ type: [WeeklyAvailabilityTimeSlotDto] })
  slots!: WeeklyAvailabilityTimeSlotDto[];
}

/** Monday → Sunday booleans for customer-facing availability strips. */
export class WeeklyAvailabilitySummaryDto {
  @ApiProperty({
    type: [Boolean],
    description:
      'Seven entries (Monday through Sunday). True when the welper has at least one available slot that day.',
    example: [true, true, true, true, true, false, false],
  })
  days!: boolean[];

  @ApiProperty({
    description:
      'When true the welper accepts bookings by request only — no fixed weekly hours.',
  })
  adHocOnly!: boolean;

  @ApiProperty({
    type: [WeeklyAvailabilityDayScheduleDto],
    description: 'Seven entries (Monday through Sunday) with available time ranges.',
  })
  schedule!: WeeklyAvailabilityDayScheduleDto[];
}

export const WEEKLY_AVAILABILITY_DAY_ORDER = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

function emptyWeeklySchedule(): WeeklyAvailabilityDayScheduleDto[] {
  return WEEKLY_AVAILABILITY_DAY_ORDER.map(() => ({ slots: [] }));
}

export function emptyWeeklyAvailabilitySummary(
  adHocOnly = false,
): WeeklyAvailabilitySummaryDto {
  return {
    days: [false, false, false, false, false, false, false],
    adHocOnly,
    schedule: emptyWeeklySchedule(),
  };
}
