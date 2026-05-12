import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAvailabilityExceptionDto {
  @ApiProperty({ description: 'Calendar ID (availability calendar belonging to the welper)' })
  @IsUUID()
  calendarId!: string;

  @ApiProperty({ description: 'Exception date (YYYY-MM-DD)' })
  @IsDateString()
  date!: string;

  @ApiProperty({ description: 'Optional end date for range (YYYY-MM-DD). If set, exception applies from date to endDate inclusive.', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Whether available on this date' })
  @IsBoolean()
  available!: boolean;

  @ApiProperty({ description: 'Optional reason', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
