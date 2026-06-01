import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class HumanVerificationDto {
  @ApiPropertyOptional({ description: 'Cloudflare Turnstile response token' })
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  turnstileToken?: string;

  @ApiPropertyOptional({ description: 'Spam honeypot field. Must remain empty.' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}
