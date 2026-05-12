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

  @Column({ name: 'refund_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  refundAmount!: number | null;

  @Column({ name: 'resolved_by_id', type: 'uuid', nullable: true })
  resolvedById!: string | null;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt!: Date | null;
}
