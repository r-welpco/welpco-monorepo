import { ApiProperty } from '@nestjs/swagger';

export class MessageDto {
  @ApiProperty({ description: 'Message ID' })
  id!: string;

  @ApiProperty({ description: 'Sender user ID' })
  senderId!: string;

  @ApiProperty({ description: 'Display name for the sender' })
  senderDisplayName!: string;

  @ApiProperty({ description: 'Message content' })
  content!: string;

  @ApiProperty({ description: 'ISO 8601 timestamp' })
  createdAt!: string;
}
