import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength, IsIn } from 'class-validator';

const CATEGORIES = ['account', 'billing', 'other'] as const;
const PRIORITIES = ['low', 'medium', 'high'] as const;

export class CreateSupportTicketDto {
  @ApiProperty({ description: 'Subject', minLength: 5, maxLength: 255 })
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  subject!: string;

  @ApiPropertyOptional({ description: 'Category', enum: CATEGORIES })
  @IsOptional()
  @IsString()
  @IsIn(CATEGORIES)
  category?: (typeof CATEGORIES)[number];

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ description: 'Priority', enum: PRIORITIES })
  @IsOptional()
  @IsString()
  @IsIn(PRIORITIES)
  priority?: (typeof PRIORITIES)[number];
}
