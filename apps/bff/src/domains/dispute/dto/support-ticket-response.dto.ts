import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SupportTicketResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  subject!: string;

  @ApiProperty()
  category!: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty()
  priority!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({ nullable: true })
  assignedToUserId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  internalNote?: string | null;
}
