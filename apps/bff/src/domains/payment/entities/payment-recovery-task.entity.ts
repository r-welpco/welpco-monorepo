import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';

@Entity('payment_recovery_tasks')
@Index(['resolutionId'], { unique: true })
@Index(['stripeTransferId'])
@Index(['status'])
export class PaymentRecoveryTask extends BaseEntity {
  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId!: string;

  @Column({ name: 'resolution_id', type: 'uuid', unique: true })
  resolutionId!: string;

  @Column({ name: 'stripe_transfer_id', type: 'varchar', length: 255 })
  stripeTransferId!: string;

  @Column({ name: 'required_reversal_cents', type: 'int' })
  requiredReversalCents!: number;

  @Column({ name: 'recovered_cents', type: 'int', default: 0 })
  recoveredCents!: number;

  @Column({ type: 'varchar', length: 32, default: 'open' })
  status!: string;

  @Column({ name: 'stripe_dashboard_url', type: 'text' })
  stripeDashboardUrl!: string;

  @Column({ name: 'exception_message', type: 'text', nullable: true })
  exceptionMessage!: string | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;
}
