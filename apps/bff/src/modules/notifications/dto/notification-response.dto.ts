import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty({ example: 'in_app' })
  channel!: string;

  @ApiProperty({ example: 'booking' })
  category!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  body!: string;

  @ApiProperty()
  isRead!: boolean;

  @ApiPropertyOptional({ nullable: true })
  readAt!: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'e.g. bookingId, actionUrl' })
  metadata!: Record<string, unknown> | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class NotificationListResponseDto {
  @ApiProperty({ type: [NotificationResponseDto] })
  items!: NotificationResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;
}

export class UnreadCountResponseDto {
  @ApiProperty()
  count!: number;
}
