import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { UserAccount } from './user-account.entity';

export enum BackgroundCheckStatus {
  NOT_REQUIRED = 'Not Required',
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  PASSED = 'Passed',
  FAILED = 'Failed',
  EXPIRED = 'Expired',
}

@Entity('verification_statuses')
export class VerificationStatus {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', unique: true })
  userId!: string;

  @Column({ name: 'email_verified', default: false })
  emailVerified!: boolean;

  @Column({
    type: 'enum',
    enum: BackgroundCheckStatus,
    name: 'background_check_status',
    default: BackgroundCheckStatus.NOT_REQUIRED,
  })
  backgroundCheckStatus!: BackgroundCheckStatus;

  @Column({ name: 'identity_verified', default: false })
  identityVerified!: boolean;

  @Column({ name: 'verification_date', type: 'timestamp', nullable: true })
  verificationDate!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @OneToOne(() => UserAccount, (user) => user.verificationStatus)
  @JoinColumn({ name: 'user_id' })
  user!: UserAccount;
}

