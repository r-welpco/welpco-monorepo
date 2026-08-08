import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';
import {
  WELPER_SIGNUP_BIO_MAX_LENGTH,
  WELPER_SIGNUP_BIO_MIN_LENGTH,
} from '../../../domains/user-management/auth/signup.constants';
import { IsMarketplaceDescriptionAllowed } from '../../../common/validators/marketplace-description.validator';

/** Welper-only signup step: short public bio before dashboard setup. */
export class WelperBioStepDto {
  @ApiProperty({
    description: `Welper bio (${WELPER_SIGNUP_BIO_MIN_LENGTH}–${WELPER_SIGNUP_BIO_MAX_LENGTH} characters).`,
    example:
      'Friendly, reliable help with lawn care and seasonal cleanup in downtown Toronto.',
    minLength: WELPER_SIGNUP_BIO_MIN_LENGTH,
    maxLength: WELPER_SIGNUP_BIO_MAX_LENGTH,
  })
  @IsString()
  @MinLength(WELPER_SIGNUP_BIO_MIN_LENGTH, {
    message: `bio must be at least ${WELPER_SIGNUP_BIO_MIN_LENGTH} characters`,
  })
  @MaxLength(WELPER_SIGNUP_BIO_MAX_LENGTH, {
    message: `bio must be at most ${WELPER_SIGNUP_BIO_MAX_LENGTH} characters`,
  })
  @IsMarketplaceDescriptionAllowed()
  bio!: string;
}
