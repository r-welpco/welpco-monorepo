import { ApiProperty } from '@nestjs/swagger';
import { DayOfWeek } from '../../entities/day-of-week.enum';
import { RecurringPattern } from '../../entities/recurring-pattern.enum';

export class AvailabilityResponseDto {
  @ApiProperty({ description: 'Calendar ID' })
  id: string;

  @ApiProperty({ description: 'Welper ID' })
  welperId: string;

  @ApiProperty({ description: 'Day of week', enum: DayOfWeek })
  dayOfWeek: DayOfWeek;

  @ApiProperty({ description: 'Start time' })
  startTime: string;

  @ApiProperty({ description: 'End time' })
  endTime: string;

  @ApiProperty({ description: 'Recurring pattern', enum: RecurringPattern })
  recurringPattern: RecurringPattern;

  @ApiProperty({ description: 'Available status' })
  available: boolean;

  @ApiProperty({ description: 'Effective date start', nullable: true })
  effectiveDateStart: Date | null;

  @ApiProperty({ description: 'Effective date end', nullable: true })
  effectiveDateEnd: Date | null;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

