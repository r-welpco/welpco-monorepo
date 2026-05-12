import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum SupportTicketAdminStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum SupportTicketAdminPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export class UpdateSupportTicketAdminDto {
  @ApiPropertyOptional({ enum: SupportTicketAdminStatus })
  @IsOptional()
  @IsEnum(SupportTicketAdminStatus)
  status?: SupportTicketAdminStatus;

  @ApiPropertyOptional({ enum: SupportTicketAdminPriority })
  @IsOptional()
  @IsEnum(SupportTicketAdminPriority)
  priority?: SupportTicketAdminPriority;

  /** Omit to leave unchanged; `null` or `""` clears assignment (validated in service). */
  @ApiPropertyOptional({ description: 'Admin user UUID; null or empty string unassigns' })
  @IsOptional()
  assignedToUserId?: string | null;

  @ApiPropertyOptional({ maxLength: 4000 })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  internalNote?: string | null;
}
