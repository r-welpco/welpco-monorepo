import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { GuardianAccount } from './guardian-account.entity';
import { VerificationStatus } from './verification-status.entity';
import { ReferralCode } from './referral-code.entity';
import { Referral } from './referral.entity';

export enum AccountType {
  CUSTOMER = 'Customer',
  WELPER = 'Welper',
  GUARDIAN = 'Guardian',
  ADMIN = 'Admin',
}

export enum AccountStatus {
  PENDING = 'Pending',
  ACTIVE = 'Active',
  SUSPENDED = 'Suspended',
  DEACTIVATED = 'Deactivated',
}

/**
 * Role chosen by the user at step 1 of the signup wizard. NULL until the user
 * picks (between `POST /auth/signup/begin` and `POST /auth/signup/step/select-role`).
 * Distinct from `accountType` (which preserves the legacy `Customer | Welper |
 * Guardian | Admin` taxonomy used across the rest of the domain) so the wizard
 * has a single source of truth for "did the user pick yet?" without conflating
 * with the broader account-type enum.
 *
 * Day 15 — Signup ↔ onboarding merge, Phase 1.
 */
export enum SelectedRole {
  CUSTOMER = 'customer',
  WELPER = 'welper',
}

@Entity('user_accounts')
export class UserAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({
    type: 'enum',
    enum: AccountType,
    name: 'account_type',
  })
  accountType!: AccountType;

  @Column({
    type: 'enum',
    enum: AccountStatus,
    default: AccountStatus.PENDING,
  })
  status!: AccountStatus;

  @Column({ name: 'email_verified', default: false })
  emailVerified!: boolean;

  /**
   * Day 15 — Signup ↔ onboarding merge, Phase 1.
   *
   * Flips to `true` on `POST /auth/signup/finish` once every role-required
   * field is present. The role-conditional contract is owned by
   * `SignupOrchestratorService`. While `false`, the user is in the wizard;
   * when `true` plus `emailVerified === true`, the user has full product
   * access. The existing `onboarding_completed` columns on the role profiles
   * stay one more phase as deprecated aliases (Phase 4 deletion).
   */
  @Column({ name: 'signup_completed', type: 'boolean', default: false })
  signupCompleted!: boolean;

  /**
   * Role chosen at step 1 of the wizard. NULL until the user picks. Distinct
   * from `accountType` (which is the legacy taxonomy used across the rest of
   * the domain). Once written, it is locked — the wizard does not allow
   * changing role mid-flow.
   */
  @Column({
    type: 'enum',
    enum: SelectedRole,
    enumName: 'user_account_selected_role',
    name: 'selected_role',
    nullable: true,
  })
  selectedRole!: SelectedRole | null;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt!: Date | null;

  @Column({ name: 'stripe_customer_id', type: 'varchar', length: 255, nullable: true })
  stripeCustomerId!: string | null;

  @Column({ name: 'stripe_default_payment_method_id', type: 'varchar', length: 255, nullable: true })
  stripeDefaultPaymentMethodId!: string | null;

  @Column({ name: 'status_changed_at', type: 'timestamptz', nullable: true })
  statusChangedAt!: Date | null;

  @Column({ name: 'status_changed_by_admin_id', type: 'uuid', nullable: true })
  statusChangedByAdminId!: string | null;

  @Column({ name: 'status_change_reason_code', type: 'varchar', length: 64, nullable: true })
  statusChangeReasonCode!: string | null;

  @Column({ name: 'status_change_reason_detail', type: 'text', nullable: true })
  statusChangeReasonDetail!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @OneToOne(() => GuardianAccount, (guardian) => guardian.guardianUser)
  guardianAccount!: GuardianAccount;

  @OneToOne(() => GuardianAccount, (guardian) => guardian.minorUser)
  minorAccount!: GuardianAccount;

  @OneToOne(() => VerificationStatus, (verification) => verification.user)
  verificationStatus!: VerificationStatus;

  @OneToMany(() => ReferralCode, (referralCode) => referralCode.user)
  referralCodes!: ReferralCode[];

  @OneToMany(() => Referral, (referral) => referral.referrer)
  referralsMade!: Referral[];

  @OneToMany(() => Referral, (referral) => referral.referee)
  referralsReceived!: Referral[];
}

