import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';

@Entity('support_tickets')
@Index(['userId'])
@Index(['status'])
export class SupportTicket extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 255 })
  subject!: string;

  @Column({ type: 'varchar', length: 32, default: 'other' })
  category!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 16, default: 'medium' })
  priority!: string;

  @Column({ type: 'varchar', length: 32, default: 'open' })
  status!: string;

  @Column({ name: 'assigned_to_user_id', type: 'uuid', nullable: true })
  assignedToUserId!: string | null;

  @Column({ name: 'internal_note', type: 'text', nullable: true })
  internalNote!: string | null;
}
