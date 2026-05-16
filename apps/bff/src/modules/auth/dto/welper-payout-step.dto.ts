import { ApiProperty } from '@nestjs/swagger';
import { Equals, IsBoolean } from 'class-validator';

/**
 * Welper-only signup step. Stripe Connect Express onboarding is required —
 * the wizard cannot proceed without a connected payout account.
 */
export class WelperPayoutStepDto {
  @ApiProperty({
    description:
      'Must be true after the welper completes Stripe Connect onboarding. ' +
      'The server verifies the connected account before marking this step complete.',
    example: true,
  })
  @IsBoolean()
  @Equals(true)
  stripeOnboardingCompleted!: true;
}
