import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';
import { BookingRequest } from './booking-request.entity';

/**
 * Wave 2 evidence-file shape attached to a service receipt. Matches the
 * dispute evidence shape so the same `S3UrlPresignerService` can sign both.
 */
export interface ReceiptEvidenceFile {
  type: 'file';
  /** S3 object key (NOT a public URL — public URLs would skip the presign TTL). */
  key: string;
  /** Optional client-supplied id used for stable React keys + diffing. */
  id?: string;
}

@Entity('booking_service_receipts')
@Index(['bookingId'])
export class BookingServiceReceipt extends BaseEntity {
  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId!: string;

  @ManyToOne(() => BookingRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking!: BookingRequest;

  @Column({ name: 'billing_check_in_at', type: 'timestamptz' })
  billingCheckInAt!: Date;

  @Column({ name: 'billing_check_out_at', type: 'timestamptz' })
  billingCheckOutAt!: Date;

  @Column({ name: 'hourly_rate', type: 'decimal', precision: 10, scale: 2 })
  hourlyRate!: string;

  /** Subtotal before tax (cents). */
  @Column({ name: 'subtotal_cents', type: 'int', default: 0 })
  subtotalCents!: number;

  /** Tax amount (cents). */
  @Column({ name: 'tax_cents', type: 'int', default: 0 })
  taxCents!: number;

  /** Tax rate applied to subtotal, in basis points (bps). Example: 1495 = 14.95% */
  @Column({ name: 'tax_rate_bps', type: 'int', default: 0 })
  taxRateBps!: number;

  @Column({ name: 'total_cents', type: 'int' })
  totalCents!: number;

  @Column({ type: 'varchar', length: 3, default: 'cad' })
  currency!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'confirmed_at', type: 'timestamptz' })
  confirmedAt!: Date;

  @Column({ name: 'sent_to_customer_at', type: 'timestamptz', nullable: true })
  sentToCustomerAt!: Date | null;

  /**
   * Wave 2 (BFF): optional file attachments captured by the welper at
   * receipt-confirmation time (e.g. before/after photos, parking-receipt scans).
   * Stored as raw S3 keys; presigned at response time.
   */
  @Column({ name: 'evidence_files', type: 'jsonb', nullable: true })
  evidenceFiles!: ReceiptEvidenceFile[] | null;
}
