import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceReceiptDto } from './service-receipt-summary.dto';

export class BookingResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() customerId!: string;
  @ApiProperty() welperId!: string;
  @ApiProperty() serviceOfferingId!: string;
  @ApiProperty() status!: string;
  @ApiProperty() answers!: Record<string, string | number | boolean>;

  @ApiPropertyOptional() scheduledDate!: string | null;
  @ApiPropertyOptional() scheduledStartTime!: string | null;
  @ApiPropertyOptional() scheduledEndTime!: string | null;
  @ApiPropertyOptional() durationMinutes!: number | null;
  @ApiPropertyOptional() timezoneName?: string | null;

  @ApiPropertyOptional() hourlyRate!: number | null;
  @ApiPropertyOptional() totalPrice!: number | null;

  @ApiPropertyOptional({
    description: 'Welper pre-tax service earnings in cents (from receipt subtotal share)',
  })
  welperEarningsCents?: number | null;

  @ApiPropertyOptional() address!: Record<string, string> | null;
  @ApiPropertyOptional() notes!: string | null;

  @ApiPropertyOptional() cancellationReason!: string | null;
  @ApiPropertyOptional() cancelledBy?: string | null;
  @ApiPropertyOptional() cancellationSource?: string | null;
  @ApiPropertyOptional() cancellationFeeCents?: number;
  @ApiPropertyOptional() declineReason!: string | null;

  @ApiPropertyOptional() acceptedAt!: Date | null;
  @ApiPropertyOptional() declinedAt!: Date | null;
  @ApiPropertyOptional() cancelledAt!: Date | null;
  @ApiPropertyOptional() checkedInAt!: Date | null;
  @ApiPropertyOptional() checkedOutAt!: Date | null;
  @ApiPropertyOptional() completedAt!: Date | null;

  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;

  /** Valid next statuses for the current user */
  @ApiPropertyOptional({ type: [String] })
  availableActions?: string[];

  @ApiPropertyOptional()
  paymentPhase?:
    | 'none'
    | 'scheduled'
    | 'pending'
    | 'requires_action'
    | 'authorized'
    | 'captured'
    | 'canceled'
    | 'failed';

  @ApiPropertyOptional()
  captureEligibleAt?: string | null;

  @ApiPropertyOptional()
  paymentAuthorizationStatus?: string | null;

  @ApiPropertyOptional()
  paymentAuthorizationDueAt?: string | null;

  @ApiPropertyOptional()
  paymentAuthorizationDeadlineAt?: string | null;

  @ApiPropertyOptional()
  paymentAuthorizationExpiresAt?: string | null;

  @ApiPropertyOptional()
  paymentAuthorizationRiskCode?: string | null;

  @ApiPropertyOptional()
  paymentAuthorizationLastAttemptAt?: string | null;

  @ApiPropertyOptional()
  paymentAuthorizationAttemptCount?: number;

  @ApiPropertyOptional()
  paymentAuthorizationFailureCode?: string | null;

  @ApiPropertyOptional()
  paymentAuthorizationFailureMessage?: string | null;

  @ApiPropertyOptional({ description: 'Admin-only Stripe PaymentIntent id' })
  stripePaymentIntentId?: string | null;

  @ApiPropertyOptional({ description: 'Admin-only Stripe Dashboard payment link' })
  stripeDashboardUrl?: string | null;

  @ApiPropertyOptional({ description: 'Admin-only Stripe Charge id' })
  stripeChargeId?: string | null;

  @ApiPropertyOptional({ description: 'Admin-only card brand for the active hold' })
  paymentCardBrand?: string | null;

  @ApiPropertyOptional({ description: 'Admin-only payment capture reason' })
  paymentCaptureReason?: string | null;

  @ApiPropertyOptional({ description: 'Present when SCA / confirm is required' })
  paymentClientSecret?: string | null;

  @ApiPropertyOptional({ type: ServiceReceiptDto })
  serviceReceipt?: ServiceReceiptDto | null;

  @ApiPropertyOptional({ description: 'Customer first name for booking detail display' })
  customerFirstName?: string | null;

  @ApiPropertyOptional({ description: 'Customer profile photo URL for booking detail display' })
  customerPhotoUrl?: string | null;

  @ApiPropertyOptional({
    description:
      'Last moment a participant can file a problem report after completion. Null while service is in progress.',
  })
  disputeReportDeadlineAt?: string | null;
}
