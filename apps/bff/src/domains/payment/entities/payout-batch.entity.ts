import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';
import { PayoutBatchStatus } from './payout-ledger-status.enum';

@Entity('payout_batches')
@Index(['payoutFriday'])
export class PayoutBatch extends BaseEntity {
  @Column({ name: 'payout_friday', type: 'date' })
  payoutFriday!: string;

  @Column({ type: 'varchar', length: 32, default: PayoutBatchStatus.REVIEW })
  status!: PayoutBatchStatus;

  @Column({ name: 'total_welper_net_cents', type: 'int', default: 0 })
  totalWelperNetCents!: number;

  @Column({ name: 'total_platform_gross_cents', type: 'int', default: 0 })
  totalPlatformGrossCents!: number;

  @Column({ name: 'total_stripe_fee_cents', type: 'int', default: 0 })
  totalStripeFeeCents!: number;

  @Column({ name: 'total_customer_captured_cents', type: 'int', default: 0 })
  totalCustomerCapturedCents!: number;

  @Column({ name: 'booking_count', type: 'int', default: 0 })
  bookingCount!: number;

  @Column({ name: 'welper_count', type: 'int', default: 0 })
  welperCount!: number;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy!: string | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt!: Date | null;

  @Column({ name: 'executed_at', type: 'timestamptz', nullable: true })
  executedAt!: Date | null;

  @Column({ name: 'execution_summary', type: 'jsonb', nullable: true })
  executionSummary!: Record<string, unknown> | null;
}
