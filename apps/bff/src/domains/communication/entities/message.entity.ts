import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';
import { ChatThread } from './chat-thread.entity';

@Entity('messages')
export class Message extends BaseEntity {
  @Column({ name: 'chat_thread_id', type: 'uuid' })
  chatThreadId!: string;

  @ManyToOne(() => ChatThread, (thread) => thread.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chat_thread_id' })
  chatThread!: ChatThread;

  @Column({ name: 'sender_id', type: 'uuid' })
  senderId!: string;

  @Column({ type: 'text' })
  content!: string;
}
