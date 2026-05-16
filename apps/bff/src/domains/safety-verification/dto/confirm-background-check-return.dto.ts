import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ConfirmBackgroundCheckReturnDto {
  @ApiProperty({ description: 'Stripe Checkout Session id from success redirect' })
  @IsString()
  @MinLength(8)
  sessionId!: string;
}
