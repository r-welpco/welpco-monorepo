import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';

export enum BookingRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  PAYMENT_RELEASED = 'payment_released',
  DECLINED = 'declined',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
  NO_SHOW = 'no_show',
}

@Entity('booking_requests')
export class BookingRequest extends BaseEntity {
  @Column({ name: 'customer_id', type: 'uuid' })
  customerId!: string;

  @Column({ name: 'welper_id', type: 'uuid' })
  welperId!: string;

  @Column({ name: 'service_offering_id', type: 'uuid' })
  serviceOfferingId!: string;

  @Column({ type: 'jsonb', default: {} })
  answers!: Record<string, string | number | boolean>;

  @Column({
    type: 'varchar',
    length: 32,
    default: BookingRequestStatus.PENDING,
  })
  status!: BookingRequestStatus;

  // Scheduling
  @Column({ name: 'scheduled_date', type: 'date', nullable: true })
  scheduledDate!: string | null;

  @Column({ name: 'scheduled_start_time', type: 'time', nullable: true })
  scheduledStartTime!: string | null;

  @Column({ name: 'scheduled_end_time', type: 'time', nullable: true })
  scheduledEndTime!: string | null;

  @Column({ name: 'duration_minutes', type: 'int', nullable: true })
  durationMinutes!: number | null;

  /** Timezone offset in minutes (e.g. -300 for EST) for cancellation policy evaluation */
  @Column({ name: 'timezone_offset_minutes', type: 'int', nullable: true })
  timezoneOffsetMinutes!: number | null;

  /** IANA timezone for the service location, for example America/Toronto. */
  @Column({ name: 'timezone_name', type: 'varchar', length: 64, nullable: true })
  timezoneName!: string | null;

  // Pricing
  @Column({ name: 'hourly_rate', type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourlyRate!: number | null;

  @Column({ name: 'total_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalPrice!: number | null;

  // Location & Notes
  @Column({ type: 'jsonb', nullable: true })
  address!: Record<string, string> | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  // Cancellation
  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason!: string | null;

  @Column({ name: 'cancelled_by', type: 'uuid', nullable: true })
  cancelledBy!: string | null;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt!: Date | null;

  @Column({ name: 'cancellation_source', type: 'varchar', length: 48, nullable: true })
  cancellationSource!: string | null;

  @Column({ name: 'cancellation_fee_cents', type: 'int', default: 0 })
  cancellationFeeCents!: number;

  // Decline
  @Column({ name: 'decline_reason', type: 'text', nullable: true })
  declineReason!: string | null;

  // Lifecycle timestamps
  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt!: Date | null;

  @Column({ name: 'declined_at', type: 'timestamptz', nullable: true })
  declinedAt!: Date | null;

  @Column({ name: 'checked_in_at', type: 'timestamptz', nullable: true })
  checkedInAt!: Date | null;

  @Column({ name: 'checked_out_at', type: 'timestamptz', nullable: true })
  checkedOutAt!: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  /** When customer payment capture finished and booking moved to payment_released. */
  @Column({ name: 'payment_released_at', type: 'timestamptz', nullable: true })
  paymentReleasedAt!: Date | null;

  /** Stripe Tax Calculation id used for the one-hour authorization hold. */
  @Column({ name: 'hold_stripe_tax_calculation_id', type: 'varchar', length: 255, nullable: true })
  holdStripeTaxCalculationId!: string | null;

  @Column({ name: 'payment_authorization_status', type: 'varchar', length: 32, nullable: true })
  paymentAuthorizationStatus!: string | null;

  @Column({ name: 'payment_authorization_scheduled_at', type: 'timestamptz', nullable: true })
  paymentAuthorizationScheduledAt!: Date | null;

  @Column({ name: 'payment_authorization_due_at', type: 'timestamptz', nullable: true })
  paymentAuthorizationDueAt!: Date | null;

  @Column({ name: 'payment_authorization_deadline_at', type: 'timestamptz', nullable: true })
  paymentAuthorizationDeadlineAt!: Date | null;

  @Column({ name: 'payment_authorization_expires_at', type: 'timestamptz', nullable: true })
  paymentAuthorizationExpiresAt!: Date | null;

  @Column({ name: 'payment_authorization_risk_code', type: 'varchar', length: 128, nullable: true })
  paymentAuthorizationRiskCode!: string | null;

  @Column({ name: 'payment_authorization_last_attempt_at', type: 'timestamptz', nullable: true })
  paymentAuthorizationLastAttemptAt!: Date | null;

  @Column({ name: 'payment_authorization_attempt_count', type: 'int', default: 0 })
  paymentAuthorizationAttemptCount!: number;

  @Column({ name: 'payment_authorization_failure_code', type: 'varchar', length: 128, nullable: true })
  paymentAuthorizationFailureCode!: string | null;

  @Column({ name: 'payment_authorization_failure_message', type: 'text', nullable: true })
  paymentAuthorizationFailureMessage!: string | null;

  @Column({ name: 'payment_authorization_lease_until', type: 'timestamptz', nullable: true })
  paymentAuthorizationLeaseUntil!: Date | null;
}
