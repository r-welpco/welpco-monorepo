import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';

@Entity('admin_audit_logs')
@Index(['actorUserId'])
@Index(['action'])
export class AdminAuditLog extends BaseEntity {
  @Column({ name: 'actor_user_id', type: 'uuid' })
  actorUserId!: string;

  @Column({ type: 'varchar', length: 128 })
  action!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;
}
