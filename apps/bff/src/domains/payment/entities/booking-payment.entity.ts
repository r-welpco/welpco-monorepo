import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';
import { BookingRequest } from '../../booking/entities/booking-request.entity';

export enum BookingPaymentRecordStatus {
  PENDING = 'pending',
  REQUIRES_ACTION = 'requires_action',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  CANCELED = 'canceled',
  FAILED = 'failed',
}

/** Primary authorization hold vs additional charge for receipt total above the hold */
export enum BookingPaymentKind {
  HOLD = 'hold',
  DELTA_RECEIPT = 'delta_receipt',
}

@Entity('booking_payments')
@Index(['bookingId'])
@Index(['welperId'])
@Index(['captureEligibleAt'])
export class BookingPayment extends BaseEntity {
  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId!: string;

  @ManyToOne(() => BookingRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking!: BookingRequest;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId!: string;

  @Column({ name: 'welper_id', type: 'uuid' })
  welperId!: string;

  @Column({ name: 'stripe_payment_intent_id', type: 'varchar', length: 255, unique: true })
  stripePaymentIntentId!: string;

  @Column({ name: 'amount_cents', type: 'int' })
  amountCents!: number;

  @Column({ type: 'varchar', length: 3, default: 'cad' })
  currency!: string;

  @Column({ type: 'varchar', length: 32, default: BookingPaymentRecordStatus.PENDING })
  status!: BookingPaymentRecordStatus;

  @Column({ name: 'payment_kind', type: 'varchar', length: 32, default: BookingPaymentKind.HOLD })
  paymentKind!: BookingPaymentKind;

  @Column({ name: 'captured_amount_cents', type: 'int', nullable: true })
  capturedAmountCents!: number | null;

  @Column({ name: 'capture_eligible_at', type: 'timestamptz', nullable: true })
  captureEligibleAt!: Date | null;

  @Column({ name: 'captured_at', type: 'timestamptz', nullable: true })
  capturedAt!: Date | null;

  /** Cumulative amount refunded on Stripe for this PaymentIntent’s charge (cents); updated from webhooks. */
  @Column({ name: 'refunded_amount_cents', type: 'int', nullable: true })
  refundedAmountCents!: number | null;

  @Column({ name: 'fully_refunded_at', type: 'timestamptz', nullable: true })
  fullyRefundedAt!: Date | null;

  @Column({ name: 'stripe_balance_transaction_id', type: 'varchar', length: 255, nullable: true })
  stripeBalanceTransactionId!: string | null;

  /** Stripe processing fee on this charge (platform-paid). */
  @Column({ name: 'stripe_fee_cents', type: 'int', nullable: true })
  stripeFeeCents!: number | null;
}
