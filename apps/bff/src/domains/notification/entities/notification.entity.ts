import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';
import { NotificationChannel } from './notification-channel.enum';
import { NotificationCategory } from './notification-category.enum';

@Entity('notifications')
@Index('IDX_notifications_user_read_created', ['userId', 'isRead', 'createdAt'])
export class Notification extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 32 })
  channel!: NotificationChannel;

  @Column({ type: 'varchar', length: 32 })
  category!: NotificationCategory;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead!: boolean;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt!: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;
}
