import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  IsBoolean,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Category name', example: 'Care' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ description: 'Category description' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ description: 'Parent category ID (for subcategories)' })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional({ description: 'Display order', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Icon name or URL' })
  @IsOptional()
  @IsString()
  icon?: string | null;

  @ApiPropertyOptional({ description: 'Is category active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
