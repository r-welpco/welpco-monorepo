import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateBackgroundCheckCheckoutDto {
  @ApiPropertyOptional({
    description: 'Locale prefix for Stripe return URLs (en or fr)',
    example: 'fr',
  })
  @IsOptional()
  @IsString()
  @IsIn(['en', 'fr'])
  locale?: 'en' | 'fr';
}
