import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { UserAccount } from './user-account.entity';
import { Referral } from './referral.entity';

export enum CodeType {
  PERSONAL = 'Personal',
  CAMPAIGN = 'Campaign',
}

@Entity('referral_codes')
export class ReferralCode {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ unique: true })
  code!: string;

  @Column({
    type: 'enum',
    enum: CodeType,
    name: 'code_type',
    default: CodeType.PERSONAL,
  })
  codeType!: CodeType;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => UserAccount, (user) => user.referralCodes)
  @JoinColumn({ name: 'user_id' })
  user!: UserAccount;

  @OneToMany(() => Referral, (referral) => referral.referralCode)
  referrals!: Referral[];
}

