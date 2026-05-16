import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserAccount } from '../../user-management/entities/user-account.entity';

export enum BackgroundCheckPaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum BackgroundCheckCertnStatus {
  NOT_STARTED = 'not_started',
  INVITED = 'invited',
  IN_PROGRESS = 'in_progress',
  PASSED = 'passed',
  FAILED = 'failed',
}

@Entity('background_check_orders')
export class BackgroundCheckOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Index({ unique: true })
  @Column({ name: 'stripe_checkout_session_id', type: 'varchar', length: 255, nullable: true })
  stripeCheckoutSessionId!: string | null;

  @Column({ name: 'stripe_payment_intent_id', type: 'varchar', length: 255, nullable: true })
  stripePaymentIntentId!: string | null;

  @Column({ name: 'amount_cents', type: 'int' })
  amountCents!: number;

  @Column({ name: 'list_amount_cents', type: 'int' })
  listAmountCents!: number;

  @Column({ type: 'varchar', length: 3, default: 'CAD' })
  currency!: string;

  @Column({
    name: 'payment_status',
    type: 'varchar',
    length: 32,
    default: BackgroundCheckPaymentStatus.PENDING,
  })
  paymentStatus!: BackgroundCheckPaymentStatus;

  @Column({ name: 'certn_application_id', type: 'varchar', length: 255, nullable: true })
  certnApplicationId!: string | null;

  @Column({
    name: 'certn_status',
    type: 'varchar',
    length: 32,
    default: BackgroundCheckCertnStatus.NOT_STARTED,
  })
  certnStatus!: BackgroundCheckCertnStatus;

  @Column({ name: 'certn_applicant_url', type: 'text', nullable: true })
  certnApplicantUrl!: string | null;

  @Column({ name: 'failure_reason', type: 'varchar', length: 500, nullable: true })
  failureReason!: string | null;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt!: Date | null;

  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt!: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => UserAccount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: UserAccount;
}
