import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

const MAX_CONTENT_LENGTH = 4000;

export class SendMessageDto {
  @ApiProperty({ description: 'Message content', maxLength: MAX_CONTENT_LENGTH })
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_CONTENT_LENGTH)
  content!: string;
}
