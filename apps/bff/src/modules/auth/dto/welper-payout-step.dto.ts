import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * Day 15 — Phase 1 of the signup ↔ onboarding merge.
 *
 * Welper-only step. Skippable: the wizard does not block on Stripe Connect
 * onboarding success. The welper either:
 *  - completes Stripe Connect (stripeOnboardingCompleted: true), OR
 *  - explicitly defers (skip: true) — they'll see a banner on the dashboard
 *    "You can't receive payments until you finish payout setup" and the
 *    payout-related dashboard CTAs route back to Stripe Connect.
 *
 * Exactly one of the two must be true (XOR). The Stripe Connect account
 * creation itself happens out-of-band (Stripe-hosted onboarding flow),
 * keeping the wizard free of payment data — bible §22.6 + the Phase 1
 * boundary.
 *
 * Open question for Phase 2 / Phase 3 (flagged in AUDIT-LOG follow-ups):
 * does the wizard own the Stripe Connect account-link creation
 * round-trip (web wizard → BFF → Stripe → redirect → wizard payout step
 * with status param), or does the dashboard own it after the wizard
 * finishes? Phase 1 only models the persistence shape.
 */
@ValidatorConstraint({ name: 'hasOnePayoutChoice', async: false })
class HasOnePayoutChoiceConstraint implements ValidatorConstraintInterface {
  validate(_v: unknown, args: ValidationArguments): boolean {
    const dto = args.object as WelperPayoutStepDto;
    const completed = dto.stripeOnboardingCompleted === true;
    const skipped = dto.skip === true;
    return (completed && !skipped) || (!completed && skipped);
  }

  defaultMessage(): string {
    return 'Provide either stripeOnboardingCompleted: true or skip: true — not both.';
  }
}

export class WelperPayoutStepDto {
  @ApiPropertyOptional({
    description:
      'Set to true after the welper completes Stripe Connect onboarding ' +
      'in the hosted flow. The orchestrator persists the choice; the ' +
      'actual Stripe Connect account state is verified out-of-band.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  stripeOnboardingCompleted?: boolean;

  @ApiPropertyOptional({
    description:
      'Set to true to defer Stripe Connect onboarding. The welper completes ' +
      'the wizard but cannot receive payments until they finish payout setup ' +
      'from the dashboard.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  skip?: boolean;

  @Validate(HasOnePayoutChoiceConstraint)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __payoutChoiceMarker?: any;
}
