import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export class MessagesQueryDto {
  @ApiPropertyOptional({ description: 'Page number (1-based)', default: DEFAULT_PAGE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = DEFAULT_PAGE;

  @ApiPropertyOptional({ description: 'Items per page', default: DEFAULT_LIMIT })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_LIMIT)
  limit?: number = DEFAULT_LIMIT;
}

export function getMessagesQueryParams(dto: MessagesQueryDto): { page: number; limit: number; skip: number } {
  const page = dto.page ?? DEFAULT_PAGE;
  const limit = dto.limit ?? DEFAULT_LIMIT;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
