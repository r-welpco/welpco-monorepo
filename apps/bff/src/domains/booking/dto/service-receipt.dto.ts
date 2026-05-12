import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingResponseDto } from './booking-response.dto';
import { ServiceReceiptDto } from './service-receipt-summary.dto';

export { ServiceReceiptDto } from './service-receipt-summary.dto';

export class ServiceReceiptDraftDto {
  @ApiProperty() bookingId!: string;
  @ApiProperty() hourlyRate!: number;
  @ApiProperty() suggestedBillingCheckInAt!: string;
  @ApiProperty() suggestedBillingCheckOutAt!: string;
  @ApiProperty() computedTotalCents!: number;
  @ApiProperty() currency!: string;
  @ApiPropertyOptional({ description: 'Authorized hold amount in cents, if any' })
  authorizedHoldCents!: number | null;
  @ApiPropertyOptional({ type: ServiceReceiptDto })
  confirmedReceipt!: ServiceReceiptDto | null;
}

export class ConfirmServiceReceiptResponseDto {
  @ApiProperty({ description: 'Updated booking' })
  booking!: BookingResponseDto;

  @ApiProperty({ type: ServiceReceiptDto })
  receipt!: ServiceReceiptDto;

  @ApiPropertyOptional({
    description: 'When receipt exceeds the hold, customer may need to complete SCA for the balance',
  })
  deltaPayment?: {
    clientSecret: string | null;
    paymentIntentId: string;
    requiresAction: boolean;
  };
}
