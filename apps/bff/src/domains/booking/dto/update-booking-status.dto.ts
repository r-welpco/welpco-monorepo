import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class DeclineBookingDto {
  @ApiPropertyOptional({ description: 'Reason for declining' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

export class CancelBookingDto {
  @ApiPropertyOptional({ description: 'Reason for cancellation' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;

  /** Override timezone offset in minutes for 24h cancellation check (e.g. -300 for EST). */
  @ApiPropertyOptional({ description: 'Timezone offset in minutes for cancellation policy' })
  @IsOptional()
  @IsNumber()
  timezoneOffsetMinutes?: number;
}
