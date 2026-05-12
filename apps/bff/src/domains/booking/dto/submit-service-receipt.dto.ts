import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitServiceReceiptDto {
  @IsISO8601()
  billingCheckInAt!: string;

  @IsISO8601()
  billingCheckOutAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
