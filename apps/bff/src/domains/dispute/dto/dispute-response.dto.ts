import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DisputeParticipantSummaryDto } from './dispute-participant-summary.dto';
import { DisputeResolutionSummaryDto } from './dispute-resolution-summary.dto';
import { CapturedPaymentHintDto } from './captured-payment-hint.dto';

/** Frontend expects "in-review" with hyphen */
export type DisputeStatusApi =
  | 'open'
  | 'in-review'
  | 'resolved'
  | 'closed'
  | 'escalated'
  | 'awaiting-refund'
  | 'awaiting-recovery'
  | 'withdrawn';

export class DisputeResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  bookingId!: string;

  @ApiProperty()
  filerId!: string;

  @ApiProperty({ enum: ['customer', 'welper'] })
  filerType!: string;

  @ApiProperty()
  category!: string;

  @ApiProperty()
  subject!: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty({
    enum: ['open', 'in-review', 'resolved', 'closed', 'escalated', 'awaiting-refund', 'awaiting-recovery'],
  })
  status!: DisputeStatusApi;

  @ApiPropertyOptional({
    description:
      'Wave 2: each `file`-typed evidence item is enriched with a short-lived `signedUrl` (15 min TTL) presigned at response time. `signedUrl` is `null` when the S3 presigner is not configured (local dev) or signing fails — clients should treat null as "metadata only, no download URL".',
  })
  evidence?: Array<{
    type: string;
    key?: string;
    id?: string;
    /** Wave 2: presigned GET URL for `type === 'file'` items. */
    signedUrl?: string | null;
  }> | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({
    description:
      'Set for admin list/detail only: current booking request status (e.g. disputed, cancelled).',
  })
  bookingStatus?: string;

  @ApiPropertyOptional({
    description:
      'Set for admin only: true when the booking is cancelled while this dispute is still open (needs review).',
  })
  bookingCancelledWithOpenDispute?: boolean;

  @ApiPropertyOptional({ description: 'Admin detail: customer party', type: DisputeParticipantSummaryDto })
  customer?: DisputeParticipantSummaryDto;

  @ApiPropertyOptional({ description: 'Admin detail: welper party', type: DisputeParticipantSummaryDto })
  welper?: DisputeParticipantSummaryDto;

  @ApiPropertyOptional({
    description: 'Admin detail: recorded resolution when dispute is closed',
    type: DisputeResolutionSummaryDto,
  })
  resolution?: DisputeResolutionSummaryDto;

  @ApiPropertyOptional({
    description: 'Admin detail: total captured card total for this booking (partial refund guidance)',
    type: CapturedPaymentHintDto,
  })
  capturedPayment?: CapturedPaymentHintDto;

  @ApiPropertyOptional({
    description: 'Admin detail: transfer reversal required before the dispute can close',
  })
  recoveryTask?: {
    id: string;
    stripeTransferId: string;
    requiredReversalCents: number;
    recoveredCents: number;
    outstandingCents: number;
    status: string;
    stripeDashboardUrl: string;
    exceptionMessage: string | null;
    createdAt: string;
  } | null;
}
