import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

/**
 * SHARE-002: handle claim payload. Normalization (trim + lowercase) and the
 * regex/reserved-word checks happen in HandleService so the typed error codes
 * (`INVALID_HANDLE`, `HANDLE_RESERVED`, …) come back instead of a generic
 * class-validator 400.
 */
export class ClaimHandleDto {
  @ApiProperty({
    description:
      'Desired vanity handle — lowercase letters/digits/hyphens, 3–30 chars, must start with a letter or digit',
    example: 'marie-m',
    maxLength: 60,
  })
  @IsString()
  @MaxLength(60)
  handle!: string;
}

export class ClaimHandleResponseDto {
  @ApiProperty({ example: 'marie-m' })
  handle!: string;
}
