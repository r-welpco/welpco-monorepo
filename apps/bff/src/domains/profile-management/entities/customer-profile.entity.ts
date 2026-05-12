import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';
import { ProfileCompletionStatus } from './profile-completion-status.enum';
import { Address, PhoneNumber } from '../../../common/types';

@Entity('customer_profiles')
@Index(['customerId'])
export class CustomerProfile extends BaseEntity {
  @Column({ name: 'customer_id', type: 'uuid', unique: true })
  customerId!: string; // Foreign key to UserAccount (UUID, not actual FK)

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ name: 'profile_photo_url', type: 'varchar', length: 2048, nullable: true })
  profilePhotoUrl!: string | null;

  @Column({ name: 'phone_number', type: 'jsonb', nullable: true })
  phoneNumber!: PhoneNumber | null;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth!: Date | null;

  @Column({ name: 'tos_accepted_at', type: 'timestamptz', nullable: true })
  tosAcceptedAt!: Date | null;

  @Column({ name: 'privacy_accepted_at', type: 'timestamptz', nullable: true })
  privacyAcceptedAt!: Date | null;

  /**
   * Set when the user submits the signup optional-profile step (including skip).
   */
  @Column({
    name: 'optional_profile_step_completed_at',
    type: 'timestamptz',
    nullable: true,
  })
  optionalProfileStepCompletedAt!: Date | null;

  @Column({ name: 'address', type: 'jsonb', nullable: true })
  address!: Address | null;

  @Column({
    type: 'enum',
    enum: ProfileCompletionStatus,
    name: 'profile_completion_status',
    default: ProfileCompletionStatus.INCOMPLETE,
  })
  profileCompletionStatus!: ProfileCompletionStatus;

  @Column({ name: 'onboarding_completed', type: 'boolean', default: false })
  onboardingCompleted!: boolean;

  /** Customer service discovery / notification preferences (JSON). */
  @Column({ name: 'service_preferences', type: 'jsonb', nullable: true })
  servicePreferences!: Record<string, unknown> | null;
}

