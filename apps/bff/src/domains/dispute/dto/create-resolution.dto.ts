import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsNumber, Min, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

const RESOLUTION_TYPES = [
  'refund',
  'partial_refund',
  'warning',
  'no_action',
  'closed',
] as const;

const BOOKING_OUTCOMES = ['completed', 'cancelled'] as const;

export class CreateResolutionDto {
  @ApiProperty({ description: 'Resolution type', enum: RESOLUTION_TYPES })
  @IsString()
  @IsIn(RESOLUTION_TYPES)
  resolutionType!: (typeof RESOLUTION_TYPES)[number];

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description:
      'Required when resolutionType is partial_refund (major currency units, e.g. 12.50 CAD). Ignored for full refund.',
  })
  @ValidateIf((o: CreateResolutionDto) => o.resolutionType === 'partial_refund')
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  refundAmount?: number;

  @ApiPropertyOptional({
    description:
      'Booking status after resolution. Defaults to completed. Use cancelled to void the booking.',
    enum: BOOKING_OUTCOMES,
  })
  @IsOptional()
  @IsString()
  @IsIn(BOOKING_OUTCOMES)
  bookingOutcome?: (typeof BOOKING_OUTCOMES)[number];
}
