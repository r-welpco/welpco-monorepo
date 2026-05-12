import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatInboxItemDto {
  @ApiProperty()
  bookingId!: string;

  @ApiProperty()
  status!: string;

  @ApiPropertyOptional({ nullable: true })
  scheduledDate!: string | null;

  @ApiPropertyOptional({ nullable: true })
  scheduledStartTime!: string | null;

  @ApiProperty()
  otherPartyId!: string;

  @ApiPropertyOptional({ nullable: true, description: 'ISO timestamp of the latest message, if any' })
  lastMessageAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  lastMessagePreview!: string | null;

  @ApiPropertyOptional({ nullable: true })
  lastMessageSenderId!: string | null;

  @ApiProperty({ description: 'Use for sorting: max(last message time, booking updatedAt)' })
  sortAt!: string;

  /**
   * Wave 2 (BFF): the requesting user's last-read cursor for this thread.
   * `null` when the thread has never been opened by the requesting user (or
   * when no thread row exists yet). Pair with `lastMessageAt` to compute
   * unread-state without consulting localStorage:
   *   `unread = lastMessageAt != null && (lastReadAt == null || lastReadAt < lastMessageAt)`
   */
  @ApiPropertyOptional({
    type: 'string',
    nullable: true,
    description: 'ISO 8601 timestamp of the requesting user\'s last-read cursor; null means never read.',
  })
  lastReadAt!: string | null;
}
