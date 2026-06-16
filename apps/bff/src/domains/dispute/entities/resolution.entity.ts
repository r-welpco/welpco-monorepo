import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';

@Entity('resolutions')
@Index(['disputeId'], { unique: true })
export class Resolution extends BaseEntity {
  @Column({ name: 'dispute_id', type: 'uuid' })
  disputeId!: string;

  @Column({ name: 'resolution_type', type: 'varchar', length: 64 })
  resolutionType!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({
    name: 'refund_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  refundAmount!: number | null;

  @Column({ name: 'resolved_by_id', type: 'uuid', nullable: true })
  resolvedById!: string | null;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt!: Date | null;

  @Column({
    name: 'refund_status',
    type: 'varchar',
    length: 32,
    nullable: true,
  })
  refundStatus!: string | null;

  @Column({ name: 'refund_message', type: 'text', nullable: true })
  refundMessage!: string | null;

  @Column({ name: 'refunds_created', type: 'int', nullable: true })
  refundsCreated!: number | null;

  @Column({ name: 'refund_attempted_at', type: 'timestamptz', nullable: true })
  refundAttemptedAt!: Date | null;

  @Column({ name: 'workflow_status', type: 'varchar', length: 32, default: 'completed' })
  workflowStatus!: string;

  @Column({ name: 'refund_baseline_cents', type: 'int', nullable: true })
  refundBaselineCents!: number | null;

  @Column({ name: 'refund_target_cents', type: 'int', nullable: true })
  refundTargetCents!: number | null;

  @Column({ name: 'refund_confirmed_cents', type: 'int', default: 0 })
  refundConfirmedCents!: number;

  @Column({ name: 'pending_booking_outcome', type: 'varchar', length: 32, nullable: true })
  pendingBookingOutcome!: string | null;

  @Column({ name: 'refund_exception', type: 'text', nullable: true })
  refundException!: string | null;

  @Column({ name: 'recommended_refund_allocation', type: 'jsonb', nullable: true })
  recommendedRefundAllocation!: Array<Record<string, unknown>> | null;

  @Column({ name: 'stripe_last_synced_at', type: 'timestamptz', nullable: true })
  stripeLastSyncedAt!: Date | null;
}
