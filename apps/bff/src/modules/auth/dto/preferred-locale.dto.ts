import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { USER_PREFERRED_LOCALES } from '../../../common/preferred-locale';

/** Optional locale on auth/signup requests (en | fr). */
export class PreferredLocaleOptionalDto {
  @ApiPropertyOptional({
    description: 'Preferred language for emails and UI (en or fr)',
    enum: USER_PREFERRED_LOCALES,
    example: 'fr',
  })
  @IsOptional()
  @IsIn(USER_PREFERRED_LOCALES)
  preferredLocale?: 'en' | 'fr';
}

/** Body for PATCH /auth/preferred-locale */
export class UpdatePreferredLocaleDto {
  @ApiPropertyOptional({
    description: 'Preferred language for emails and UI',
    enum: USER_PREFERRED_LOCALES,
    example: 'fr',
  })
  @IsIn(USER_PREFERRED_LOCALES)
  preferredLocale!: 'en' | 'fr';
}
