import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';

@Entity('stripe_transfer_states')
@Index(['stripeTransferId'], { unique: true })
export class StripeTransferState extends BaseEntity {
  @Column({ name: 'stripe_transfer_id', type: 'varchar', length: 255, unique: true })
  stripeTransferId!: string;

  @Column({ name: 'amount_cents', type: 'int' })
  amountCents!: number;

  @Column({ name: 'amount_reversed_cents', type: 'int', default: 0 })
  amountReversedCents!: number;

  @Column({ name: 'destination_account_id', type: 'varchar', length: 255, nullable: true })
  destinationAccountId!: string | null;

  @Column({ name: 'payout_batch_id', type: 'uuid', nullable: true })
  payoutBatchId!: string | null;

  @Column({ name: 'welper_id', type: 'uuid', nullable: true })
  welperId!: string | null;

  @Column({ name: 'last_event_at', type: 'timestamptz', nullable: true })
  lastEventAt!: Date | null;
}
