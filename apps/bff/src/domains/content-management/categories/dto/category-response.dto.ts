import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({ description: 'Category ID' })
  id!: string;

  @ApiProperty({ description: 'Category name' })
  name!: string;

  @ApiPropertyOptional({ description: 'Category description' })
  description?: string | null;

  @ApiPropertyOptional({ description: 'Parent category ID' })
  parentId?: string | null;

  @ApiProperty({ description: 'Category level (1 = main, 2 = subcategory)' })
  level!: number;

  @ApiProperty({ description: 'Display order' })
  displayOrder!: number;

  @ApiPropertyOptional({ description: 'Icon name or URL' })
  icon?: string | null;

  @ApiProperty({ description: 'Is category active' })
  isActive!: boolean;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt!: Date;

  @ApiPropertyOptional({ description: 'Child categories', type: [CategoryResponseDto] })
  children?: CategoryResponseDto[];

  @ApiPropertyOptional({ description: 'Parent category' })
  parent?: CategoryResponseDto | null;
}
