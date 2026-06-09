import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';
import { BookingRequest } from '../../booking/entities/booking-request.entity';
import { PayoutBatch } from './payout-batch.entity';
import { WelperPayoutLedgerStatus } from './payout-ledger-status.enum';

@Entity('welper_payout_ledger')
@Index(['welperId', 'status'])
@Index(['paymentReleasedAt'])
@Index(['payoutBatchId'])
export class WelperPayoutLedger extends BaseEntity {
  @Column({ name: 'booking_id', type: 'uuid', unique: true })
  bookingId!: string;

  @ManyToOne(() => BookingRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking!: BookingRequest;

  @Column({ name: 'welper_id', type: 'uuid' })
  welperId!: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId!: string;

  @Column({ name: 'payment_released_at', type: 'timestamptz' })
  paymentReleasedAt!: Date;

  @Column({ name: 'customer_subtotal_cents', type: 'int' })
  customerSubtotalCents!: number;

  @Column({ name: 'customer_tax_cents', type: 'int' })
  customerTaxCents!: number;

  @Column({ name: 'customer_total_cents', type: 'int' })
  customerTotalCents!: number;

  @Column({ name: 'welper_gross_cents', type: 'int' })
  welperGrossCents!: number;

  @Column({ name: 'welper_refund_cents', type: 'int', default: 0 })
  welperRefundCents!: number;

  @Column({ name: 'welper_net_cents', type: 'int' })
  welperNetCents!: number;

  @Column({ name: 'platform_gross_cents', type: 'int' })
  platformGrossCents!: number;

  @Column({ name: 'stripe_fee_cents', type: 'int', nullable: true })
  stripeFeeCents!: number | null;

  @Column({ type: 'varchar', length: 32, default: WelperPayoutLedgerStatus.PENDING })
  status!: WelperPayoutLedgerStatus;

  @Column({ name: 'exclusion_reason', type: 'varchar', length: 64, nullable: true })
  exclusionReason!: string | null;

  @Column({ name: 'payout_batch_id', type: 'uuid', nullable: true })
  payoutBatchId!: string | null;

  @ManyToOne(() => PayoutBatch, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'payout_batch_id' })
  payoutBatch!: PayoutBatch | null;

  @Column({ name: 'stripe_transfer_id', type: 'varchar', length: 255, nullable: true })
  stripeTransferId!: string | null;
}
