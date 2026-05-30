import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateJobApplicationDto {
  @ApiProperty({ description: 'Welper active offering that matches job subcategory' })
  @IsUUID()
  offeringId!: string;

  @ApiProperty({ description: 'Proposal message to the customer' })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  proposalMessage!: string;
}
