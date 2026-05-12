import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CompleteSetupIntentDto {
  @ApiProperty({ description: 'Stripe SetupIntent id (e.g. seti_...)' })
  @IsString()
  @IsNotEmpty()
  setupIntentId!: string;
}
