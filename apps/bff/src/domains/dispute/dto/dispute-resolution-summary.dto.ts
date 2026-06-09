import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DisputeResolutionSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  resolutionType!: string;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiPropertyOptional({
    description: 'Refund amount in major currency units (e.g. CAD), if applicable',
  })
  refundAmount?: number | null;

  @ApiProperty()
  resolvedAt!: string;

  @ApiPropertyOptional()
  resolvedById?: string | null;

  @ApiPropertyOptional({
    enum: ['succeeded', 'failed', 'partial', 'skipped', 'not_applicable'],
  })
  refundStatus?: string | null;

  @ApiPropertyOptional()
  refundMessage?: string | null;

  @ApiPropertyOptional()
  refundsCreated?: number | null;

  @ApiPropertyOptional()
  refundAttemptedAt?: string | null;
}
