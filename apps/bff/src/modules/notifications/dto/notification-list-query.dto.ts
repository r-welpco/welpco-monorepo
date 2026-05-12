import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class NotificationListQueryDto {
  @ApiPropertyOptional({ description: 'Filter by read status' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({ description: 'Page number (1-based)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
