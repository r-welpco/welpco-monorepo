import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';
import type { FilerType } from './filer-type.enum';
import type { DisputeStatus } from './dispute-status.enum';
import type { DisputeCategory } from './dispute-category.enum';

export interface EvidenceItem {
  type: 'file' | 'message';
  key?: string;
  id?: string;
}

@Entity('disputes')
@Index(['bookingId'])
@Index(['filerId'])
@Index(['status'])
export class Dispute extends BaseEntity {
  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId!: string;

  @Column({ name: 'filer_id', type: 'uuid' })
  filerId!: string;

  @Column({ name: 'filer_type', type: 'varchar', length: 20 })
  filerType!: FilerType;

  @Column({ type: 'varchar', length: 32 })
  category!: DisputeCategory;

  @Column({ type: 'varchar', length: 255 })
  subject!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 32, default: 'open' })
  status!: DisputeStatus;

  @Column({ type: 'jsonb', nullable: true })
  evidence!: EvidenceItem[] | null;
}
