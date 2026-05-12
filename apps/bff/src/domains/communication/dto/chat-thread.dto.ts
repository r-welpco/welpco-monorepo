import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatThreadDto {
  @ApiProperty({ description: 'Thread ID' })
  id!: string;

  @ApiProperty({ description: 'Booking ID this thread is scoped to' })
  bookingId!: string;

  @ApiProperty({ description: 'ISO 8601 timestamp' })
  createdAt!: string;

  @ApiProperty({ description: 'ISO 8601 timestamp' })
  updatedAt!: string;

  /**
   * Wave 2 (BFF): the requesting user's last-read cursor for this thread.
   * `null` means "never read". The other party's cursor is intentionally not
   * exposed — each user sees only their own read state. The chat is two-sided
   * server-side; presentation is single-sided per request.
   */
  @ApiPropertyOptional({
    type: 'string',
    nullable: true,
    description: 'ISO 8601 timestamp of the requesting user\'s last-read cursor; null means never read.',
  })
  lastReadAt!: string | null;
}
