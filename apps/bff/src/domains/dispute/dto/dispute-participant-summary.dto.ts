import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Admin-only: identity and contact hints for dispute parties */
export class DisputeParticipantSummaryDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty({ enum: ['customer', 'welper'] })
  role!: 'customer' | 'welper';

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  firstName?: string;

  @ApiPropertyOptional()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Formatted phone from profile, if present' })
  phoneDisplay?: string;
}
