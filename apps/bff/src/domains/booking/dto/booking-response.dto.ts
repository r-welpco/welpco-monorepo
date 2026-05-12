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

  @ApiPropertyOptional() hourlyRate!: number | null;
  @ApiPropertyOptional() totalPrice!: number | null;

  @ApiPropertyOptional() address!: Record<string, string> | null;
  @ApiPropertyOptional() notes!: string | null;

  @ApiPropertyOptional() cancellationReason!: string | null;
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
  paymentPhase?: 'none' | 'pending' | 'requires_action' | 'authorized' | 'captured' | 'canceled' | 'failed';

  @ApiPropertyOptional()
  captureEligibleAt?: string | null;

  @ApiPropertyOptional({ description: 'Present when SCA / confirm is required' })
  paymentClientSecret?: string | null;

  @ApiPropertyOptional({ type: ServiceReceiptDto })
  serviceReceipt?: ServiceReceiptDto | null;
}
