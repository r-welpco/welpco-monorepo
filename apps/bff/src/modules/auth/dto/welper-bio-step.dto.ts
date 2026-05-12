import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

/**
 * Day 15 — Phase 1 of the signup ↔ onboarding merge.
 *
 * Welper-only step. The min 120 / max 2000 floor was set after looking at the
 * existing `update-welper-profile.dto.ts` (min 50, max 2000) — the wizard
 * raises the floor to 120 because public welper profiles render the bio in
 * the hero (Wave 1 trust signal); under 120 chars reads as placeholder.
 */
export class WelperBioStepDto {
  @ApiProperty({
    description: 'Welper bio (120–2000 characters).',
    example:
      'Bilingual lawn-care specialist serving downtown Toronto for the last 6 years. ' +
      'I cover small-yard mow, hedge trim and seasonal cleanup, and I bring my own gear.',
    minLength: 120,
    maxLength: 2000,
  })
  @IsString()
  @MinLength(120, { message: 'bio must be at least 120 characters' })
  @MaxLength(2000, { message: 'bio must be at most 2000 characters' })
  bio!: string;
}
