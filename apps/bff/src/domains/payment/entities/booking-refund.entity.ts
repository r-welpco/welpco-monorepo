import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';

@Entity('booking_refunds')
@Index(['bookingId'])
@Index(['resolutionId'])
@Index(['stripeRefundId'], { unique: true })
export class BookingRefund extends BaseEntity {
  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId!: string;

  @Column({ name: 'resolution_id', type: 'uuid', nullable: true })
  resolutionId!: string | null;

  @Column({ name: 'stripe_refund_id', type: 'varchar', length: 255, unique: true })
  stripeRefundId!: string;

  @Column({ name: 'stripe_charge_id', type: 'varchar', length: 255 })
  stripeChargeId!: string;

  @Column({ name: 'stripe_payment_intent_id', type: 'varchar', length: 255 })
  stripePaymentIntentId!: string;

  @Column({ name: 'amount_cents', type: 'int' })
  amountCents!: number;

  @Column({ type: 'varchar', length: 3, default: 'cad' })
  currency!: string;

  @Column({ type: 'varchar', length: 32 })
  status!: string;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason!: string | null;

  @Column({ name: 'initiated_at', type: 'timestamptz', nullable: true })
  initiatedAt!: Date | null;

  @Column({ name: 'succeeded_at', type: 'timestamptz', nullable: true })
  succeededAt!: Date | null;

  @Column({ name: 'tax_reversal_status', type: 'varchar', length: 32, nullable: true })
  taxReversalStatus!: string | null;

  @Column({ name: 'stripe_tax_reversal_id', type: 'varchar', length: 255, nullable: true })
  stripeTaxReversalId!: string | null;

  @Column({ name: 'tax_reversal_error', type: 'text', nullable: true })
  taxReversalError!: string | null;
}
