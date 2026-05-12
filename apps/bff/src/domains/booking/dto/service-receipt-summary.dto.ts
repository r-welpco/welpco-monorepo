import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Wave 2 (BFF): a single S3-backed evidence file as returned to the client.
 * `signedUrl` is presigned on-demand at response time and is `null` when the
 * S3 presigner isn't configured (local dev) or signing failed — callers must
 * treat null as "metadata only, no download URL available right now".
 */
export class ReceiptEvidenceFileDto {
  @ApiPropertyOptional({ description: 'Stable client-supplied id for diffing.' })
  id?: string;

  @ApiProperty({ description: 'Raw S3 object key (do NOT expose to end users).' })
  key!: string;

  @ApiProperty({
    type: 'string',
    nullable: true,
    description: 'Short-lived presigned GET URL (default 15 min TTL). May be null in dev / on signer failure.',
  })
  signedUrl!: string | null;
}

export class ServiceReceiptDto {
  @ApiProperty() id!: string;
  @ApiProperty() bookingId!: string;
  @ApiProperty() billingCheckInAt!: string;
  @ApiProperty() billingCheckOutAt!: string;
  @ApiProperty() hourlyRate!: number;
  @ApiProperty() totalCents!: number;
  @ApiProperty() currency!: string;
  @ApiPropertyOptional() notes!: string | null;
  @ApiProperty() confirmedAt!: string;
  @ApiPropertyOptional() sentToCustomerAt!: string | null;

  /**
   * Wave 2: presigned GET URLs for each evidence file attached to this receipt.
   * Empty array when the receipt has no attachments. Always present (never
   * undefined) so consumers can iterate without null-guarding.
   */
  @ApiProperty({ type: [ReceiptEvidenceFileDto] })
  evidenceFiles!: ReceiptEvidenceFileDto[];
}
