import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserAccount } from './user-account.entity';

@Entity('email_verification_tokens')
export class EmailVerificationToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ unique: true })
  token!: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt!: Date;

  @Column({ name: 'used_at', type: 'timestamp', nullable: true })
  usedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Relations
  @ManyToOne(() => UserAccount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserAccount;

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isUsed(): boolean {
    return this.usedAt !== null;
  }
}

