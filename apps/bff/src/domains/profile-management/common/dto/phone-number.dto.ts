import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class PhoneNumberDto {
  @ApiProperty({
    description: 'Country code (e.g., "+1")',
    example: '+1',
  })
  @IsString()
  countryCode: string;

  @ApiProperty({
    description: 'Phone number (digits only, 7-15 digits)',
    example: '234567890',
  })
  @IsString()
  number: string;

  @ApiProperty({
    description: 'Formatted phone number (optional)',
    example: '+1 (234) 567-890',
    required: false,
  })
  @IsOptional()
  @IsString()
  formatted?: string;
}
