import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserAccount } from './user-account.entity';
import { ReferralCode } from './referral-code.entity';

export enum ReferralStatus {
  PENDING = 'Pending',
  COMPLETED = 'Completed',
  REWARDED = 'Rewarded',
  EXPIRED = 'Expired',
}

export enum RewardStatus {
  PENDING = 'Pending',
  AWARDED = 'Awarded',
  EXPIRED = 'Expired',
}

@Entity('referrals')
export class Referral {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'referrer_user_id' })
  referrerUserId!: string;

  @Column({ name: 'referee_user_id' })
  refereeUserId!: string;

  @Column({ name: 'referral_code_id' })
  referralCodeId!: string;

  @Column({
    type: 'enum',
    enum: ReferralStatus,
    default: ReferralStatus.PENDING,
  })
  status!: ReferralStatus;

  @Column({ name: 'referral_date', type: 'timestamp' })
  referralDate!: Date;

  @Column({ name: 'completion_date', type: 'timestamp', nullable: true })
  completionDate!: Date | null;

  @Column({
    type: 'enum',
    enum: RewardStatus,
    name: 'reward_status',
    default: RewardStatus.PENDING,
  })
  rewardStatus!: RewardStatus;

  @Column({ name: 'reward_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  rewardAmount!: number | null;

  @Column({ name: 'reward_date', type: 'timestamp', nullable: true })
  rewardDate!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => UserAccount, (user) => user.referralsMade)
  @JoinColumn({ name: 'referrer_user_id' })
  referrer!: UserAccount;

  @ManyToOne(() => UserAccount, (user) => user.referralsReceived)
  @JoinColumn({ name: 'referee_user_id' })
  referee!: UserAccount;

  @ManyToOne(() => ReferralCode, (code) => code.referrals)
  @JoinColumn({ name: 'referral_code_id' })
  referralCode!: ReferralCode;
}

