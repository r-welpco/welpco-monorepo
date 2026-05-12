import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentType } from '../../entities/static-content.entity';

export class StaticContentResponseDto {
  @ApiProperty({ description: 'Content ID' })
  id!: string;

  @ApiProperty({ description: 'Content type', enum: ContentType })
  contentType!: ContentType;

  @ApiProperty({ description: 'Content title' })
  title!: string;

  @ApiProperty({ description: 'Content body' })
  body!: string;

  @ApiProperty({ description: 'Content version' })
  version!: number;

  @ApiProperty({ description: 'Is content published' })
  isPublished!: boolean;

  @ApiPropertyOptional({ description: 'Published date' })
  publishedDate?: Date | null;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt!: Date;
}
