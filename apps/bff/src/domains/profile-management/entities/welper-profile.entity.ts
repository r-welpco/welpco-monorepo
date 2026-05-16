import {
  Entity,
  Column,
  Index,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';
import { ProfileCompletionStatus } from './profile-completion-status.enum';
import { ProfileVisibility } from './profile-visibility.enum';
import { PayoutMethodChoice } from './payout-method-choice.enum';
import { ServiceOffering } from './service-offering.entity';
import { AvailabilityCalendar } from './availability-calendar.entity';
import { ServiceArea, PhoneNumber } from '../../../common/types';

@Entity('welper_profiles')
@Index(['welperId'])
@Index(['profileVisibility'])
@Index(['profileCompletionStatus'])
export class WelperProfile extends BaseEntity {
  @Column({ name: 'welper_id', type: 'uuid', unique: true })
  welperId!: string; // Foreign key to UserAccount (UUID, not actual FK)

  @Column({ name: 'first_name', type: 'varchar', length: 100, nullable: true })
  firstName!: string | null;

  @Column({ name: 'last_name', type: 'varchar', length: 100, nullable: true })
  lastName!: string | null;

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

  /**
   * Set when the welper continues past the signup background-check step after payment.
   */
  @Column({
    name: 'background_check_step_acknowledged_at',
    type: 'timestamptz',
    nullable: true,
  })
  backgroundCheckStepAcknowledgedAt!: Date | null;

  /**
   * True when the welper chose ad-hoc-only availability during signup (no recurring slots).
   */
  @Column({
    name: 'availability_ad_hoc_only',
    type: 'boolean',
    default: false,
  })
  availabilityAdHocOnly!: boolean;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @Column({ name: 'profile_photo_url', type: 'varchar', nullable: true })
  profilePhotoUrl!: string | null;

  @Column({ name: 'service_area', type: 'jsonb', nullable: true })
  serviceArea!: ServiceArea | null; // Geographic boundaries (GeoJSON)

  @Column({ name: 'latitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude!: number | null; // Searchable point for radius (synced from service_area Point)

  @Column({ name: 'longitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude!: number | null;

  @Column({ name: 'country_code', type: 'varchar', length: 2, nullable: true })
  countryCode!: string | null;

  @Column({ name: 'province_code', type: 'varchar', length: 10, nullable: true })
  provinceCode!: string | null;

  @Column({ name: 'rating', type: 'decimal', precision: 3, scale: 2, nullable: true })
  rating!: number | null;

  @Column({ name: 'review_count', type: 'integer', default: 0 })
  reviewCount!: number;

  /**
   * Trust signal: KYC-verified flag. Defaults to false; only ops/product can flip
   * via the (separate) KYC workflow. Bible §22.6 forbids fake trust signals,
   * so existing welpers stay unverified until explicitly cleared.
   */
  @Column({ name: 'verified', type: 'boolean', default: false })
  verified!: boolean;

  /** Service-area location: free-form city name (e.g. "Toronto"). */
  @Column({ name: 'service_area_city', type: 'varchar', length: 120, nullable: true })
  serviceAreaCity!: string | null;

  /**
   * Postal-code prefixes the welper serves (e.g. ["M5V","M5W","M6G"]).
   * Stored as JSONB string array; empty array means "all of city".
   */
  @Column({ name: 'service_area_postal_codes', type: 'jsonb', nullable: true })
  serviceAreaPostalCodes!: string[] | null;

  @Column({
    type: 'enum',
    enum: ProfileCompletionStatus,
    name: 'profile_completion_status',
    default: ProfileCompletionStatus.INCOMPLETE,
  })
  profileCompletionStatus!: ProfileCompletionStatus;

  @Column({
    type: 'enum',
    enum: ProfileVisibility,
    name: 'profile_visibility',
    default: ProfileVisibility.PUBLIC,
  })
  profileVisibility!: ProfileVisibility;

  @Column({ name: 'onboarding_completed', type: 'boolean', default: false })
  onboardingCompleted!: boolean;

  /**
   * Welper-payout signup-step choice. NULL = not yet visited; otherwise the
   * orchestrator's `getState` marks the step complete. See
   * `payout-method-choice.enum.ts` for the contract.
   */
  @Column({
    name: 'payout_method_choice',
    type: 'enum',
    enum: PayoutMethodChoice,
    nullable: true,
  })
  payoutMethodChoice!: PayoutMethodChoice | null;

  /** Stripe Connect Express account id (`acct_…`). */
  @Column({
    name: 'stripe_connect_account_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  stripeConnectAccountId!: string | null;

  // Relations
  // Note: ServiceOffering doesn't have @ManyToOne relationship to avoid FK constraint issues
  // We query service offerings by welperId directly
  // serviceOfferings?: ServiceOffering[];

  @OneToMany(() => AvailabilityCalendar, (calendar) => calendar.welperProfile)
  availabilityCalendars!: AvailabilityCalendar[];
}

