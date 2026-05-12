import { ApiProperty } from '@nestjs/swagger';

/** Admin-only: sum of captured card amounts for the booking (refund ceiling guidance) */
export class CapturedPaymentHintDto {
  @ApiProperty({ description: 'Total captured amount in smallest currency unit (e.g. cents)' })
  totalCents!: number;

  @ApiProperty()
  currency!: string;
}
