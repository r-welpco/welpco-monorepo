import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StripeRefundOutcomeDto {
  @ApiProperty({
    enum: ['succeeded', 'failed', 'partial', 'skipped', 'not_applicable'],
  })
  status!: 'succeeded' | 'failed' | 'partial' | 'skipped' | 'not_applicable';

  @ApiPropertyOptional({
    description: 'Number of Stripe refund API calls that completed successfully',
  })
  refundsCreated?: number;

  @ApiPropertyOptional()
  message?: string;
}

export class CreateResolutionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  disputeId!: string;

  @ApiProperty()
  resolutionType!: string;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiPropertyOptional()
  refundAmount?: number | null;

  @ApiProperty()
  resolvedAt!: string;

  @ApiProperty({ description: 'Linked booking ID' })
  bookingId!: string;

  @ApiProperty({
    description: 'New booking status after resolution',
    enum: ['completed', 'cancelled'],
  })
  bookingStatus!: 'completed' | 'cancelled';

  @ApiProperty({
    type: StripeRefundOutcomeDto,
    description: 'Stripe card refund outcome (dispute resolutions)',
  })
  stripeRefund!: StripeRefundOutcomeDto;
}
