import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';
import { Message } from './message.entity';

@Entity('chat_threads')
export class ChatThread extends BaseEntity {
  @Column({ name: 'booking_id', type: 'uuid', unique: true })
  bookingId!: string;

  /**
   * Wave 2 (BFF): when the customer last marked the thread read. NULL means
   * "never read" — every message in the thread is unread for the customer.
   * Bible §22.6: never default this to thread-creation; that would silently
   * mark every existing message as read on a fresh column.
   */
  @Column({ name: 'last_read_at_customer', type: 'timestamptz', nullable: true })
  lastReadAtCustomer!: Date | null;

  /** Wave 2 (BFF): same as `lastReadAtCustomer` but tracking the welper side. */
  @Column({ name: 'last_read_at_welper', type: 'timestamptz', nullable: true })
  lastReadAtWelper!: Date | null;

  @OneToMany(() => Message, (message) => message.chatThread)
  messages!: Message[];
}
