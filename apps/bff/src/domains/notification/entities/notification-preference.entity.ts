import { Entity, Column, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';
import { NotificationCategory } from './notification-category.enum';

@Entity('notification_preferences')
@Unique('UQ_notification_preferences_user_category', ['userId', 'category'])
export class NotificationPreference extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 32 })
  category!: NotificationCategory;

  @Column({ name: 'email_enabled', type: 'boolean', default: true })
  emailEnabled!: boolean;

  @Column({ name: 'in_app_enabled', type: 'boolean', default: true })
  inAppEnabled!: boolean;

  @Column({ name: 'sms_enabled', type: 'boolean', default: true })
  smsEnabled!: boolean;
}
